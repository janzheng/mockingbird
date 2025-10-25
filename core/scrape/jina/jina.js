import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown

/**
 * Read a URL and fetch its content using Jina Reader
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {Object} options - Optional parameters for the Jina Reader API
 * @param {string} options.browserEngine - Browser engine for fetching ("Default", "Fallback", "Fastest")
 * @param {string} options.contentFormat - Level of detail ("Default", "Text", "HTML", "Markdown", "Screenshot")
 * @param {boolean} options.jsonResponse - Return response in JSON format (default: false)
 * @param {number} options.timeout - Maximum page load wait time in seconds (default: 10)
 * @param {number} options.tokenBudget - Limits maximum tokens used for this request (default: 200000)
 * @param {boolean} options.useReaderLM - Use ReaderLM-v2 for better HTML to Markdown conversion (costs 3x tokens)
 * @param {string} options.cssSelectorOnly - CSS selector to target specific elements
 * @param {string} options.cssSelectorWaitFor - CSS selector to wait for before returning
 * @param {string} options.cssSelectorExcluding - CSS selector for elements to remove
 * @param {boolean} options.removeAllImages - Remove all images from response
 * @param {boolean} options.targetGptOss - Use gpt-oss internal browser citation format
 * @param {string} options.gatherAllLinks - Gather links section ("None", "End", "Start")
 * @param {string} options.gatherAllImages - Gather images section ("None", "End", "Start")
 * @param {string} options.forwardCookie - Custom cookie settings for authentication
 * @param {boolean} options.imageCaption - Caption all images (adds captions as alt tags)
 * @param {string} options.proxyServer - Custom proxy server URL
 * @param {string} options.proxyCountry - Country code for location-based proxy ("auto", "none", or country code)
 * @param {boolean} options.bypassCache - Ignore cached content and fetch directly
 * @param {boolean} options.noCache - Don't cache or track this request
 * @param {boolean} options.githubMarkdown - Use Github Flavored Markdown
 * @param {boolean} options.streamMode - Stream mode for large pages
 * @param {string} options.browserLocale - Control browser locale for rendering
 * @param {boolean} options.strictRobots - Strictly comply with robots.txt policy
 * @param {boolean} options.iframeExtraction - Process content from embedded iframes
 * @param {boolean} options.shadowDomExtraction - Extract content from Shadow DOM roots
 * @param {boolean} options.followRedirect - Follow redirect chain to final destination
 * @param {string} options.preRunJs - Execute preprocessing JS code (inline or remote URL)
 * @param {string} options.headingStyle - Markdown heading format ("setext" or "atx")
 * @param {string} options.hrStyle - Horizontal rule format ("* * *", "---", "___")
 * @param {string} options.bulletStyle - Bullet list marker ("*", "-", "+")
 * @param {string} options.emphasisStyle - Emphasis delimiter ("_", "*")
 * @param {string} options.strongStyle - Strong emphasis delimiter ("**", "__")
 * @param {string} options.linkStyle - Link format ("inlined", "referenced")
 * @param {boolean} options.euCompliance - Keep all operations within EU jurisdiction
 * @returns {Promise<Object|string>} - Response content (JSON object if jsonResponse=true, otherwise markdown string)
 */
