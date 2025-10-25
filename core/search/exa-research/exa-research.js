import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown

const EXA_API_BASE = "https://api.exa.ai";

/**
 * Create a research task with Exa Research
 * 
 * @param {string} instructions - Instructions for what you would like research on
 * @param {Object} options - Optional parameters for the Exa Research API
 * @param {string} options.model - Research model: "exa-research-fast", "exa-research" (default), or "exa-research-pro"
 * @param {Object} options.outputSchema - JSON Schema to enforce structured output
 * @returns {Promise<Object>} - Research object with researchId for polling
 */
export async function createResearch(instructions, options = {}) {
  const apiKey = Deno.env.get("EXA_API_KEY");
  
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is required");
  }

  const requestBody = {
    instructions,
    model: options.model || "exa-research",
    ...(options.outputSchema && { outputSchema: options.outputSchema }),
  };

  try {
    const response = await fetch(`${EXA_API_BASE}/research/v1`, {
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
    console.error("Exa Research create error:", error);
    throw error;
  }
}

/**
 * Get the status and results of a research task
 * 
 * @param {string} researchId - The research ID returned from createResearch
 * @param {Object} options - Optional parameters
 * @param {boolean} options.includeEvents - Include detailed event log (default: false)
 * @returns {Promise<Object>} - Research status and results
 */
export async function getResearch(researchId, options = {}) {
  const apiKey = Deno.env.get("EXA_API_KEY");
  
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is required");
  }

  const params = new URLSearchParams();
  if (options.includeEvents) {
    params.append("events", "true");
  }

  const url = `${EXA_API_BASE}/research/v1/${researchId}${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Exa Research get error:", error);
    throw error;
  }
}

/**
 * Poll a research task until it completes
 * 
 * @param {string} researchId - The research ID to poll
 * @param {Object} options - Optional parameters
 * @param {number} options.pollInterval - Milliseconds between polls (default: 2000)
 * @param {number} options.maxAttempts - Maximum polling attempts (default: 150, ~5 minutes)
 * @param {Function} options.onProgress - Callback for status updates
 * @param {boolean} options.includeEvents - Include detailed event log (default: false)
 * @returns {Promise<Object>} - Final completed research result
 */
export async function pollResearch(researchId, options = {}) {
  const pollInterval = options.pollInterval || 2000;
  const maxAttempts = options.maxAttempts || 150;
  const onProgress = options.onProgress;
  
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const result = await getResearch(researchId, { includeEvents: options.includeEvents });
    
    if (onProgress) {
      onProgress(result);
    }
    
    if (result.status === "completed") {
      return result;
    }
    
    if (result.status === "failed") {
      throw new Error(`Research failed: ${result.error}`);
    }
    
    if (result.status === "canceled") {
      throw new Error("Research was canceled");
    }
    
    // Still running or pending, wait and try again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }
  
  throw new Error(`Research polling timed out after ${maxAttempts} attempts`);
}

/**
 * Create research and wait for completion
 * 
 * @param {string} instructions - Instructions for what you would like research on
 * @param {Object} options - Combined options for create and poll
 * @param {string} options.model - Research model to use
 * @param {Object} options.outputSchema - JSON Schema for structured output
 * @param {number} options.pollInterval - Milliseconds between polls
 * @param {number} options.maxAttempts - Maximum polling attempts
 * @param {Function} options.onProgress - Callback for status updates
 * @param {boolean} options.includeEvents - Include detailed event log
 * @returns {Promise<Object>} - Final completed research result
 */
export async function researchAndWait(instructions, options = {}) {
  const research = await createResearch(instructions, {
    model: options.model,
    outputSchema: options.outputSchema,
  });
  
  if (options.onProgress) {
    options.onProgress({ status: "created", researchId: research.researchId });
  }
  
  return await pollResearch(research.researchId, {
    pollInterval: options.pollInterval,
    maxAttempts: options.maxAttempts,
    onProgress: options.onProgress,
    includeEvents: options.includeEvents,
  });
}

/**
 * Get just the content from a completed research
 * 
 * @param {string} instructions - Instructions for research
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} - The research output content
 */
export async function getResearchContent(instructions, options = {}) {
  const result = await researchAndWait(instructions, options);
  return result.output?.content || "";
}

/**
 * Get parsed structured output from research
 * 
 * @param {string} instructions - Instructions for research
 * @param {Object} outputSchema - JSON Schema for structured output
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - Parsed structured output
 */
export async function getResearchParsed(instructions, outputSchema, options = {}) {
  const result = await researchAndWait(instructions, {
    ...options,
    outputSchema,
  });
  return result.output?.parsed || null;
}

/**
 * Cancel a running research task
 * 
 * @param {string} researchId - The research ID to cancel
 * @returns {Promise<Object>} - Canceled research status
 */
export async function cancelResearch(researchId) {
  const apiKey = Deno.env.get("EXA_API_KEY");
  
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is required");
  }

  try {
    const response = await fetch(`${EXA_API_BASE}/research/v1/${researchId}/cancel`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Exa Research cancel error:", error);
    throw error;
  }
}

