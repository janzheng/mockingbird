# Jina Reader

> Read and extract content from web pages using Jina Reader API (r.jina.ai) and search the web using Jina Search (s.jina.ai).

Based on the official Jina AI documentation: [https://r.jina.ai/docs](https://r.jina.ai/docs)

## Features

- **Read Mode**: Extract clean, LLM-ready content from any web page
- **Search Mode**: Search the web and get SERP results
- **Multiple Formats**: Get content as Markdown, Text, HTML, or JSON
- **Browser Engines**: Choose between Default, Fallback, or Fastest engines
- **CSS Selectors**: Target specific page elements or exclude unwanted content
- **Image Support**: Extract images with captions
- **Link Gathering**: Collect all links at the end for easy navigation
- **Advanced Features**: ReaderLM-v2, proxy support, iframe/Shadow DOM extraction
- **Customization**: Control markdown formatting, timeout, token budget, and more

## Usage

### Basic Reading

```javascript
import { readWithJina } from './jina.js';

// Read a URL and get markdown content
const content = await readWithJina("https://en.wikipedia.org/wiki/Artificial_intelligence");
console.log(content); // Markdown string
```

### Read with JSON Response

```javascript
import { readJinaJson } from './jina.js';

const result = await readJinaJson("https://example.com");
console.log(result.title);     // Page title
console.log(result.content);   // Content in markdown
console.log(result.url);       // URL
console.log(result.timestamp); // Timestamp
```

### Advanced Reading with ReaderLM-v2

For complex websites with tables and embedded content:

```javascript
import { readJinaAdvanced } from './jina.js';

// Uses ReaderLM-v2 for better HTML to Markdown conversion (costs 3x tokens)
const content = await readJinaAdvanced("https://example.com/complex-page");
```

### Read with Image Captions

```javascript
import { readJinaWithImages } from './jina.js';

// Captions all images and gathers them at the end
const content = await readJinaWithImages("https://example.com");
```

### Read Specific Page Sections

```javascript
import { readJinaSelector } from './jina.js';

// Only extract content from specific CSS selector
const article = await readJinaSelector(
  "https://example.com/article",
  "article.main-content"
);
```

### Read with Links Gathered

```javascript
import { readJinaWithLinks } from './jina.js';

// All links will be gathered in a section at the end
const content = await readJinaWithLinks("https://example.com");
```

### Bypass Cache

```javascript
import { readJinaFresh } from './jina.js';

// Ignore cached content and fetch fresh
const content = await readJinaFresh("https://example.com");
```

### Search the Web

```javascript
import { searchWithJina, searchJinaResults } from './jina.js';

// Search and get full response
const results = await searchWithJina("latest AI developments");
console.log(results); // { data: [...5 search results] }

// Get just the results array
const entries = await searchJinaResults("latest AI developments");
entries.forEach(entry => {
  console.log(entry.title);
  console.log(entry.url);
  console.log(entry.content);
});
```

## API Functions

### Reader Functions

#### `readWithJina(url, options)`

Main function for reading web content with full control over all parameters.

**Parameters:**
- `url` (string): The target URL to fetch content from
- `options` (Object):
  - `browserEngine` (string): "Default", "Fallback", or "Fastest"
  - `contentFormat` (string): "Default", "Text", "HTML", "Markdown", or "Screenshot"
  - `jsonResponse` (boolean): Return JSON format (default: false)
  - `timeout` (number): Max page load wait time in seconds (default: 10)
  - `tokenBudget` (number): Max tokens for this request (default: 200000)
  - `useReaderLM` (boolean): Use ReaderLM-v2 for better conversion (costs 3x tokens)
  - `cssSelectorOnly` (string): CSS selector to target specific elements
  - `cssSelectorWaitFor` (string): CSS selector to wait for before returning
  - `cssSelectorExcluding` (string): CSS selector for elements to remove
  - `removeAllImages` (boolean): Remove all images from response
  - `targetGptOss` (boolean): Use gpt-oss citation format for links
  - `gatherAllLinks` (string): "None", "End", or "Start"
  - `gatherAllImages` (string): "None", "End", or "Start"
  - `forwardCookie` (string): Custom cookie settings
  - `imageCaption` (boolean): Add captions to images
  - `proxyServer` (string): Custom proxy server URL
  - `proxyCountry` (string): Country code for proxy ("auto", "none", or code)
  - `bypassCache` (boolean): Ignore cached content
  - `noCache` (boolean): Don't cache this request
  - `githubMarkdown` (boolean): Use Github Flavored Markdown
  - `streamMode` (boolean): Stream mode for large pages
  - `browserLocale` (string): Browser locale for rendering
  - `strictRobots` (boolean): Comply with robots.txt
  - `iframeExtraction` (boolean): Extract from iframes
  - `shadowDomExtraction` (boolean): Extract from Shadow DOM
  - `followRedirect` (boolean): Follow redirect chain
  - `preRunJs` (string): JavaScript to run before extraction
  - `headingStyle` (string): "setext" or "atx"
  - `hrStyle` (string): "* * *", "---", or "___"
  - `bulletStyle` (string): "*", "-", or "+"
  - `emphasisStyle` (string): "_" or "*"
  - `strongStyle` (string): "**" or "__"
  - `linkStyle` (string): "inlined" or "referenced"
  - `euCompliance` (boolean): Keep operations in EU jurisdiction

**Returns:** Promise<string|Object> - Markdown string or JSON object

#### `readJinaJson(url, options)`

Read and return JSON response with structured data.

#### `readJinaAdvanced(url, options)`

Read with ReaderLM-v2 for better quality (costs 3x tokens).

#### `readJinaWithImages(url, options)`

Read with image captions and images gathered at the end.

#### `readJinaSelector(url, selector, options)`

Read specific page sections using CSS selectors.

#### `readJinaWithLinks(url, options)`

Read with all links gathered at the end.

#### `readJinaFresh(url, options)`

Read bypassing cache for fresh content.

### Search Functions

#### `searchWithJina(query, options)`

Search the web and get SERP results.

**Parameters:**
- `query` (string): The search query
- `options` (Object):
  - `timeout` (number): Max wait time
  - `tokenBudget` (number): Max tokens

**Returns:** Promise<Object> - Search results with data array

#### `searchJinaResults(query, options)`

Search and return just the results array.

## Response Formats

### Markdown Response (Default)

Returns clean markdown text optimized for LLM consumption:

```markdown
# Page Title

Content in markdown format with proper formatting...

## Links
- [Link 1](https://example.com)
- [Link 2](https://example.com)
```

### JSON Response

```javascript
{
  url: "https://example.com",
  title: "Page Title",
  content: "Content in markdown...",
  timestamp: "2024-01-01T00:00:00Z"
}
```

### Search Response

```javascript
{
  data: [
    {
      title: "Result Title",
      url: "https://example.com",
      content: "Result description..."
    },
    // ... 4 more results (5 total)
  ]
}
```

## Browser Engines

- **Default**: Balanced quality and speed
- **Fallback**: More compatible but slower
- **Fastest**: Quickest but may miss dynamic content

## Content Formats

- **Default**: Optimized markdown for LLMs
- **Markdown**: Standard markdown
- **Text**: Plain text only
- **HTML**: Raw HTML
- **Screenshot**: Visual capture

## Rate Limits

Without API key: Limited requests
With API key: Higher rate limits

Set your API key:
```bash
JINA_API_KEY=jina_your_api_key_here
```

## Testing

### Read Mode

```bash
# Basic reading
deno task search:jina "https://en.wikipedia.org/wiki/Artificial_intelligence"

# JSON response
deno task search:jina --json "https://example.com"

# Advanced with ReaderLM-v2
deno task search:jina --advanced "https://example.com/complex"

# With image captions
deno task search:jina --images "https://example.com"

# Gather links
deno task search:jina --links "https://example.com"

# Fresh content (bypass cache)
deno task search:jina --fresh "https://example.com"

# Combine options
deno task search:jina --advanced --images --links "https://example.com"
```

### Search Mode

```bash
# Search the web
deno task search:jina --search "latest AI developments"

# Search with specific query
deno task search:jina --search "best restaurants in Tokyo"
```

## Advanced Examples

### Extract Article Content Only

```javascript
const article = await readWithJina("https://example.com/article", {
  cssSelectorOnly: "article.content",
  cssSelectorExcluding: ".ads, .sidebar",
  removeAllImages: true,
});
```

### Read with Custom Proxy

```javascript
const content = await readWithJina("https://example.com", {
  proxyCountry: "US",
  browserLocale: "en-US",
});
```

### Extract with JavaScript Preprocessing

```javascript
const content = await readWithJina("https://example.com", {
  preRunJs: "document.querySelector('.popup').remove();",
  cssSelectorWaitFor: ".main-content",
});
```

### High-Quality Extraction

```javascript
const content = await readWithJina("https://example.com", {
  useReaderLM: true,
  imageCaption: true,
  gatherAllLinks: "End",
  gatherAllImages: "End",
  iframeExtraction: true,
  shadowDomExtraction: true,
});
```

## Best Practices

1. **Use Default Settings**: Start with basic `readWithJina()` for most cases
2. **Enable ReaderLM Selectively**: Only use for complex pages (costs 3x tokens)
3. **Use CSS Selectors**: Target specific content to reduce token usage
4. **Cache Wisely**: Use cache for stable content, bypass for dynamic pages
5. **Choose Appropriate Engine**: Default for most cases, Fastest for simple pages
6. **Gather Links/Images**: Helps LLMs understand page structure and navigation
7. **Set Token Budget**: Prevent unexpected costs on large pages

## API Endpoints

- **Read**: `https://r.jina.ai/{url}`
- **Search**: `https://s.jina.ai/{query}`
- **MCP Server**: `mcp.jina.ai` (for LLM integration)

## Error Handling

The API handles various error scenarios:
- Network errors
- Timeout errors
- Rate limit errors
- Invalid URLs
- Authentication errors

All errors are thrown with descriptive messages for debugging.

