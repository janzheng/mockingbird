import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import Groq from "npm:groq-sdk";

/**
 * Format a date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - ISO formatted date string
 */
function formatISODate(date) {
  if (typeof date === 'string') {
    // If already a string, validate it's in YYYY-MM-DD format
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoRegex.test(date)) {
      return date;
    }
    // Try to parse it as a date
    date = new Date(date);
  }
  
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid date provided");
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Search using Groq Compound with date filtering support
 * 
 * @param {string} query - The search query or prompt
 * @param {Object} options - Optional parameters for the Groq API
 * @param {string} options.model - Model to use (default: "groq/compound")
 * @param {Array} options.messages - Custom messages array (if not provided, query will be used)
 * @param {number} options.temperature - Temperature for response generation
 * @param {number} options.max_tokens - Maximum tokens in response
 * @param {number} options.top_p - Top P sampling parameter
 * @param {boolean} options.stream - Whether to stream the response
 * @param {Object} options.response_format - Response format configuration
 * @param {string} options.system - System prompt to guide the model
 * @param {Object} options.search_settings - Search behavior customization
 * @param {Array<string>} options.search_settings.include_domains - Domains to restrict search to
 * @param {Array<string>} options.search_settings.exclude_domains - Domains to exclude from search
 * @param {string} options.search_settings.country - Country to restrict search to
 * @param {Date|string} options.startDate - Start date for date range filtering (YYYY-MM-DD or Date object)
 * @param {Date|string} options.endDate - End date for date range filtering (YYYY-MM-DD or Date object)
 * @param {string} options.tool_choice - Tool choice setting (default: "auto" when dates provided)
 * @returns {Promise<Object>} - Full response object from Groq API
 */
export async function searchWithCompoundDated(query, options = {}) {
  const groq = new Groq({
    apiKey: Deno.env.get("GROQ_API_KEY"),
  });

  // Handle date range filtering
  let enhancedQuery = query;
  let enhancedSystem = options.system || "";
  
  if (options.startDate || options.endDate) {
    const startISO = options.startDate ? formatISODate(options.startDate) : null;
    const endISO = options.endDate ? formatISODate(options.endDate) : null;
    
    // Add date filtering instructions to system prompt
    const dateInstruction = "You have access to web search and code execution. " +
      "Always restrict results to the date range supplied by the user when searching for papers, articles, or time-sensitive information.";
    
    enhancedSystem = enhancedSystem 
      ? `${enhancedSystem}\n\n${dateInstruction}`
      : dateInstruction;
    
    // Enhance the user query with explicit date range
    if (startISO && endISO) {
      enhancedQuery = `${query}\n\nIMPORTANT: Only include sources published between ${startISO} and ${endISO} (inclusive).`;
    } else if (startISO) {
      enhancedQuery = `${query}\n\nIMPORTANT: Only include sources published on or after ${startISO}.`;
    } else if (endISO) {
      enhancedQuery = `${query}\n\nIMPORTANT: Only include sources published on or before ${endISO}.`;
    }
  }

  // Build messages array
  const messages = options.messages || [
    ...(enhancedSystem ? [{ role: "system", content: enhancedSystem }] : []),
    { role: "user", content: enhancedQuery },
  ];

  // Prepare the request parameters
  const requestParams = {
    model: options.model || "groq/compound",
    messages: messages,
    ...(options.temperature !== undefined && { temperature: options.temperature }),
    ...(options.max_tokens !== undefined && { max_tokens: options.max_tokens }),
    ...(options.top_p !== undefined && { top_p: options.top_p }),
    ...(options.stream !== undefined && { stream: options.stream }),
    ...(options.response_format !== undefined && { response_format: options.response_format }),
    ...(options.search_settings !== undefined && { search_settings: options.search_settings }),
    // Set tool_choice to auto when dates are provided, or use custom value
    tool_choice: options.tool_choice || ((options.startDate || options.endDate) ? "auto" : undefined),
  };

  try {
    const completion = await groq.chat.completions.create(requestParams);
    return completion;
  } catch (error) {
    console.error("Groq Compound search error:", error);
    throw error;
  }
}

