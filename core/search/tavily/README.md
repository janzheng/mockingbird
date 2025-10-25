# Tavily Search

Tavily is a search API optimized for LLMs and RAG, designed to provide accurate, fact-based results with AI-generated answers.

## Setup

Make sure you have a `TAVILY_API_KEY` environment variable set in your `.env` file:

```
TAVILY_API_KEY=tvly-your_api_key_here
```

Get your API key from [Tavily](https://tavily.com/)

## Usage

### Basic Search

```javascript
import { searchWithTavily } from './core/search/tavily/tavily.js';

// Simple query
const result = await searchWithTavily("Who is Leo Messi?");
console.log(result.results);
console.log(result.answer);
```

### Get Results Only

```javascript
import { searchTavilyResults } from './core/search/tavily/tavily.js';

const results = await searchTavilyResults("Best pizza in New York");
results.forEach(item => {
  console.log(item.title);
  console.log(item.url);
  console.log(item.content);
});
```

### Get AI Answer

```javascript
import { searchTavilyAnswer } from './core/search/tavily/tavily.js';

const answer = await searchTavilyAnswer("What is quantum computing?");
console.log(answer);
```

### Advanced Search

```javascript
import { searchTavilyAdvanced } from './core/search/tavily/tavily.js';

// More comprehensive results with deeper search
const result = await searchTavilyAdvanced("Climate change impact 2024");
```

### News Search

```javascript
import { searchTavilyNews } from './core/search/tavily/tavily.js';

// Search specifically for news articles
const news = await searchTavilyNews("Latest AI breakthroughs");
```

### Advanced Options

```javascript
import { searchWithTavily } from './core/search/tavily/tavily.js';

const result = await searchWithTavily("Latest tech news", {
  searchDepth: "advanced",      // "basic" or "advanced"
  topic: "news",                 // "general" or "news"
  maxResults: 10,                // Maximum number of results
  includeAnswer: true,           // Include AI-generated answer
  includeImages: true,           // Include images in results
  includeRawContent: false,      // Include raw HTML content
  includeDomains: ["techcrunch.com", "theverge.com"],  // Specific domains
  excludeDomains: ["example.com"]  // Domains to exclude
});
```

## CLI Testing

```bash
# Test Tavily search from command line
deno task search:tavily "your search query here"

# Examples
deno task search:tavily "Who is Leo Messi?"
deno task search:tavily "Latest AI developments"
deno task search:tavily "Best restaurants in Tokyo"
```

## Available Functions

### `searchWithTavily(query, options)`

Main function that returns the full Tavily API response object.

**Parameters:**
- `query` (string): The search query
- `options` (object): Optional parameters
  - `searchDepth` (string): "basic" or "advanced" (default: "basic")
  - `topic` (string): "general" or "news" (default: "general")
  - `maxResults` (number): Maximum number of results (default: 5)
  - `includeImages` (boolean): Include images in results
  - `includeAnswer` (boolean): Include AI-generated answer
  - `includeRawContent` (boolean): Include raw HTML content
  - `includeDomains` (array): List of domains to include
  - `excludeDomains` (array): List of domains to exclude

**Returns:** Promise<Object> - Full response including:
- `answer` - AI-generated answer
- `results` - Array of search results
- `query` - The original query
- `response_time` - Time taken for the search

### `searchTavilyResults(query, options)`

Returns just the results array.

**Returns:** Promise<Array>

### `searchTavilyAnswer(query, options)`

Returns just the AI-generated answer.

**Returns:** Promise<string>

### `searchTavilyAdvanced(query, options)`

Performs an advanced depth search.

**Returns:** Promise<Object>

### `searchTavilyNews(query, options)`

Searches specifically for news articles.

**Returns:** Promise<Object>

## Response Format

```javascript
{
  answer: "AI-generated answer to the query...",
  query: "original query",
  response_time: 2.34,
  images: [...],
  results: [
    {
      title: "Article Title",
      url: "https://example.com/article",
      content: "Relevant content snippet...",
      score: 0.98,
      published_date: "2024-01-01"
    },
    // more results...
  ]
}
```

## Key Features

- **AI-Generated Answers**: Get concise, fact-based answers
- **High-Quality Results**: Optimized for LLM consumption
- **News Search**: Dedicated news article search
- **Domain Filtering**: Include or exclude specific domains
- **Images**: Optional image results
- **Fast Response Times**: Optimized for speed

## Use Cases

- **Research**: Quick fact-finding and research
- **RAG Systems**: Provide context for LLM responses
- **News Monitoring**: Track latest developments
- **Content Discovery**: Find relevant articles and sources

## Pricing

Check [Tavily's pricing page](https://tavily.com/pricing) for current rates. They offer a free tier for testing.

