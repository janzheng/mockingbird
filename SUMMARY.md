# Mockingbird Organization Summary

## What Was Done

I've restructured Mockingbird to support a clean separation between platform-specific code (Val Town, Cloudflare Workers) and platform-agnostic core functionality. Here's what was created:

## New Folder Structure

```
mockingbird/
├── shared/                          # 🆕 Platform-agnostic code
│   ├── types.js                    # Type definitions & helpers
│   ├── search-harness.js           # Unified search interface
│   └── README.md
│
├── platforms/                       # 🆕 Platform-specific implementations
│   ├── valtown/                    # Val Town backend (Phase 1)
│   │   ├── main.js                 # HTTP entry point
│   │   ├── cron.js                 # Cron job for alerts
│   │   ├── routes.js               # API routes
│   │   ├── storage.js              # Storage adapters (Blob/SQLite)
│   │   └── README.md
│   │
│   └── cloudflare/                 # Cloudflare Workers (Phase 2)
│       └── README.md               # Placeholder for future
│
├── core/                            # Existing - search providers
│   ├── search/                     # (unchanged)
│   └── scrape/                     # (unchanged)
│
├── frontend/                        # Existing - frontend
│   └── index.html
│
├── test-harness.js                 # 🆕 Test file for search harness
├── ARCHITECTURE.md                 # 🆕 Architecture documentation
├── MIGRATION.md                    # 🆕 Migration guide
├── README.md                       # ✏️ Updated with new structure
└── deno.json                       # ✏️ Updated tasks
```

## Key Files Created

### 1. **shared/types.js** - Type System
- Defines all core data structures:
  - `SearchResult`: Standardized search result
  - `SearchQuery`: Search parameters
  - `SearchResponse`: API response format
  - `Alert`: Alert configuration
  - `AlertRun`: Alert execution record
  - `Feed`: Collection of alerts
  - `FeedItem`: Individual feed items
- Helper functions: `createAlert()`, `createFeed()`, `createSearchResult()`, etc.
- Full JSDoc types for IDE autocomplete

### 2. **shared/search-harness.js** - Unified Search Interface
- Single interface for all search providers
- Automatically normalizes results to `SearchResult` format
- Provider registry with dynamic imports
- Functions:
  - `search(query)` - Execute search with any provider
  - `searchNews(query)` - News-specific search
  - `multiSearch(query, providers)` - Search multiple providers
  - `getAvailableProviders()` - List available providers

### 3. **platforms/valtown/main.js** - Val Town Entry Point
- Hono app setup
- Imports routes from `routes.js`
- Environment detection for Val Town vs local

### 4. **platforms/valtown/routes.js** - API Routes
Complete REST API:
- **Search**: `POST /api/search`, `POST /api/search/news`
- **Alerts**: CRUD endpoints for alerts
- **Feeds**: CRUD endpoints for feeds
- **Providers**: `GET /api/providers`

### 5. **platforms/valtown/storage.js** - Storage Adapters
- Environment-aware storage (Val Town Blob vs local files)
- Functions for alerts, feeds, runs, and feed items
- Automatic namespacing: `mockingbird:alerts:{id}`
- Local development uses `.mockingbird-data/` folder

### 6. **platforms/valtown/cron.js** - Cron Job Handler
- Fetches active alerts
- Executes searches on schedule
- Detects new results (compares with previous runs)
- Stores results in feeds
- Creates `AlertRun` records
- Can be run locally: `deno task cron`

### 7. **test-harness.js** - Test Suite
Demonstrates:
- Getting available providers
- Simple search
- News search
- Multi-provider search
- Error handling

## How It Works

### Search Flow
```javascript
// Use the harness for standardized results
import { search } from './shared/search-harness.js';

const response = await search({
  query: "AI news",
  provider: "tavily",
  maxResults: 10
});

// response is always a SearchResponse with normalized SearchResult[]
```

### Alert System Flow
1. Create alerts via API
2. Cron job runs on schedule
3. Executes searches for each alert
4. Compares with previous results (by URL)
5. Adds new results to associated feeds
6. Records run in `AlertRun`

### Storage Strategy
**Val Town**: Uses Blob storage with namespaced keys
**Local Dev**: Uses `.mockingbird-data/` folder
**Future Cloudflare**: Will use KV/D1

## Commands

```bash
# Start Val Town backend locally
deno task serve

# Test the search harness
deno task test:harness

# Run cron job locally
deno task cron

# Test individual providers (unchanged)
deno task search:tavily
deno task search:exa
```

## Benefits of This Structure

### 1. Platform Independence
- `core/` and `shared/` work on any platform
- Only `platforms/` code is platform-specific
- Easy to add new platforms (Cloudflare, AWS Lambda, etc.)

### 2. Unified Interface
- All search providers return the same `SearchResponse` format
- Frontend doesn't need to know which provider was used
- Easy to switch providers or use multiple

### 3. Type Safety
- JSDoc types throughout
- IDE autocomplete for all data structures
- Catch errors at development time

### 4. Easy Testing
- Test providers independently
- Test harness separately
- Test cron logic locally

### 5. Clear Separation
- Search logic (`core/`) separate from platform code
- Storage abstraction (`platforms/*/storage.js`)
- Routes separate from entry point

## Migration from Val Town to Cloudflare

When you're ready to move to Cloudflare Workers:

1. Keep `core/` and `shared/` unchanged
2. Create `platforms/cloudflare/storage.js` (KV/D1 adapter)
3. Create `platforms/cloudflare/routes.js` (same API)
4. Create `platforms/cloudflare/worker.js` (entry point)
5. Create `wrangler.toml` config

The API and type system remain identical!

## Next Steps

### For Val Town Deployment:
1. Upload `platforms/valtown/`, `shared/`, and `core/` folders
2. Set environment variables (TAVILY_API_KEY, etc.)
3. Deploy `platforms/valtown/main.js` as HTTP val
4. Deploy `platforms/valtown/cron.js` as Cron val

### For Development:
1. Continue using `deno task` commands to test
2. Core search providers in `core/search/` unchanged
3. Use search harness for new features
4. Build frontend against the new API

### For Future:
1. Build out frontend to consume the APIs
2. Add notification system (email, webhooks)
3. Implement Cloudflare Workers backend
4. Add user authentication
5. RSS feed generation

## Documentation

- **README.md**: Overview and quick start
- **ARCHITECTURE.md**: Deep dive into design
- **MIGRATION.md**: Migration guide
- **shared/README.md**: Shared layer documentation
- **platforms/valtown/README.md**: Val Town specifics
- **platforms/cloudflare/README.md**: Future Cloudflare docs

## Questions?

The structure is designed to be:
- **Intuitive**: Each layer has a clear purpose
- **Flexible**: Easy to add providers and platforms
- **Maintainable**: Changes are isolated to specific layers
- **Testable**: Every layer can be tested independently

Let me know if you'd like me to:
- Add more providers
- Build out the frontend
- Add more features to the API
- Create example frontend code
- Add authentication

