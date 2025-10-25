# Exa Search

Exa Search provides intelligent web search with both traditional keyword search and embeddings-based neural search. It automatically chooses the best approach for your query and can extract full content from results.

## Setup

Make sure you have an `EXA_API_KEY` environment variable set in your `.env` file:

```
EXA_API_KEY=your_api_key_here
```

Get your API key from [Exa](https://exa.ai/)

## Usage

### Basic Search

```javascript
import { searchWithExa } from './core/search/exa-search/exa-search.js';

const result = await searchWithExa("Latest research in LLMs");
console.log(result.results);
```

### Search with Contents

```javascript
import { searchAndContents } from './core/search/exa-search/exa-search.js';

const result = await searchAndContents("Latest research in LLMs", {
  text: true,
  numResults: 5
});

result.results.forEach(item => {
  console.log(item.title);
  console.log(item.url);
  console.log(item.text); // Full page content
});
```

### Get Just Results

```javascript
import { getResults } from './core/search/exa-search/exa-search.js';

const results = await getResults("TypeScript best practices", {
  numResults: 10
});

results.forEach(r => console.log(r.title, r.url));
```

### Get Context String for LLM

```javascript
import { getContext } from './core/search/exa-search/exa-search.js';

const context = await getContext("Machine learning algorithms", {
  numResults: 5
});

// Use context in your LLM prompt
console.log(context);
```

### Search Types

```javascript
import { 
  neuralSearch, 
  keywordSearch, 
  fastSearch 
} from './core/search/exa-search/exa-search.js';

// Neural search (embeddings-based)
const neural = await neuralSearch("explain transformer architecture");

// Keyword search (Google-like)
const keyword = await keywordSearch("react hooks tutorial");

// Fast search (streamlined)
const fast = await fastSearch("quick answer needed");
```

### Category-Specific Searches

```javascript
import { 
  searchResearchPapers,
  searchNews,
  searchCompanies,
  searchGitHub
} from './core/search/exa-search/exa-search.js';

// Research papers
const papers = await searchResearchPapers("quantum computing");

// News articles
const news = await searchNews("AI developments");

// Companies
const companies = await searchCompanies("AI startups");

// GitHub repositories
const repos = await searchGitHub("deno framework");
```

### Advanced Options

```javascript
import { searchAndContents } from './core/search/exa-search/exa-search.js';

const result = await searchAndContents("Latest AI research", {
  type: "neural",
  category: "research paper",
  numResults: 10,
  includeDomains: ["arxiv.org", "paperswithcode.com"],
  startPublishedDate: "2024-01-01T00:00:00.000Z",
  text: true,
  highlights: {
    numSentences: 2,
    highlightsPerUrl: 3,
    query: "Key findings"
  },
  summary: {
    query: "Main contributions"
  },
  extras: {
    links: 5,
    imageLinks: 3
  }
});
```

### With Subpages

```javascript
import { searchAndContents } from './core/search/exa-search/exa-search.js';

const result = await searchAndContents("React documentation", {
  text: true,
  subpages: 3,
  subpageTarget: "examples"
});

result.results.forEach(item => {
  console.log("Main page:", item.title);
  if (item.subpages) {
    item.subpages.forEach(sub => {
      console.log("  Subpage:", sub.title);
    });
  }
});
```

## CLI Testing

```bash
# Test Exa Search from command line
deno task search:exa-search "your query here"

# Examples
deno task search:exa-search "Latest research in LLMs"
deno task search:exa-search "Best practices for Deno"
deno task search:exa-search "TypeScript design patterns"
```

## Available Functions

### `searchWithExa(query, options)`

Main search function with full control over all parameters.

**Parameters:**
- `query` (string): The search query
- `options` (object): Optional parameters
  - `type` (string): "keyword", "neural", "fast", or "auto" (default)
  - `category` (string): "company", "research paper", "news", "pdf", "github", "tweet", "personal site", "linkedin profile", "financial report"
  - `userLocation` (string): Two-letter ISO country code
  - `numResults` (number): Number of results (default: 10)
  - `includeDomains` (array): Domains to include
  - `excludeDomains` (array): Domains to exclude
  - `startCrawlDate` (string): ISO 8601 date
  - `endCrawlDate` (string): ISO 8601 date
  - `startPublishedDate` (string): ISO 8601 date
  - `endPublishedDate` (string): ISO 8601 date
  - `includeText` (array): Text that must be present
  - `excludeText` (array): Text that must not be present
  - `context` (boolean|object): Return context string
  - `moderation` (boolean): Enable content moderation
  - `contents` (object): Contents options

**Returns:** Promise<Object>

### `searchAndContents(query, options)`

Search and get contents in one call (convenience function).

**Additional Options:**
- `text` (boolean|object): Include full text
- `highlights` (object): Extract highlights
- `summary` (object): Generate summaries
- `livecrawl` (string): "never", "fallback", "always", "preferred"
- `livecrawlTimeout` (number): Timeout in milliseconds
- `subpages` (number): Number of subpages to crawl
- `subpageTarget` (string|array): Keywords for subpages
- `extras` (object): Extra parameters (links, imageLinks)

**Returns:** Promise<Object>

### `getResults(query, options)`

Get just the results array.

**Returns:** Promise<Array>

### `getContext(query, options)`

Get context string for LLM.

**Returns:** Promise<string>

### `neuralSearch(query, options)`

Neural search (embeddings-based).

**Returns:** Promise<Object>

### `keywordSearch(query, options)`

Keyword search (Google-like SERP).

**Returns:** Promise<Object>

### `fastSearch(query, options)`

Fast search (streamlined versions).

**Returns:** Promise<Object>

### Category-Specific Functions

- `searchResearchPapers(query, options)`
- `searchNews(query, options)`
- `searchCompanies(query, options)`
- `searchGitHub(query, options)`

All return Promise<Object>

## Response Format

```javascript
{
  requestId: "b5947044c4b78efa9552a7c89b306d95",
  resolvedSearchType: "neural",
  results: [
    {
      title: "Article Title",
      url: "https://example.com/article",
      publishedDate: "2023-11-16T01:36:32.547Z",
      author: "Author Name",
      id: "https://example.com/article",
      image: "https://example.com/image.png",
      favicon: "https://example.com/favicon.ico",
      text: "Full content text...",
      highlights: ["Key highlight 1", "Key highlight 2"],
      highlightScores: [0.95, 0.87],
      summary: "Summary of the content...",
      subpages: [/* subpage results */],
      extras: {
        links: ["https://link1.com", "https://link2.com"],
        imageLinks: ["https://img1.jpg"]
      }
    }
  ],
  context: "Combined context string for all results...",
  costDollars: {
    total: 0.005,
    breakDown: [
      {
        search: 0.005,
        contents: 0.001,
        breakdown: {
          neuralSearch: 0.005,
          contentText: 0.001
        }
      }
    ]
  }
}
```

## Search Types

### Auto (Default)
Intelligently combines neural and keyword search for best results.

### Neural
Embeddings-based semantic search. Best for:
- Conceptual queries
- Finding similar content
- When you know what you're looking for but not the exact keywords

### Keyword
Traditional Google-like search. Best for:
- Specific terms or phrases
- Technical queries
- When exact matching is important

### Fast
Streamlined versions of neural and keyword. Best for:
- Quick responses needed
- Cost optimization
- High-volume queries

## Categories

Focus your search on specific content types:

- `company` - Company websites and information
- `research paper` - Academic papers
- `news` - News articles
- `pdf` - PDF documents
- `github` - GitHub repositories
- `tweet` - Twitter/X posts
- `personal site` - Personal websites and blogs
- `linkedin profile` - LinkedIn profiles
- `financial report` - Financial reports and filings

## Content Options

### Text
```javascript
{
  text: true  // Simple
  // or
  text: {
    maxCharacters: 1000,
    includeHtmlTags: true
  }
}
```

### Highlights
```javascript
{
  highlights: {
    numSentences: 2,
    highlightsPerUrl: 3,
    query: "Custom query for highlights"
  }
}
```

### Summary
```javascript
{
  summary: {
    query: "What to summarize",
    schema: {
      type: "object",
      properties: {
        keyPoints: { type: "array", items: { type: "string" } }
      }
    }
  }
}
```

### Livecrawl
```javascript
{
  livecrawl: "always",  // "never", "fallback", "always", "preferred"
  livecrawlTimeout: 5000
}
```

### Subpages
```javascript
{
  subpages: 3,
  subpageTarget: ["documentation", "examples"]
}
```

### Extras
```javascript
{
  extras: {
    links: 10,        // Extract links from page
    imageLinks: 5     // Extract image URLs
  }
}
```

## Pricing

Costs vary by search type and content operations:

**Per Request:**
- Neural search (1-25 results): $0.005
- Neural search (26-100 results): $0.025
- Keyword search (1-100 results): $0.0025

**Per Page:**
- Content text: $0.001
- Content highlights: $0.001
- Content summary: $0.001

Check `result.costDollars` for exact costs.

## Use Cases

### RAG (Retrieval-Augmented Generation)
```javascript
const context = await getContext("machine learning frameworks", {
  numResults: 5,
  text: { maxCharacters: 10000 }
});

// Use context with your LLM
const answer = await llm.complete(`Context: ${context}\n\nQuestion: ...`);
```

### Research
```javascript
const papers = await searchResearchPapers("transformer architecture", {
  includeDomains: ["arxiv.org"],
  startPublishedDate: "2024-01-01T00:00:00.000Z",
  text: true,
  summary: { query: "Key contributions" }
});
```

### News Monitoring
```javascript
const news = await searchNews("AI breakthroughs", {
  startPublishedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  numResults: 20
});
```

### Competitive Intelligence
```javascript
const competitors = await searchCompanies("AI agent platforms", {
  text: true,
  subpages: 2,
  subpageTarget: "pricing"
});
```

## Best Practices

1. **Choose the Right Type**: Use `neural` for semantic search, `keyword` for exact matches
2. **Optimize Costs**: Request only the content you need
3. **Use Filters**: Narrow results with domains, dates, and categories
4. **Context for RAG**: Use `context` option for LLM applications
5. **Batch Requests**: Group similar queries when possible
6. **Cache Results**: Store results to avoid repeated API calls

## Example: Complete Workflow

```javascript
import { searchAndContents } from './core/search/exa-search/exa-search.js';

async function researchTopic(topic) {
  const result = await searchAndContents(topic, {
    type: "neural",
    category: "research paper",
    numResults: 10,
    includeDomains: ["arxiv.org", "paperswithcode.com"],
    text: { maxCharacters: 5000 },
    highlights: {
      numSentences: 2,
      highlightsPerUrl: 3
    },
    summary: {
      query: "Key findings and methodology"
    }
  });
  
  console.log(`Found ${result.results.length} papers`);
  console.log(`Cost: $${result.costDollars.total.toFixed(4)}`);
  
  return result.results.map(r => ({
    title: r.title,
    url: r.url,
    summary: r.summary,
    highlights: r.highlights
  }));
}

// Usage
const research = await researchTopic("few-shot learning");
console.log(research);
```

