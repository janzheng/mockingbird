import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { tavily } from "npm:@tavily/core";

/**
 * Extract web page content from specified URLs using Tavily Extract
 * 
 * @param {string|Array<string>} urls - A single URL or array of URLs to extract content from
 * @param {Object} options - Optional parameters for the Tavily Extract API
 * @param {boolean} options.includeImages - Include a list of images extracted from the URLs (default: false)
 * @param {boolean} options.includeFavicon - Include the favicon URL for each result (default: false)
 * @param {string} options.extractDepth - "basic" or "advanced" (default: "basic")
 *   - advanced: Retrieves more data including tables and embedded content with higher success but may increase latency
 *   - basic: Costs 1 credit per 5 successful URL extractions
 *   - advanced: Costs 2 credits per 5 successful URL extractions
 * @param {string} options.format - "markdown" or "text" (default: "markdown")
 *   - markdown: Returns content in markdown format
 *   - text: Returns plain text and may increase latency
 * @param {number} options.timeout - Maximum time in seconds to wait (1.0-60.0)
 *   - Default: 10 seconds for basic, 30 seconds for advanced
 * @returns {Promise<Object>} - Response object with results, failed_results, response_time, and request_id
 * @example
 * const result = await extractWithTavily("https://en.wikipedia.org/wiki/Artificial_intelligence");
 * const multiResults = await extractWithTavily([
 *   "https://example.com/page1",
 *   "https://example.com/page2"
 * ]);
 */
export async function extractWithTavily(urls, options = {}) {
  const tvly = tavily({ 
    apiKey: Deno.env.get("TAVILY_API_KEY") 
  });

  // Ensure urls is always an array for the API
  const urlsArray = Array.isArray(urls) ? urls : [urls];

  // Prepare the options object (separate from URLs)
  const extractOptions = {
    ...(options.includeImages !== undefined && { include_images: options.includeImages }),
    ...(options.includeFavicon !== undefined && { include_favicon: options.includeFavicon }),
    ...(options.extractDepth !== undefined && { extract_depth: options.extractDepth }),
    ...(options.format !== undefined && { format: options.format }),
    ...(options.timeout !== undefined && { timeout: options.timeout }),
  };

  try {
    // Pass URLs as first argument, options as second
    const response = await tvly.extract(urlsArray, extractOptions);
    return response;
  } catch (error) {
    console.error("Tavily extract error:", error);
    throw error;
  }
}

/**
 * Extract content from a single URL
 * 
 * @param {string} url - URL to extract content from
 * @param {Object} options - Optional parameters (same as extractWithTavily)
 * @returns {Promise<Object|null>} - Single result object or null if extraction failed
 */
export async function extractSingleUrl(url, options = {}) {
  const response = await extractWithTavily(url, options);
  return response.results && response.results.length > 0 ? response.results[0] : null;
}

/**
 * Extract raw content from URLs
 * 
 * @param {string|Array<string>} urls - URL(s) to extract content from
 * @param {Object} options - Optional parameters (same as extractWithTavily)
 * @returns {Promise<Array<Object>>} - Array of result objects with raw_content
 */
export async function extractRawContent(urls, options = {}) {
  const response = await extractWithTavily(urls, options);
  return response.results || [];
}

/**
 * Extract content with advanced depth for more comprehensive results
 * 
 * @param {string|Array<string>} urls - URL(s) to extract content from
 * @param {Object} options - Optional parameters (same as extractWithTavily)
 * @returns {Promise<Object>} - Full response object from Tavily API
 */
export async function extractAdvanced(urls, options = {}) {
  return await extractWithTavily(urls, {
    ...options,
    extractDepth: "advanced",
  });
}

/**
 * Extract content as plain text instead of markdown
 * 
 * @param {string|Array<string>} urls - URL(s) to extract content from
 * @param {Object} options - Optional parameters (same as extractWithTavily)
 * @returns {Promise<Object>} - Full response object from Tavily API
 */
export async function extractAsText(urls, options = {}) {
  return await extractWithTavily(urls, {
    ...options,
    format: "text",
  });
}

/**
 * Extract content with images included
 * 
 * @param {string|Array<string>} urls - URL(s) to extract content from
 * @param {Object} options - Optional parameters (same as extractWithTavily)
 * @returns {Promise<Object>} - Full response object with images included
 */
export async function extractWithImages(urls, options = {}) {
  return await extractWithTavily(urls, {
    ...options,
    includeImages: true,
    includeFavicon: true,
  });
}

/**
 * Batch extract content from multiple URLs
 * Note: Maximum 20 URLs are allowed per request
 * 
 * @param {Array<string>} urls - Array of URLs to extract (max 20)
 * @param {Object} options - Optional parameters (same as extractWithTavily)
 * @returns {Promise<Object>} - Full response object with results for all URLs
 */
export async function batchExtract(urls, options = {}) {
  if (!Array.isArray(urls)) {
    throw new Error("batchExtract requires an array of URLs");
  }
  if (urls.length > 20) {
    throw new Error("Maximum 20 URLs are allowed per request");
  }
  return await extractWithTavily(urls, options);
}

