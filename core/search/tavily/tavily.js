import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { tavily } from "npm:@tavily/core";

/**
 * Search using Tavily
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters for the Tavily API
 * @param {string} options.searchDepth - "basic" or "advanced" (default: "basic")
 * @param {string} options.topic - "general" or "news" (default: "general")
 * @param {number} options.maxResults - Maximum number of results (default: 5)
 * @param {Array<string>} options.includeImages - Include images in results
 * @param {Array<string>} options.includeAnswer - Include AI-generated answer
 * @param {Array<string>} options.includeRawContent - Include raw HTML content
 * @param {Array<string>} options.includeDomains - List of domains to include
 * @param {Array<string>} options.excludeDomains - List of domains to exclude
 * @returns {Promise<Object>} - Full response object from Tavily API
 */
export async function searchWithTavily(query, options = {}) {
  const tvly = tavily({ 
    apiKey: Deno.env.get("TAVILY_API_KEY") 
  });

  // Prepare the request parameters
  const requestParams = {
    query,
    ...(options.searchDepth !== undefined && { searchDepth: options.searchDepth }),
    ...(options.topic !== undefined && { topic: options.topic }),
    ...(options.maxResults !== undefined && { maxResults: options.maxResults }),
    ...(options.includeImages !== undefined && { includeImages: options.includeImages }),
    ...(options.includeAnswer !== undefined && { includeAnswer: options.includeAnswer }),
    ...(options.includeRawContent !== undefined && { includeRawContent: options.includeRawContent }),
    ...(options.includeDomains !== undefined && { includeDomains: options.includeDomains }),
    ...(options.excludeDomains !== undefined && { excludeDomains: options.excludeDomains }),
  };

  try {
    const response = await tvly.search(query, requestParams);
    return response;
  } catch (error) {
    console.error("Tavily search error:", error);
    throw error;
  }
}

/**
 * Get just the results array from a Tavily search
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters (same as searchWithTavily)
 * @returns {Promise<Array>} - Array of search results
 */
export async function searchTavilyResults(query, options = {}) {
  const response = await searchWithTavily(query, options);
  return response.results || [];
}

/**
 * Get the AI-generated answer from Tavily
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters (same as searchWithTavily)
 * @returns {Promise<string>} - AI-generated answer
 */
export async function searchTavilyAnswer(query, options = {}) {
  const response = await searchWithTavily(query, {
    ...options,
    includeAnswer: true,
  });
  return response.answer || "";
}

/**
 * Search with advanced depth for more comprehensive results
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters (same as searchWithTavily)
 * @returns {Promise<Object>} - Full response object from Tavily API
 */
export async function searchTavilyAdvanced(query, options = {}) {
  return await searchTavilyResults(query, {
    ...options,
    chunks_per_source: 3,
    include_raw_content: 'markdown',
    searchDepth: "advanced",
  });
}

/**
 * Search for news articles
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters (same as searchWithTavily)
 * @returns {Promise<Object>} - Full response object from Tavily API
 */
export async function searchTavilyNews(query, options = {}) {
  return await searchWithTavily(query, {
    chunks_per_source: 3,
    ...options,
    topic: "news",
  });
}

