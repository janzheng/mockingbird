import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import Groq from "npm:groq-sdk";

/**
 * Search using Groq Compound
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
 * @returns {Promise<Object>} - Full response object from Groq API
 */
export async function searchWithCompound(query, options = {}) {
  const groq = new Groq({
    apiKey: Deno.env.get("GROQ_API_KEY"),
  });

  // Build messages array
  const messages = options.messages || [
    ...(options.system ? [{ role: "system", content: options.system }] : []),
    { role: "user", content: query },
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
 * Get just the text content from a Groq Compound search
 * 
 * @param {string} query - The search query or prompt
 * @param {Object} options - Optional parameters (same as searchWithCompound)
 * @returns {Promise<string>} - The text content from the response
 */
export async function searchCompoundText(query, options = {}) {
  const completion = await searchWithCompound(query, options);
  return completion.choices[0]?.message?.content || "";
}

/**
 * Search with streaming response
 * 
 * @param {string} query - The search query or prompt
 * @param {Function} onChunk - Callback function for each chunk
 * @param {Object} options - Optional parameters (same as searchWithCompound)
 * @returns {Promise<string>} - Complete accumulated text
 */
export async function searchCompoundStream(query, onChunk, options = {}) {
  const completion = await searchWithCompound(query, { ...options, stream: true });
  
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
 * Example usage with web search capabilities
 * 
 * @param {string} query - The search query
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - Full response object with tool usage information
 */
export async function searchWithTools(query, options = {}) {
  const systemPrompt = options.system || 
    "You are a helpful assistant with access to web search, code execution, and other tools. Use them when needed to provide accurate, up-to-date information.";
  
  return await searchWithCompound(query, {
    ...options,
    system: systemPrompt,
  });
}

