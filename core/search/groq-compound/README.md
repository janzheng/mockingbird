# Search Module

This module provides search functionality using Groq's Compound system, which integrates GPT-OSS 120B and Llama 4 models with external tools like web search, code execution, and more.

## Setup

Make sure you have a `GROQ_API_KEY` environment variable set in your `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

## Usage

### Basic Search

```javascript
import { searchWithCompound } from './core/search/compound.js';

// Simple query
const result = await searchWithCompound("Explain why fast inference is critical for reasoning models");
console.log(result.choices[0]?.message?.content);

// Full response object includes usage stats, tool calls, etc.
console.log(result.usage);
console.log(result.model);
```

### Get Text Content Only

```javascript
import { searchCompoundText } from './core/search/compound.js';

const text = await searchCompoundText("What's the current weather in San Francisco?");
console.log(text);
```

### Advanced Options

```javascript
import { searchWithCompound } from './core/search/compound.js';

const result = await searchWithCompound("Find the latest news about AI", {
  model: "groq/compound",
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 1,
  system: "You are a helpful research assistant focused on AI news."
});
```

### Streaming Response

```javascript
import { searchCompoundStream } from './core/search/compound.js';

const fullText = await searchCompoundStream(
  "Write a short story about AI",
  (chunk) => {
    // Called for each chunk as it arrives
    console.log(chunk);
  },
  {
    temperature: 0.9,
    max_tokens: 1000
  }
);

console.log("Complete story:", fullText);
```

### Using with Tools

```javascript
import { searchWithTools } from './core/search/compound.js';

// Compound automatically uses web search, code execution, etc. when needed
const result = await searchWithTools(
  "What are the top trending repositories on GitHub today?"
);

console.log(result.choices[0]?.message?.content);
// Check what tools were used
console.log(result.choices[0]?.message?.tool_calls);
```

### Custom Messages

```javascript
import { searchWithCompound } from './core/search/compound.js';

const result = await searchWithCompound("", {
  messages: [
    { role: "system", content: "You are a coding expert." },
    { role: "user", content: "How do I implement binary search?" },
    { role: "assistant", content: "Here's a basic approach..." },
    { role: "user", content: "Can you show me in Python?" }
  ]
});
```

### JSON Mode

```javascript
import { searchWithCompound } from './core/search/compound.js';

const result = await searchWithCompound(
  "Extract key information about SpaceX's latest launch",
  {
    response_format: { type: "json_object" },
    system: "Extract information and return it as JSON with keys: date, mission, success, details"
  }
);

const data = JSON.parse(result.choices[0]?.message?.content);
console.log(data);
```

## Available Functions

### `searchWithCompound(query, options)`

Main function that returns the full Groq API response object.

**Parameters:**
- `query` (string): The search query or prompt
- `options` (object): Optional parameters
  - `model` (string): Model to use (default: "groq/compound")
  - `messages` (array): Custom messages array
  - `temperature` (number): Temperature for response generation (0-2)
  - `max_tokens` (number): Maximum tokens in response (max: 8192)
  - `top_p` (number): Top P sampling parameter (0-1)
  - `stream` (boolean): Whether to stream the response
  - `response_format` (object): Response format configuration
  - `system` (string): System prompt to guide the model

**Returns:** Promise<Object> - Full response object including:
- `choices[0].message.content` - The response text
- `choices[0].message.tool_calls` - Tools that were used
- `usage` - Token usage information
- `model` - Model that was used
- And more...

### `searchCompoundText(query, options)`

Convenience function that returns just the text content.

**Returns:** Promise<string>

### `searchCompoundStream(query, onChunk, options)`

Stream the response as it's generated.

**Parameters:**
- `query` (string): The search query
- `onChunk` (function): Callback for each chunk
- `options` (object): Same as searchWithCompound

**Returns:** Promise<string> - Complete accumulated text

### `searchWithTools(query, options)`

Search with a system prompt optimized for tool usage.

**Returns:** Promise<Object>

## Capabilities

Groq Compound has access to:
- **Web Search** - Real-time web search (basic and advanced)
- **Code Execution** - Execute Python code via E2B
- **Visit Website** - Fetch and analyze web pages
- **Browser Automation** - Automate browser interactions
- **Wolfram Alpha** - Mathematical and scientific computations
- **JSON Object Mode** - Structured output

## Pricing

Compound uses underlying models with different pricing:
- GPT-OSS-120B: $0.15 input / $0.60 output per 1M tokens
- Llama 4 Scout: $0.11 input / $0.34 output per 1M tokens

Built-in tools have separate costs:
- Basic Web Search: $5 / 1000 requests
- Advanced Web Search: $8 / 1000 requests
- Visit Website: $1 / 1000 requests
- Code Execution: $0.18 / hour
- Browser Automation: $0.08 / hour

## Best Practices

1. Use system prompts to improve steerability
2. Consider implementing Llama Guard for input filtering
3. Deploy with appropriate safeguards for specialized domains
4. Note: Not HIPAA compliant - don't use for protected health information

## Example: Search Endpoint

```javascript
import { searchWithCompound } from './core/search/compound.js';

app.post('/api/search', async (c) => {
  const { query, options } = await c.req.json();
  
  try {
    const result = await searchWithCompound(query, options);
    return c.json({
      success: true,
      content: result.choices[0]?.message?.content,
      usage: result.usage,
      model: result.model,
      toolCalls: result.choices[0]?.message?.tool_calls
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});
```

