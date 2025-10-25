# Search Module

This module provides search functionality using Groq's Compound system, which integrates GPT-OSS 120B and Llama 4 models with external tools like web search, code execution, and more.

## 🎯 Quick Start: Accurate Academic Paper Search

For **100% accurate** academic paper metadata, use the `accurate-papers.js` module:

```javascript
import { searchAcademicPapers } from './core/search/accurate-papers.js';

const papers = await searchAcademicPapers(
  "CRISPR gene editing papers from 2025"
);

// Returns array with full titles, authors, dates, journals, DOIs, abstracts
// All data scraped directly from webpages - zero hallucination risk!
```

See the [Accurate Papers](#accurate-academic-papers) section below for details.

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

### Search Settings (Domain Restrictions)

Restrict searches to specific domains to improve accuracy and reduce hallucinations:

```javascript
import { searchWithCompound } from './core/search/compound.js';

const result = await searchWithCompound("Find recent phage therapy papers", {
  temperature: 0.1,
  search_settings: {
    include_domains: [
      "pubmed.ncbi.nlm.nih.gov",
      "nature.com",
      "science.org",
      "*.edu"  // All educational institutions
    ]
  }
});
```

**Available search_settings options:**
- `include_domains`: Array of domains to restrict search to (supports wildcards like `*.edu`)
- `exclude_domains`: Array of domains to exclude from search
- `country`: Country to restrict search to (e.g., "united states")

This is particularly useful for academic research, fact-checking, and reducing hallucinations.

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
  - `search_settings` (object): Search behavior customization
    - `include_domains` (array): Domains to restrict search to (e.g., `["*.edu", "nature.com"]`)
    - `exclude_domains` (array): Domains to exclude from search
    - `country` (string): Country to restrict search to

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

## Reducing Hallucinations

Groq Compound may hallucinate (generate plausible but incorrect information), especially for:
- Recent publications or events
- Specific citations or references
- Detailed factual information

**Strategies to reduce hallucinations:**

### 1. Use Low Temperature
```javascript
temperature: 0.1  // For factual tasks (0.1-0.3)
temperature: 0.7  // For creative tasks only
```

### 2. Restrict Search Domains
```javascript
search_settings: {
  include_domains: ["nature.com", "science.org", "*.edu"]
}
```

### 3. Two-Step RAG Approach
```javascript
// Step 1: Retrieve raw information
const searchResults = await searchWithCompound(query, {
  system: "Find information. Do NOT make up facts. Include URLs.",
  temperature: 0.1
});

// Step 2: Format and verify
const formatted = await searchWithCompound(
  `Format these search results: ${searchResults.choices[0].message.content}`,
  {
    system: "Mark any unverified information. Be transparent about limitations.",
    temperature: 0.1
  }
);
```

### 4. Explicit Instructions
```javascript
system: `Find actual papers with URLs. 
Do NOT make up papers or citations. 
If you cannot find something, say so explicitly.
Include source URLs for everything you mention.`
```

### 5. Verify URLs in Results
```javascript
const result = await searchWithCompound(query);
const text = result.choices[0]?.message?.content;

// Extract URLs
const urls = text.match(/https?:\/\/[^\s\)]+/g) || [];

// Verify each URL
for (const url of urls) {
  const response = await fetch(url, { method: 'HEAD' });
  console.log(`${url}: ${response.ok ? '✅' : '❌'}`);
}
```

### 6. Check Tool Calls
```javascript
const result = await searchWithCompound(query);

// See what sources were actually accessed
if (result.choices[0]?.message?.tool_calls) {
  console.log("Tools used:", result.choices[0].message.tool_calls);
}
```

**See `/experiments/README.md` for complete examples of anti-hallucination implementations.**

## Accurate Academic Papers

The `accurate-papers.js` module provides a better approach for academic paper searches with 100% accurate metadata.

### Why Use This?

**Problem:** LLMs often hallucinate or truncate paper metadata (titles, dates, journals, authors).

**Solution:** Use LLM only to find URLs, then scrape real metadata from webpages.

### Basic Usage

```javascript
import { searchAcademicPapers, formatPapersForConsole } from './core/search/accurate-papers.js';

const papers = await searchAcademicPapers(
  "machine learning papers from NeurIPS 2024"
);

console.log(formatPapersForConsole(papers));
```

### Advanced Options

```javascript
const papers = await searchAcademicPapers(
  "climate change research published in Nature 2025",
  {
    domains: ["nature.com", "science.org"],  // Restrict to specific domains
    maxPapers: 10,                           // Limit results
    includeAbstracts: true,                  // Include abstracts
    maxAuthors: 5,                           // Max authors per paper
    onProgress: (progress) => {              // Progress callback
      console.log(progress.message);
    }
  }
);
```

### What You Get

Each paper object contains:
- `title` - Full, untruncated title
- `authors` - Array of author names
- `journal` - Journal name
- `date` - Publication date (YYYY/MM/DD)
- `dateFormatted` - Readable date (e.g., "16 Oct 2025")
- `doi` - DOI identifier
- `abstract` - Full abstract text
- `url` - Source URL

All data is extracted from standard citation meta tags (`citation_title`, `citation_author`, etc.).

### Formatting Output

```javascript
// Console output
const consoleOutput = formatPapersForConsole(papers);
console.log(consoleOutput);

// JSON
const json = formatPapersAsJson(papers, pretty=true);

// Markdown
const markdown = formatPapersAsMarkdown(papers);
```

### How It Works

1. Uses Groq Compound to search and find paper URLs (with domain restrictions)
2. Fetches each webpage's HTML
3. Extracts metadata from standardized meta tags:
   - `<meta name="citation_title" content="...">` 
   - `<meta name="citation_author" content="...">` (multiple)
   - `<meta name="citation_publication_date" content="...">`
   - `<meta name="citation_journal_title" content="...">`
   - `<meta name="citation_doi" content="...">`
   - `<meta name="citation_abstract" content="...">`

These tags are standardized across academic publishers (Nature, Science, MDPI, etc.).

### Advantages

- ✅ **100% accurate** - data comes directly from publisher's webpage
- ✅ **Complete information** - full titles, all authors, abstracts
- ✅ **No hallucinations** - LLM only finds URLs, not metadata
- ✅ **Verifiable** - every data point traceable to source
- ✅ **Cost effective** - uses fewer tokens (LLM only for URL discovery)

### Example

```javascript
import { searchAcademicPapers } from './core/search/accurate-papers.js';

const papers = await searchAcademicPapers(
  "phage therapy papers published in October 2025",
  {
    maxPapers: 5,
    onProgress: (p) => console.log(p.message)
  }
);

// Each paper has complete, accurate metadata
papers.forEach(paper => {
  console.log(paper.title);           // Full title
  console.log(paper.authors.join(', ')); // All authors
  console.log(paper.journal);         // Exact journal name
  console.log(paper.dateFormatted);   // Readable date
  console.log(`https://doi.org/${paper.doi}`); // Verified DOI
});
```

See `/experiments/SOLUTION.md` for detailed explanation of this approach.

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