export async function readWithJina(url, options = {}) {
  const apiKey = Deno.env.get("JINA_API_KEY");
  const baseUrl = "https://r.jina.ai";
  
  // Build the full URL
  const targetUrl = new URL(`${baseUrl}/${url}`);
  
  // Build headers
  const headers = {
    "Accept": options.jsonResponse ? "application/json" : "text/plain",
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Add optional headers based on options
  if (options.browserEngine !== undefined) {
    headers["X-Browser-Engine"] = options.browserEngine;
  }
  if (options.contentFormat !== undefined) {
    headers["X-Response-Format"] = options.contentFormat;
  }
  if (options.timeout !== undefined) {
    headers["X-Timeout"] = String(options.timeout);
  }
  if (options.tokenBudget !== undefined) {
    headers["X-Max-Tokens"] = String(options.tokenBudget);
  }
  if (options.useReaderLM !== undefined) {
    headers["X-Use-ReaderLM"] = String(options.useReaderLM);
  }
  if (options.cssSelectorOnly !== undefined) {
    headers["X-Selector"] = options.cssSelectorOnly;
  }
  if (options.cssSelectorWaitFor !== undefined) {
    headers["X-Wait-For-Selector"] = options.cssSelectorWaitFor;
  }
  if (options.cssSelectorExcluding !== undefined) {
    headers["X-Remove-Selector"] = options.cssSelectorExcluding;
  }
  if (options.removeAllImages !== undefined) {
    headers["X-No-Images"] = String(options.removeAllImages);
  }
  if (options.targetGptOss !== undefined) {
    headers["X-Target-Gpt-Oss"] = String(options.targetGptOss);
  }
  if (options.gatherAllLinks !== undefined) {
    headers["X-Gather-Links"] = options.gatherAllLinks;
  }
  if (options.gatherAllImages !== undefined) {
    headers["X-Gather-Images"] = options.gatherAllImages;
  }
  if (options.forwardCookie !== undefined) {
    headers["X-Set-Cookie"] = options.forwardCookie;
  }
  if (options.imageCaption !== undefined) {
    headers["X-Image-Caption"] = String(options.imageCaption);
  }
  if (options.proxyServer !== undefined) {
    headers["X-Proxy-Url"] = options.proxyServer;
  }
  if (options.proxyCountry !== undefined) {
    headers["X-Proxy-Country"] = options.proxyCountry;
  }
  if (options.bypassCache !== undefined) {
    headers["X-No-Cache"] = String(options.bypassCache);
  }
  if (options.noCache !== undefined) {
    headers["X-No-Cache-And-Track"] = String(options.noCache);
  }
  if (options.githubMarkdown !== undefined) {
    headers["X-Github-Markdown"] = String(options.githubMarkdown);
  }
  if (options.streamMode !== undefined) {
    headers["X-Stream"] = String(options.streamMode);
  }
  if (options.browserLocale !== undefined) {
    headers["X-Locale"] = options.browserLocale;
  }
  if (options.strictRobots !== undefined) {
    headers["X-Respect-Robots"] = String(options.strictRobots);
  }
  if (options.iframeExtraction !== undefined) {
    headers["X-With-Iframe"] = String(options.iframeExtraction);
  }
  if (options.shadowDomExtraction !== undefined) {
    headers["X-With-Shadow-Dom"] = String(options.shadowDomExtraction);
  }
  if (options.followRedirect !== undefined) {
    headers["X-Follow-Redirect"] = String(options.followRedirect);
  }
  if (options.preRunJs !== undefined) {
    headers["X-Pre-Run-Script"] = options.preRunJs;
  }
  if (options.headingStyle !== undefined) {
    headers["X-Heading-Style"] = options.headingStyle;
  }
  if (options.hrStyle !== undefined) {
    headers["X-Hr-Style"] = options.hrStyle;
  }
  if (options.bulletStyle !== undefined) {
    headers["X-Bullet-Style"] = options.bulletStyle;
  }
  if (options.emphasisStyle !== undefined) {
    headers["X-Emphasis-Style"] = options.emphasisStyle;
  }
  if (options.strongStyle !== undefined) {
    headers["X-Strong-Style"] = options.strongStyle;
  }
  if (options.linkStyle !== undefined) {
    headers["X-Link-Style"] = options.linkStyle;
  }
  if (options.euCompliance !== undefined) {
    headers["X-EU-Compliance"] = String(options.euCompliance);
  }

  try {
    const response = await fetch(targetUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Jina Reader error: ${response.status} ${response.statusText}`);
    }
    
    if (options.jsonResponse) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error("Jina Reader error:", error);
    throw error;
  }
}

/**
 * Read a URL and return JSON response
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {Object} options - Optional parameters (same as readWithJina)
 * @returns {Promise<Object>} - JSON response with url, title, content, timestamp
 */
export async function readJinaJson(url, options = {}) {
  return await readWithJina(url, {
    ...options,
    jsonResponse: true,
  });
}

/**
 * Read a URL with high-quality ReaderLM-v2 conversion
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {Object} options - Optional parameters (same as readWithJina)
 * @returns {Promise<string>} - Markdown content
 */
export async function readJinaAdvanced(url, options = {}) {
  return await readWithJina(url, {
    ...options,
    useReaderLM: true,
  });
}

/**
 * Read a URL with image captions
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {Object} options - Optional parameters (same as readWithJina)
 * @returns {Promise<string>} - Markdown content with image captions
 */
export async function readJinaWithImages(url, options = {}) {
  return await readWithJina(url, {
    ...options,
    imageCaption: true,
    gatherAllImages: "End",
  });
}

/**
 * Read specific sections of a page using CSS selectors
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {string} selector - CSS selector to target specific elements
 * @param {Object} options - Optional parameters (same as readWithJina)
 * @returns {Promise<string>} - Markdown content of selected elements
 */
export async function readJinaSelector(url, selector, options = {}) {
  return await readWithJina(url, {
    ...options,
    cssSelectorOnly: selector,
  });
}

/**
 * Read a URL with all links gathered at the end
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {Object} options - Optional parameters (same as readWithJina)
 * @returns {Promise<string>} - Markdown content with links section at the end
 */
export async function readJinaWithLinks(url, options = {}) {
  return await readWithJina(url, {
    ...options,
    gatherAllLinks: "End",
  });
}

/**
 * Read a URL bypassing cache
 * 
 * @param {string} url - The target URL to fetch content from
 * @param {Object} options - Optional parameters (same as readWithJina)
 * @returns {Promise<string>} - Fresh markdown content
 */
export async function readJinaFresh(url, options = {}) {
  return await readWithJina(url, {
    ...options,
    bypassCache: true,
  });
}

/**
 * Search the web using Jina Search (s.jina.ai)
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters (similar to readWithJina)
 * @returns {Promise<Object>} - Search results with 5 entries
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

