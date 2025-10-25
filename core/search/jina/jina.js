import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown

/**
 * Search the web using Jina Search (s.jina.ai)
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters for the Jina Search API
 * @param {number} options.timeout - Maximum page load wait time in seconds
 * @param {number} options.tokenBudget - Limits maximum tokens used for this request
 * @returns {Promise<Object>} - Search results with 5 entries in JSON format
 */
export async function searchWithJina(query, options = {}) {
  const apiKey = Deno.env.get("JINA_API_KEY");
  const baseUrl = "https://s.jina.ai";
  
  // Build the full URL with encoded query
  const targetUrl = `${baseUrl}/${encodeURIComponent(query)}`;
  
  // Build headers
  const headers = {
    "Accept": "application/json",
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Add optional headers
  if (options.timeout !== undefined) {
    headers["X-Timeout"] = String(options.timeout);
  }
  if (options.tokenBudget !== undefined) {
    headers["X-Max-Tokens"] = String(options.tokenBudget);
  }

  try {
    const response = await fetch(targetUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Jina Search error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Jina Search error:", error);
    throw error;
  }
}

/**
 * Search and get just the results array
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array>} - Array of search results
 */
export async function searchJinaResults(query, options = {}) {
  const response = await searchWithJina(query, options);
  return response.data || [];
}

