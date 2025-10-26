/**
 * Unified Search Harness
 * 
 * This module provides a standardized interface for all search providers.
 * It abstracts away provider-specific implementations and returns consistent SearchResponse objects.
 */

import { createSearchResult, createSearchResponse } from './types.js';

/**
 * Search providers registry
 * Dynamically import providers as needed to avoid loading all dependencies
 */
const PROVIDERS = {
  tavily: {
    name: 'Tavily',
    import: () => import('../core/search/tavily/tavily.js'),
  },
  exa: {
    name: 'Exa',
    import: () => import('../core/search/exa-search/exa-search.js'),
  },
  jina: {
    name: 'Jina',
    import: () => import('../core/search/jina/jina.js'),
  },
  compound: {
    name: 'Groq Compound',
    import: () => import('../core/search/groq-compound/compound.js'),
  },
};

/**
 * Normalize provider-specific results to our standard SearchResult format
 * @param {Array} results - Raw results from provider
 * @param {string} provider - Provider name
 * @returns {Array<SearchResult>}
 */
function normalizeResults(results, provider) {
  if (!Array.isArray(results)) return [];
  
  return results.map(result => {
    // Common normalization logic
    let normalized = {
      title: result.title || result.name || "",
      url: result.url || result.link || "",
      snippet: result.snippet || result.description || result.text || "",
      score: result.score || result.relevance || 0,
      publishedDate: result.publishedDate || result.published_date || result.date || new Date().toISOString(),
    };

    // Provider-specific normalization
    switch (provider) {
      case 'tavily':
        normalized = {
          ...normalized,
          content: result.raw_content,
          imageUrl: result.image_url,
        };
        break;
      
      case 'exa':
        normalized = {
          ...normalized,
          content: result.text,
          publishedDate: result.publishedDate || new Date().toISOString(),
        };
        break;
      
      case 'jina':
        normalized = {
          ...normalized,
          snippet: result.description || result.snippet || "",
        };
        break;
    }

    return createSearchResult({ ...result, ...normalized }, provider);
  });
}

/**
 * Execute a search using the specified provider
 * @param {SearchQuery} searchQuery - The search query object
 * @returns {Promise<SearchResponse>}
 */
export async function search(searchQuery) {
  const {
    query,
    provider = 'tavily',
    maxResults = 10,
    searchDepth = 'basic',
    topic = 'general',
    includeDomains,
    excludeDomains,
    includeImages,
    includeAnswer,
    providerOptions = {},
  } = searchQuery;

  // Validate provider
  if (!PROVIDERS[provider]) {
    return createSearchResponse({
      success: false,
      query,
      provider,
      results: [],
      error: `Unknown provider: ${provider}. Available providers: ${Object.keys(PROVIDERS).join(', ')}`,
    });
  }

  try {
    // Dynamically import the provider
    const providerModule = await PROVIDERS[provider].import();
    
    // Execute provider-specific search
    let rawResponse;
    const options = {
      maxResults,
      searchDepth,
      topic,
      includeDomains,
      excludeDomains,
      includeImages,
      includeAnswer,
      ...providerOptions,
    };

    switch (provider) {
      case 'tavily': {
        rawResponse = await providerModule.searchWithTavily(query, options);
        const results = normalizeResults(rawResponse.results || [], provider);
        return createSearchResponse({
          success: true,
          query,
          provider,
          results,
          answer: rawResponse.answer,
          metadata: {
            images: rawResponse.images,
            responseTime: rawResponse.response_time,
          },
        });
      }

      case 'exa': {
        rawResponse = await providerModule.searchAndContents(query, options);
        const results = normalizeResults(rawResponse.results || [], provider);
        return createSearchResponse({
          success: true,
          query,
          provider,
          results,
          metadata: {
            autopromptString: rawResponse.autopromptString,
          },
        });
      }

      case 'jina': {
        rawResponse = await providerModule.searchWithJina(query, options);
        const results = normalizeResults(rawResponse.data || [], provider);
        return createSearchResponse({
          success: true,
          query,
          provider,
          results,
        });
      }

      case 'compound': {
        // Get the full response first
        const rawResponse = await providerModule.searchWithCompound(query, options);
        
        // Extract the AI-generated content
        const text = rawResponse.choices?.[0]?.message?.content || '';
        
        // Extract web sources from executed_tools
        const executedTools = rawResponse.choices?.[0]?.message?.executed_tools || [];
        let allResults = [];
        
        // Find search tool results
        for (const tool of executedTools) {
          if (tool.type === 'search' && tool.search_results?.results) {
            const searchResults = tool.search_results.results.map((source) => ({
              id: crypto.randomUUID(),
              title: source.title || 'Untitled',
              url: source.url || '',
              snippet: source.content || '',
              content: source.content || '',
              source: 'compound',
              score: source.score || 0,
              publishedDate: new Date().toISOString(),
              metadata: source,
            }));
            allResults = allResults.concat(searchResults);
          }
        }
        
        return createSearchResponse({
          success: true,
          query,
          provider,
          results: allResults, // Web sources from the search tool
          answer: text, // The AI-generated comprehensive answer
          metadata: {
            model: rawResponse.model,
            usage: rawResponse.usage,
            toolsUsed: executedTools.map(t => t.type),
          },
        });
      }

      default:
        throw new Error(`Provider ${provider} not implemented`);
    }

  } catch (error) {
    console.error(`Search error with provider ${provider}:`, error);
    return createSearchResponse({
      success: false,
      query,
      provider,
      results: [],
      error: error.message,
    });
  }
}

/**
 * Search for news using the best provider for news
 * @param {string} query - Search query
 * @param {Object} options - Additional options
 * @returns {Promise<SearchResponse>}
 */
export async function searchNews(query, options = {}) {
  return await search({
    query,
    provider: 'tavily',
    topic: 'news',
    ...options,
  });
}

/**
 * Multi-provider search - executes search across multiple providers
 * @param {SearchQuery} searchQuery - The search query object
 * @param {string[]} providers - Array of provider names to use
 * @returns {Promise<SearchResponse[]>}
 */
export async function multiSearch(searchQuery, providers = ['tavily', 'exa']) {
  const searches = providers.map(provider =>
    search({ ...searchQuery, provider })
  );
  
  return await Promise.all(searches);
}

/**
 * Get available providers
 * @returns {Array<{key: string, name: string}>}
 */
export function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(([key, value]) => ({
    key,
    name: value.name,
  }));
}

