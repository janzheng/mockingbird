# Jina Search

> Search the web using Jina Search API (s.jina.ai) and get structured SERP results.

Based on the official Jina AI documentation: [https://r.jina.ai/docs](https://r.jina.ai/docs)

## Features

- **Web Search**: Search the web and get 5 structured SERP results
- **JSON Response**: All results in clean JSON format
- **Rate Limits**: API key support for higher limits
- **Simple API**: Easy-to-use search functions

## Usage

### Basic Search

```javascript
import { searchWithJina } from './jina.js';

// Search the web
const results = await searchWithJina("latest AI developments");
console.log(results); // { data: [...5 search results] }
```

### Get Just Results Array

```javascript
import { searchJinaResults } from './jina.js';

// Get just the results array
const entries = await searchJinaResults("latest AI developments");
entries.forEach(entry => {
  console.log(entry.title);
  console.log(entry.url);
  console.log(entry.content);
});
```

### With Options

```javascript
import { searchWithJina } from './jina.js';

const results = await searchWithJina("AI news", {
  timeout: 15,
  tokenBudget: 50000
});
```

## API Functions

### `searchWithJina(query, options)`

Search the web and get SERP results.

**Parameters:**
- `query` (string): The search query
- `options` (Object):
  - `timeout` (number): Max wait time in seconds
  - `tokenBudget` (number): Max tokens for this request

**Returns:** Promise<Object> - Search results with data array

### `searchJinaResults(query, options)`

Search and return just the results array.

**Parameters:**
- `query` (string): The search query
- `options` (Object): Same as searchWithJina

**Returns:** Promise<Array> - Array of search result objects

## Response Format

```javascript
{
  data: [
    {
      title: "Result Title",
      url: "https://example.com",
      content: "Result description and preview text..."
    },
    {
      title: "Another Result",
      url: "https://example2.com",
      content: "More content..."
    }
    // ... up to 5 total results
  ]
}
```

## Rate Limits

- **Without API key**: Limited requests
- **With API key**: Higher rate limits

Set your API key:
```bash
JINA_API_KEY=jina_your_api_key_here
```

## Testing

```bash
# Basic search
deno task search:jina "latest AI developments"

# Search for news
deno task search:jina "current events in technology"

# Search for places
deno task search:jina "best restaurants in Tokyo"

# Research topics
deno task search:jina "quantum computing breakthroughs"
```

## Examples

### Search and Process Results

```javascript
const results = await searchJinaResults("machine learning");

for (const result of results) {
  console.log(`Title: ${result.title}`);
  console.log(`URL: ${result.url}`);
  console.log(`Preview: ${result.content.substring(0, 100)}...`);
  console.log('---');
}
```

### Search with Custom Timeout

```javascript
const results = await searchWithJina("complex query", {
  timeout: 20 // Wait up to 20 seconds
});
```

### Search with Token Budget

```javascript
const results = await searchWithJina("detailed topic", {
  tokenBudget: 30000 // Limit to 30k tokens
});
```

## Best Practices

1. **Clear Queries**: Use specific, clear search queries for best results
2. **API Key**: Use an API key for higher rate limits
3. **Error Handling**: Wrap calls in try/catch for robust error handling
4. **Rate Limiting**: Be mindful of API rate limits
5. **Results Count**: API returns up to 5 results per search

## API Endpoint

- **Search**: `https://s.jina.ai/{query}`

## Error Handling

The API handles various error scenarios:
- Network errors
- Timeout errors
- Rate limit errors
- Invalid queries
- Authentication errors

All errors are thrown with descriptive messages for debugging.

## Related

- **Jina Reader** (for scraping): See `/core/scrape/jina/` for reading and extracting web page content
- **Tavily Search**: See `/core/search/tavily/` for alternative search API
- **Exa Search**: See `/core/search/exa-search/` for another search option

