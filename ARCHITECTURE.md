# Mockingbird Architecture

This document explains the overall architecture and design decisions for Mockingbird.

## Design Philosophy

Mockingbird is designed with three core principles:

1. **Platform Agnostic Core**: Search and scraping logic works anywhere
2. **Unified Interface**: All providers return consistent data structures
3. **Progressive Enhancement**: Start simple (Val Town), scale up (Cloudflare Workers)

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                      (Alpine.js + Tailwind)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Platform Layer                            │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │   Val Town       │              │ Cloudflare       │    │
│  │   - main.js      │              │ - worker.js      │    │
│  │   - cron.js      │              │ - cron.js        │    │
│  │   - storage.js   │              │ - storage.js     │    │
│  │   - routes.js    │              │ - routes.js      │    │
│  └──────────────────┘              └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Imports
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Shared Layer                            │
│  - types.js (Type definitions and helpers)                   │
│  - search-harness.js (Unified search interface)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Imports
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Core Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Tavily  │  │   Exa    │  │   Jina   │  │  Groq    │   │
│  │  Search  │  │  Search  │  │  Search  │  │ Compound │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐                                │
│  │  Tavily  │  │   Jina   │                                │
│  │  Scrape  │  │  Scrape  │                                │
│  └──────────┘  └──────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Search Request Flow

```
User → Frontend → API Route → Search Harness → Provider → Normalize → Response
```

**Example:**
```javascript
// Frontend sends request
POST /api/search
{ query: "AI news", provider: "tavily" }

// API route receives and delegates
app.post('/api/search', async (c) => {
  const body = await c.req.json();
  const result = await search(body);  // Harness
  return c.json(result);
});

// Harness normalizes and returns
{
  success: true,
  query: "AI news",
  provider: "tavily",
  results: [/* SearchResult[] */],
  totalResults: 10,
  timestamp: 1234567890
}
```

### 2. Alert Execution Flow (Cron)

```
Cron Trigger → Get Active Alerts → For Each Alert:
  → Execute Search → Check for New Results → Store Results → 
  → Add to Feeds → (Optional) Send Notifications
```

**Detailed Flow:**
1. Cron job wakes up (hourly, daily, etc.)
2. Fetches all active alerts from storage
3. For each alert:
   - Executes search using the harness
   - Compares results with previous runs (by URL)
   - Identifies new results
   - Creates `AlertRun` record
   - Adds new results as `FeedItem`s to associated feeds
   - (Future) Sends notifications via email/webhook
4. Updates alert's `lastRunAt` timestamp

### 3. Feed Display Flow

```
User → Frontend → GET /api/feeds/:id/items → Storage → 
  → Fetch Items → Sort by Timestamp → Return
```

## Type System

All data structures are defined in `shared/types.js` with JSDoc comments:

```javascript
// Core search types
SearchQuery → search() → SearchResponse
                           └─ SearchResult[]

// Alert system types
Alert → (cron) → AlertRun
                  └─ SearchResponse

// Feed system types
Feed
 └─ alertIds[] → (links to) Alert[]

FeedItem
 ├─ feedId → Feed
 ├─ alertId → Alert
 └─ result → SearchResult
```

## Storage Strategy

### Val Town (Current)

**Blob Storage** (Key-Value):
```
mockingbird:alerts:{id}       → Alert
mockingbird:feeds:{id}        → Feed
mockingbird:runs:{alertId}:{runId} → AlertRun
mockingbird:feeditems:{feedId}:{itemId} → FeedItem
```

**SQLite** (Optional, for complex queries):
- Alert run statistics
- Efficient filtering/sorting

### Cloudflare Workers (Future)

**KV Storage**:
- Similar structure to Blob storage
- Global, low-latency reads

**D1 (SQLite)**:
- Structured queries
- Run history, statistics
- Feed item queries with filters

**R2 (Object Storage)**:
- Large content storage
- Full article caching

## Provider Normalization

Each search provider returns different data structures. The harness normalizes them:

