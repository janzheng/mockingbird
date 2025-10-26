/**
 * Shared type definitions and interfaces for Mockingbird
 * These types work across frontend and backend, and across all platforms (Val Town, Cloudflare Workers, etc.)
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Unique identifier for the search result
 * @property {string} title - Title of the result
 * @property {string} url - URL of the result
 * @property {string} snippet - Short text snippet/summary
 * @property {string} [content] - Full content if available
 * @property {string} source - Source of the result (e.g., "tavily", "exa", "jina")
 * @property {number} score - Relevance score (0-1)
 * @property {string} publishedDate - ISO date string
 * @property {string} [imageUrl] - URL to associated image if available
 * @property {Record<string, any>} [metadata] - Additional metadata from provider
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} query - The search query string
 * @property {string} [provider] - Search provider to use (defaults to configured provider)
 * @property {number} [maxResults] - Maximum number of results (default: 10)
 * @property {string} [searchDepth] - "basic" or "advanced"
 * @property {string} [topic] - "general" or "news"
 * @property {string[]} [includeDomains] - List of domains to include
 * @property {string[]} [excludeDomains] - List of domains to exclude
 * @property {boolean} [includeImages] - Include images in results
 * @property {boolean} [includeAnswer] - Include AI-generated answer
 * @property {Record<string, any>} [providerOptions] - Provider-specific options
 */

/**
 * @typedef {Object} SearchResponse
 * @property {boolean} success - Whether the search was successful
 * @property {string} query - The original query
 * @property {string} provider - The provider that was used
 * @property {SearchResult[]} results - Array of search results
 * @property {string} [answer] - AI-generated answer if requested
 * @property {number} totalResults - Total number of results
 * @property {number} timestamp - Unix timestamp of when search was performed
 * @property {string} [error] - Error message if search failed
 * @property {Record<string, any>} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - Unique identifier for the alert
 * @property {string} name - Human-readable name for the alert
 * @property {string} query - Search query for this alert
 * @property {string} provider - Search provider to use
 * @property {string} frequency - Cron expression or frequency string
 * @property {boolean} active - Whether the alert is currently active
 * @property {string[]} [notificationChannels] - Where to send notifications (email, webhook, etc.)
 * @property {SearchQuery} searchOptions - Options for the search
 * @property {number} createdAt - Unix timestamp
 * @property {number} updatedAt - Unix timestamp
 * @property {number} [lastRunAt] - Unix timestamp of last execution
 * @property {Record<string, any>} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} AlertRun
 * @property {string} id - Unique identifier for this run
 * @property {string} alertId - ID of the alert this run belongs to
 * @property {number} timestamp - Unix timestamp of when this run occurred
 * @property {boolean} success - Whether the run was successful
 * @property {SearchResponse} searchResponse - The search response
 * @property {number} newResults - Number of new results found
 * @property {string[]} newResultIds - IDs of new results
 * @property {string} [error] - Error message if run failed
 * @property {Record<string, any>} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} Feed
 * @property {string} id - Unique identifier for the feed
 * @property {string} name - Human-readable name for the feed
 * @property {string} description - Description of the feed
 * @property {string[]} alertIds - IDs of alerts that belong to this feed
 * @property {boolean} public - Whether the feed is publicly accessible
 * @property {string} slug - URL-friendly slug for the feed
 * @property {number} createdAt - Unix timestamp
 * @property {number} updatedAt - Unix timestamp
 * @property {Record<string, any>} [settings] - Feed display settings
 */

/**
 * @typedef {Object} FeedItem
 * @property {string} id - Unique identifier
 * @property {string} feedId - ID of the feed this item belongs to
 * @property {string} alertId - ID of the alert that generated this item
 * @property {SearchResult} result - The search result
 * @property {number} timestamp - When this item was added to the feed
 * @property {boolean} read - Whether the item has been marked as read
 * @property {boolean} starred - Whether the item has been starred
 * @property {string[]} [tags] - User-defined tags
 */

// Export helper functions for creating these objects

/**
 * Create a standardized SearchResult from provider-specific data
 * @param {Object} providerResult - Raw result from search provider
 * @param {string} provider - Name of the provider
 * @returns {SearchResult}
 */
export function createSearchResult(providerResult, provider) {
  return {
    id: providerResult.id || crypto.randomUUID(),
    title: providerResult.title || "",
    url: providerResult.url || "",
    snippet: providerResult.snippet || providerResult.description || "",
    content: providerResult.content || undefined,
    source: provider,
    score: providerResult.score || 0,
    publishedDate: providerResult.publishedDate || providerResult.published_date || new Date().toISOString(),
    imageUrl: providerResult.imageUrl || providerResult.image_url || undefined,
    metadata: providerResult.metadata || {},
  };
}

/**
 * Create a standardized SearchResponse
 * @param {Object} params
 * @returns {SearchResponse}
 */
export function createSearchResponse({
  success = true,
  query = "",
  provider = "",
  results = [],
  answer = undefined,
  error = undefined,
  metadata = {},
}) {
  return {
    success,
    query,
    provider,
    results,
    answer,
    totalResults: results.length,
    timestamp: Date.now(),
    error,
    metadata,
  };
}

/**
 * Create a new Alert
 * @param {Object} params
 * @returns {Alert}
 */
export function createAlert({
  name,
  query,
  provider = "tavily",
  frequency = "0 */6 * * *", // Every 6 hours by default
  searchOptions = {},
  notificationChannels = [],
}) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    query,
    provider,
    frequency,
    active: true,
    notificationChannels,
    searchOptions,
    createdAt: now,
    updatedAt: now,
    metadata: {},
  };
}

/**
 * Create a new Feed
 * @param {Object} params
 * @returns {Feed}
 */
export function createFeed({
  name,
  description = "",
  alertIds = [],
  isPublic = false,
  slug,
}) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    description,
    alertIds,
    public: isPublic,
    slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    createdAt: now,
    updatedAt: now,
    settings: {},
  };
}

