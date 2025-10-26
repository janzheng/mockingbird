# Mockingbird

A Google News / Google Alerts style system for monitoring and aggregating search results across multiple providers. Built with Hono + Alpine.js and designed to run on Val Town (initially) and Cloudflare Workers (future).

## What is Mockingbird?

Mockingbird is a news monitoring and alert system that:
- **Searches multiple providers**: Tavily, Exa, Jina, and Groq Compound Search
- **Runs scheduled searches**: Cron jobs execute alerts on a schedule
- **Aggregates results**: Organizes search results into customizable feeds
- **Detects new content**: Only shows new results since the last run
- **Provides a unified API**: Consistent interface across all search providers

## Project Structure

```
/
├── core/                    # Core search/scrape implementations
│   ├── search/             # Search provider modules
│   │   ├── tavily/
│   │   ├── exa-search/
│   │   ├── exa-research/
│   │   ├── jina/
│   │   └── groq-compound/
│   └── scrape/             # Web scraping modules
│
├── shared/                  # Platform-agnostic code
│   ├── types.js            # Type definitions and helpers
│   ├── search-harness.js   # Unified search interface
│   └── README.md
│
├── platforms/              # Platform-specific implementations
│   ├── valtown/           # Val Town backend
│   │   ├── main.js        # HTTP entry point
│   │   ├── cron.js        # Cron job handler
│   │   ├── routes.js      # API routes
│   │   ├── storage.js     # Storage adapters
│   │   └── README.md
│   └── cloudflare/        # Cloudflare Workers (coming soon)
│       └── README.md
│
├── frontend/              # Frontend UI
│   └── index.html
│
├── main.js                # Local development entry point
└── deno.json             # Deno configuration
```

## Architecture Overview

### Core Layer (`/core`)
- Provider-specific implementations for search and scraping
- Each provider has its own module with test files
- No platform dependencies - pure search/scrape logic

### Shared Layer (`/shared`)
- **types.js**: Type definitions (SearchResult, Alert, Feed, etc.)
- **search-harness.js**: Unified interface that normalizes all providers
- Works across all platforms (Val Town, Cloudflare, local Deno)

### Platform Layer (`/platforms`)
- Platform-specific code for Val Town and Cloudflare Workers
- Storage adapters for each platform (Blob, KV, D1, etc.)
- Environment detection and deployment configs

## Getting Started

### Local Development

```bash
# Run the development server
deno task serve

# Test individual search providers
deno task search          # Groq Compound
deno task search:tavily   # Tavily
deno task search:exa      # Exa

# The app will be available at http://localhost:9990
```

### Val Town Deployment

1. Create a new Val Town HTTP val
2. Upload files from `platforms/valtown/`
3. Set environment variables (TAVILY_API_KEY, etc.)
4. Deploy `main.js` as HTTP val
5. Deploy `cron.js` as separate Cron val

See [platforms/valtown/README.md](./platforms/valtown/README.md) for details.

## Key Features

### Unified Search Interface

All search providers are accessed through a single harness:

```javascript
import { search } from './shared/search-harness.js';

const result = await search({
  query: "AI news",
  provider: "tavily",
  maxResults: 10,
  topic: "news"
});

// result is always a standardized SearchResponse object
```

### Alerts & Feeds

Create alerts that run on a schedule:

```javascript
const alert = createAlert({
  name: "AI News",
  query: "artificial intelligence",
  provider: "tavily",
  frequency: "0 */6 * * *", // Every 6 hours
});
```

Organize alerts into feeds for display:

```javascript
const feed = createFeed({
  name: "Tech News",
  alertIds: [alert1.id, alert2.id],
  isPublic: true,
  slug: "tech-news"
});
```

### Type System

Full JSDoc type definitions for IDE autocomplete:

- `SearchResult`: Normalized search result
- `SearchResponse`: API response format
- `Alert`: Alert configuration
- `AlertRun`: Execution record
- `Feed`: Collection of alerts
- `FeedItem`: Individual feed item

### Multi-Platform Support

The same core code works on:
- **Val Town**: Uses Blob storage and SQLite
- **Cloudflare Workers**: Will use KV, D1, and R2
- **Local Deno**: Uses file system for testing

## API Endpoints

### Search
- `POST /api/search` - Execute a search
- `POST /api/search/news` - Search for news
- `GET /api/providers` - List available providers

### Alerts
- `GET /api/alerts` - List all alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts/:id` - Get alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert
- `GET /api/alerts/:id/runs` - Get alert execution history

### Feeds
- `GET /api/feeds` - List all feeds
- `POST /api/feeds` - Create feed
- `GET /api/feeds/:id` - Get feed
- `GET /api/feeds/slug/:slug` - Get public feed by slug
- `GET /api/feeds/:id/items` - Get feed items

## Environment Variables

Required API keys (set in .env or platform secrets):
- `TAVILY_API_KEY` - For Tavily search
- `EXA_API_KEY` - For Exa search (optional)
- `JINA_API_KEY` - For Jina search (optional)
- `GROQ_API_KEY` - For Groq Compound search (optional)

## How It Works

1. **Alert Creation**: Define search queries and schedules
2. **Cron Execution**: Cron job runs alerts on schedule
3. **Result Aggregation**: New results are detected and stored
4. **Feed Organization**: Results are organized into feeds
5. **Frontend Display**: Users view feeds with new content highlighted

## Adding New Search Providers

1. Create provider module in `/core/search/[provider]/`
2. Export standardized search functions
3. Add to registry in `shared/search-harness.js`
4. Add normalization logic for result format

The rest of the system automatically supports it!

## Migration Path

**Phase 1 (Current)**: Val Town
- Quick deployment and testing
- Blob storage for data
- Native cron support

**Phase 2 (Future)**: Cloudflare Workers
- Global edge deployment
- KV + D1 for storage
- Cron Triggers for scheduling

The `/shared` and `/core` code remains unchanged between platforms.