### Tavily
```javascript
// Raw Tavily result
{
  title: "...",
  url: "...",
  snippet: "...",
  raw_content: "...",
  image_url: "...",
  published_date: "..."
}

// Normalized to SearchResult
{
  id: "uuid",
  title: "...",
  url: "...",
  snippet: "...",
  content: "...",
  source: "tavily",
  score: 0.95,
  publishedDate: "2025-10-25T...",
  imageUrl: "...",
  metadata: {}
}
```

### Exa
```javascript
// Raw Exa result
{
  title: "...",
  url: "...",
  text: "...",
  publishedDate: "..."
}

// Normalized to SearchResult (same structure as above)
```

This ensures frontend code doesn't need to know which provider was used.

## Environment Detection

The code detects its runtime environment and adapts:

```javascript
const isValTown = typeof Deno !== "undefined" && Deno.env.get("valtown");

if (isValTown) {
  // Use Val Town's blob storage
  blob.setJSON(key, value);
} else {
  // Use local file system
  Deno.writeTextFile(`./.mockingbird-data/${key}.json`, ...);
}
```

This allows:
- Local development with file system
- Val Town deployment with Blob storage
- Future: Cloudflare with KV storage

## API Design

### RESTful Endpoints

**Search:**
- `POST /api/search` - Execute search
- `POST /api/search/news` - News-specific search
- `GET /api/providers` - List providers

**Alerts (CRUD):**
- `GET /api/alerts` - List all
- `POST /api/alerts` - Create
- `GET /api/alerts/:id` - Get one
- `PUT /api/alerts/:id` - Update
- `DELETE /api/alerts/:id` - Delete
- `GET /api/alerts/:id/runs` - Get run history

**Feeds (CRUD):**
- `GET /api/feeds` - List all
- `POST /api/feeds` - Create
- `GET /api/feeds/:id` - Get one
- `GET /api/feeds/slug/:slug` - Get public feed
- `PUT /api/feeds/:id` - Update
- `GET /api/feeds/:id/items` - Get feed items

## Extension Points

### Adding a New Search Provider

1. **Create provider module** in `/core/search/[provider]/`:
```javascript
// /core/search/newprovider/newprovider.js
export async function searchWithNewProvider(query, options) {
  // Implementation
}
```

2. **Register in harness** (`shared/search-harness.js`):
```javascript
const PROVIDERS = {
  // ...
  newprovider: {
    name: 'New Provider',
    import: () => import('../core/search/newprovider/newprovider.js'),
  },
};
```

3. **Add normalization** in the harness:
```javascript
case 'newprovider': {
  rawResponse = await providerModule.searchWithNewProvider(query, options);
  const results = normalizeResults(rawResponse.data, provider);
  return createSearchResponse({ ... });
}
```

Done! The provider is now available everywhere.

### Adding a New Platform

1. **Create platform folder** (`platforms/[platform]/`)
2. **Implement storage adapter** (`storage.js`)
3. **Implement routes** (`routes.js`)
4. **Create entry point** (`main.js` or `worker.js`)
5. **Add cron handler** (`cron.js`)

The `/shared` and `/core` layers remain unchanged!

## Security Considerations

1. **API Keys**: Always use environment variables
2. **Public Feeds**: Only feeds marked `public: true` are accessible via slug
3. **Rate Limiting**: Should be added at platform layer
4. **Input Validation**: Validate all user inputs
5. **CORS**: Configure appropriately for frontend

## Performance Considerations

1. **Caching**: Cache search results at platform layer
2. **Parallel Searches**: Use `Promise.all()` for multi-provider searches
3. **Pagination**: Implement for feeds with many items
4. **Background Jobs**: Use cron for heavy operations
5. **Edge Deployment**: Cloudflare Workers for global distribution

## Future Enhancements

1. **Notifications**:
   - Email alerts for new results
   - Webhook support
   - RSS feed generation

2. **Advanced Features**:
   - Deduplication across providers
   - Result ranking/scoring
   - Custom filters and rules
   - User accounts and authentication

3. **Analytics**:
   - Track most active alerts
   - Monitor provider performance
   - Usage statistics

4. **UI Enhancements**:
   - Real-time updates (WebSocket)
   - Customizable feed layouts
   - Search result previews
   - Export functionality