/**
 * Get just the text content from a dated Groq Compound search
 * 
 * @param {string} query - The search query or prompt
 * @param {Object} options - Optional parameters (same as searchWithCompoundDated)
 * @returns {Promise<string>} - The text content from the response
 */
export async function searchCompoundDatedText(query, options = {}) {
  const completion = await searchWithCompoundDated(query, options);
  return completion.choices[0]?.message?.content || "";
}

/**
 * Search with streaming response and date filtering
 * 
 * @param {string} query - The search query or prompt
 * @param {Function} onChunk - Callback function for each chunk
 * @param {Object} options - Optional parameters (same as searchWithCompoundDated)
 * @returns {Promise<string>} - Complete accumulated text
 */
export async function searchCompoundDatedStream(query, onChunk, options = {}) {
  const completion = await searchWithCompoundDated(query, { ...options, stream: true });
  
  let fullText = "";
  
  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || "";
    fullText += content;
    if (onChunk && content) {
      onChunk(content);
    }
  }
  
  return fullText;
}

/**
 * Search for academic papers with date range
 * Optimized for finding research papers published within a specific timeframe
 * 
 * @param {string} query - The research query
 * @param {Date|string} startDate - Start date (YYYY-MM-DD or Date object)
 * @param {Date|string} endDate - End date (YYYY-MM-DD or Date object)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Full response object with paper information
 */
export async function searchPapersWithDateRange(query, startDate, endDate, options = {}) {
  const systemPrompt = options.system || 
    "You are a research assistant helping find academic papers and scientific publications. " +
    "When searching, prioritize peer-reviewed papers, preprints from reputable sources (arXiv, bioRxiv, etc.), " +
    "and scholarly articles. Always verify publication dates and only include sources within the requested date range.";
  
  return await searchWithCompoundDated(query, {
    ...options,
    system: systemPrompt,
    startDate,
    endDate,
    temperature: options.temperature || 0.2,
    max_tokens: options.max_tokens || 2048,
  });
}

/**
 * Search for recent papers (last N days/months/years)
 * 
 * @param {string} query - The research query
 * @param {number} amount - Number of time units to go back
 * @param {string} unit - Time unit: 'days', 'months', or 'years'
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Full response object with paper information
 */
export async function searchRecentPapers(query, amount = 1, unit = 'years', options = {}) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch(unit.toLowerCase()) {
    case 'days':
      startDate.setDate(startDate.getDate() - amount);
      break;
    case 'months':
      startDate.setMonth(startDate.getMonth() - amount);
      break;
    case 'years':
      startDate.setFullYear(startDate.getFullYear() - amount);
      break;
    default:
      throw new Error("Unit must be 'days', 'months', or 'years'");
  }
  
  return await searchPapersWithDateRange(query, startDate, endDate, options);
}

/**
 * Example usage demonstrating date filtering
 */
export async function exampleDateSearch() {
  // Example 1: Search papers from a specific date range
  const result1 = await searchPapersWithDateRange(
    "CRISPR gene editing advances",
    "2023-01-01",
    "2024-12-31"
  );
  console.log("Papers from 2023-2024:", result1.choices[0].message.content);
  
  // Example 2: Search papers from the last 6 months
  const result2 = await searchRecentPapers(
    "phage therapy clinical trials",
    6,
    "months"
  );
  console.log("Recent papers:", result2.choices[0].message.content);
  
  // Example 3: Custom query with date range
  const result3 = await searchCompoundDatedText(
    "What are the latest breakthroughs in mRNA vaccine technology?",
    {
      startDate: "2024-01-01",
      endDate: "2024-10-26",
      temperature: 0.2,
      max_tokens: 1500,
    }
  );
  console.log("Custom search:", result3);
}

