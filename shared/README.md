# Shared Utilities

This folder contains platform-agnostic code that works across all backends (Val Town, Cloudflare Workers, local Deno, etc.).

## Structure

```
shared/
├── types.js              # TypeScript-style type definitions and helpers
├── search-harness.js     # Unified search interface
├── test.js               # Test suite for search harness
└── README.md             # This file
```

## Key Concepts

### Type System

The `types.js` file defines all core data structures used throughout Mockingbird:

- **SearchResult**: Standardized search result format
- **SearchQuery**: Search query parameters
- **SearchResponse**: Standardized search response
- **Alert**: Alert configuration for automated searches
- **AlertRun**: Record of an alert execution
- **Feed**: Collection of alerts organized for display
- **FeedItem**: Individual item in a feed

All types include JSDoc comments for IDE autocomplete and validation.

### Search Harness

The `search-harness.js` provides a unified interface for all search providers:

```javascript
import { search, searchNews, multiSearch } from './search-harness.js';

// Simple search
const result = await search({
  query: "artificial intelligence news",
  provider: "tavily",
  maxResults: 10
});

// News-specific search
const newsResult = await searchNews("OpenAI", { maxResults: 5 });

// Multi-provider search
const results = await multiSearch(
  { query: "quantum computing" },
  ["tavily", "exa"]
);
```

The harness automatically:
- Normalizes results from different providers into a standard format
- Handles errors gracefully
- Returns consistent `SearchResponse` objects

## Benefits

1. **Platform Independence**: Code in this folder works everywhere
2. **Type Safety**: JSDoc types provide autocomplete and validation
3. **Consistency**: All search results have the same structure
4. **Extensibility**: Easy to add new providers or platforms

## Usage in Platform Code

Platform-specific code (in `/platforms/valtown` or `/platforms/cloudflare`) should:
1. Import types and harness from `/shared`
2. Implement platform-specific storage
3. Use the harness for all search operations

Example:

```javascript
// In platforms/valtown/routes.js
import { search } from '../../shared/search-harness.js';
import { createAlert } from '../../shared/types.js';

app.post('/api/search', async (c) => {
  const body = await c.req.json();
  const result = await search(body); // Uses harness
  return c.json(result);
});
```

## Adding New Search Providers

To add a new search provider:

1. Create provider module in `/core/search/[provider]/`
2. Add provider to `PROVIDERS` registry in `search-harness.js`
3. Add normalization logic for the provider's result format

The rest of the system will automatically support the new provider!

## Testing

Test the search harness with:

```bash
deno task test:harness
```

This runs `shared/test.js` which demonstrates:
- Getting available providers
- Simple search
- News search
- Multi-provider search
- Error handling

You can also test individual providers directly:
```bash
deno task search:tavily
deno task search:exa
deno task search:jina
```

