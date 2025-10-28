import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown

const EXA_API_BASE = "https://api.exa.ai";

/**
 * Search with Exa
 * 
 * @param {string} query - The query string for the search
 * @param {Object} options - Optional parameters for the Exa Search API
 * @param {string} options.type - Search type: "keyword", "neural", "fast", or "auto" (default)
 * @param {string} options.category - Data category: "company", "research paper", "news", "pdf", "github", "tweet", "personal site", "linkedin profile", "financial report"
 * @param {string} options.userLocation - Two-letter ISO country code (e.g., "US")
 * @param {number} options.numResults - Number of results (default: 10, max varies by type)
 * @param {Array<string>} options.includeDomains - Domains to include
 * @param {Array<string>} options.excludeDomains - Domains to exclude
 * @param {string} options.startCrawlDate - ISO 8601 date string
 * @param {string} options.endCrawlDate - ISO 8601 date string
 * @param {string} options.startPublishedDate - ISO 8601 date string
 * @param {string} options.endPublishedDate - ISO 8601 date string
 * @param {Array<string>} options.includeText - Text that must be present (max 1 string, 5 words)
 * @param {Array<string>} options.excludeText - Text that must not be present (max 1 string, 5 words)
 * @param {boolean|Object} options.context - Return context string for LLM
 * @param {boolean} options.moderation - Enable content moderation
 * @param {Object} options.contents - Contents options (text, highlights, summary, etc.)
 * @returns {Promise<Object>} - Full response object from Exa API
 */
export async function searchWithExa(query, options = {}) {
  const apiKey = Deno.env.get("EXA_API_KEY");
  
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is required");
  }

  const requestBody = {
    query,
    ...(options.type !== undefined && { type: options.type }),
    ...(options.category !== undefined && { category: options.category }),
    ...(options.userLocation !== undefined && { userLocation: options.userLocation }),
    ...(options.numResults !== undefined && { numResults: options.numResults }),
    ...(options.includeDomains !== undefined && { includeDomains: options.includeDomains }),
    ...(options.excludeDomains !== undefined && { excludeDomains: options.excludeDomains }),
    ...(options.startCrawlDate !== undefined && { startCrawlDate: options.startCrawlDate }),
    ...(options.endCrawlDate !== undefined && { endCrawlDate: options.endCrawlDate }),
    ...(options.startPublishedDate !== undefined && { startPublishedDate: options.startPublishedDate }),
    ...(options.endPublishedDate !== undefined && { endPublishedDate: options.endPublishedDate }),
    ...(options.includeText !== undefined && { includeText: options.includeText }),
    ...(options.excludeText !== undefined && { excludeText: options.excludeText }),
    ...(options.context !== undefined && { context: options.context }),
    ...(options.moderation !== undefined && { moderation: options.moderation }),
    ...(options.contents !== undefined && { contents: options.contents }),
  };

  try {
    const response = await fetch(`${EXA_API_BASE}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Exa Search error:", error);
    throw error;
  }
}

/**
 * Search and get contents in one call
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search and content options
 * @returns {Promise<Object>} - Search results with contents
 */
export async function searchAndContents(query, options = {}) {
  const contents = {
    text: options.text !== undefined ? options.text : true,
    ...(options.highlights && { highlights: options.highlights }),
    ...(options.summary && { summary: options.summary }),
    ...(options.livecrawl && { livecrawl: options.livecrawl }),
    ...(options.livecrawlTimeout && { livecrawlTimeout: options.livecrawlTimeout }),
    ...(options.subpages && { subpages: options.subpages }),
    ...(options.subpageTarget && { subpageTarget: options.subpageTarget }),
    ...(options.extras && { extras: options.extras }),
  };

  return await searchWithExa(query, {
    ...options,
    contents,
  });
}

/**
 * Get just the results array
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of search results
 */
export async function getResults(query, options = {}) {
  const response = await searchWithExa(query, options);
  return response.results || [];
}

/**
 * Get context string for LLM
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<string>} - Context string combining all results
 */
export async function getContext(query, options = {}) {
  const response = await searchWithExa(query, {
    ...options,
    context: options.context || true,
  });
  return response.context || "";
}

/**
 * Neural search (embeddings-based)
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function neuralSearch(query, options = {}) {
  return await searchWithExa(query, {
    ...options,
    type: "neural",
  });
}

/**
 * Keyword search (Google-like SERP)
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function keywordSearch(query, options = {}) {
  return await searchWithExa(query, {
    ...options,
    type: "keyword",
  });
}

/**
 * Fast search (streamlined neural and keyword)
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function fastSearch(query, options = {}) {
  return await searchWithExa(query, {
    ...options,
    type: "fast",
  });
}

/**
 * Search for research papers
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function searchResearchPapers(query, options = {}) {
  return await searchAndContents(query, {
    ...options,
    category: "research paper",
  });
}

/**
 * Search for news articles
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function searchNews(query, options = {}) {
  return await searchAndContents(query, {
    ...options,
    category: "news",
  });
}

/**
 * Search for companies
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function searchCompanies(query, options = {}) {
  return await searchAndContents(query, {
    ...options,
    category: "company",
  });
}

/**
 * Search GitHub repositories
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function searchGitHub(query, options = {}) {
  return await searchAndContents(query, {
    ...options,
    category: "github",
  });
}

/**
 * Search LinkedIn posts
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function searchLinkedInPosts(query, options = {}) {
  return await searchAndContents(query, {
    ...options,
    includeDomains: ["linkedin.com"],
    // Use neural search by default for better semantic matching
    type: options.type || "neural",
  });
}

