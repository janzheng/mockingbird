# Scrape

> Web scraping and content extraction tools for reading and extracting clean content from web pages.

This directory contains scrapers that fetch and clean web page content into LLM-ready formats.

## Available Scrapers

### Jina Reader (`/jina/`)
- **Purpose**: Read and extract content from web pages using Jina Reader API
- **Features**: Multiple browser engines, CSS selectors, image captions, ReaderLM-v2, proxy support
- **Format**: Markdown, Text, HTML, JSON
- **API**: `r.jina.ai`

### Tavily Extract (`/tavily/`)
- **Purpose**: Extract web page content from URLs using Tavily Extract API
- **Features**: Basic/Advanced extraction, batch processing (up to 20 URLs), images, favicon
- **Format**: Markdown or plain text
- **API**: Tavily Extract

## Usage

### Import from Index

```javascript
import { 
  readWithJina, 
  readJinaAdvanced,
  extractWithTavily,
  extractAdvanced 
} from './core/scrape/index.js';
```

### Jina Reader

```javascript
import { readWithJina } from './core/scrape/jina/jina.js';

// Read a webpage
const content = await readWithJina("https://example.com");
```

### Tavily Extract

```javascript
import { extractWithTavily } from './core/scrape/tavily/tavily-extract.js';

// Extract from URLs
const result = await extractWithTavily("https://example.com");
```

## CLI Commands

```bash
# Jina Reader
deno task scrape:jina "https://example.com"
deno task scrape:jina --advanced --images "https://example.com"

# Tavily Extract
deno task scrape:tavily "https://example.com"
deno task scrape:tavily --advanced "https://example.com"
```

## Related

- **Search Tools**: See `/core/search/` for web search APIs (Jina Search, Tavily Search, Exa Search)
- **Compound Search**: See `/core/search/groq-compound/` for AI-powered search with tools

