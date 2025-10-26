# Migration Guide

This guide helps you migrate between platforms and understand the changes made to the codebase.

## From Old Structure to New Structure

### What Changed?

**Before:**
```
/
├── main.js              # Entry point
├── core/
│   ├── utils.js
│   └── routes.js
└── frontend/
    └── index.html
```

**After:**
```
/
├── platforms/
│   ├── valtown/        # Platform-specific code
│   └── cloudflare/
├── shared/              # Platform-agnostic
│   ├── types.js
│   └── search-harness.js
├── core/                # Search providers
│   ├── search/
│   └── scrape/
└── frontend/
    └── index.html
```

### Why This Change?

1. **Separation of Concerns**: Core logic (search) is separate from platform code (Val Town/Cloudflare)
2. **Reusability**: The `shared/` layer works everywhere
3. **Type Safety**: Centralized type definitions
4. **Easy Testing**: Test providers independently with `deno task` commands

## Migrating Existing Code

### If You Were Using the Old `main.js`

**Old:**
```javascript
import { Hono } from 'https://deno.land/x/hono@v3.11.12/mod.ts';
import { setupRoutes } from './core/routes.js';

const app = new Hono();
setupRoutes(app);
export default app.fetch;
```

**New:**
```javascript
// This is now platforms/valtown/main.js
import { Hono } from 'https://deno.land/x/hono@v3.11.12/mod.ts';
import { setupRoutes } from './routes.js'; // Note: relative path changed

const app = new Hono();
setupRoutes(app);
export default (typeof Deno !== "undefined" && Deno.env.get("valtown")) ? app.fetch : app;
```

### If You Were Directly Calling Search Providers

**Old:**
```javascript
import { searchWithTavily } from './core/search/tavily/tavily.js';

const results = await searchWithTavily("query", { maxResults: 10 });
// Results are in Tavily-specific format
```

**New (Recommended):**
```javascript
import { search } from './shared/search-harness.js';

const response = await search({
  query: "query",
  provider: "tavily",
  maxResults: 10
});
// response.results are in standardized format
```

**New (Direct access still works):**
```javascript
import { searchWithTavily } from './core/search/tavily/tavily.js';

const results = await searchWithTavily("query", { maxResults: 10 });
// Still works if you need Tavily-specific features
```

## Running the New Structure

### Local Development

```bash
# Start the server (now uses platforms/valtown/main.js)
deno task serve

# Test the search harness
deno task test:harness

# Test cron job locally
deno task cron

# Test individual providers (unchanged)
deno task search:tavily
deno task search:exa
```

### Val Town Deployment

**Main HTTP Val:**
1. Upload files from `platforms/valtown/`
2. Upload `shared/` folder
3. Upload `core/` folder
4. Entry point: `platforms/valtown/main.js`

**Cron Val:**
1. Create separate Cron val
2. Entry point: `platforms/valtown/cron.js`
3. Set schedule (e.g., `0 * * * *` for hourly)

## API Changes

### New Endpoints

**Search (standardized):**
```bash
# Execute search with any provider
curl -X POST https://your-val.val.town/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI news",
    "provider": "tavily",
    "maxResults": 10
  }'
```

**Alerts:**
```bash
# Create alert
curl -X POST https://your-val.val.town/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI News Alert",
    "query": "artificial intelligence",
    "provider": "tavily",
    "frequency": "0 */6 * * *"
  }'

# Get all alerts
curl https://your-val.val.town/api/alerts

# Get alert runs
curl https://your-val.val.town/api/alerts/{id}/runs
```

**Feeds:**
```bash
# Create feed
curl -X POST https://your-val.val.town/api/feeds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech News",
    "alertIds": ["alert-id-1", "alert-id-2"],
    "isPublic": true,
    "slug": "tech-news"
  }'

# Get feed items
curl https://your-val.val.town/api/feeds/{id}/items

# Public feed by slug
curl https://your-val.val.town/api/feeds/slug/tech-news
```

## Type Definitions

### Using Types in Your Code

All types are defined with JSDoc in `shared/types.js`. Modern editors will give you autocomplete:

```javascript
import { createAlert, createFeed } from './shared/types.js';

// Auto-complete works!
const alert = createAlert({
  name: "My Alert",
  query: "test query",
  provider: "tavily",
  // ... editor suggests all options
});
```

### Type Checking

For stricter type checking, add to your file:
```javascript
// @ts-check
import { search } from './shared/search-harness.js';

/** @type {import('./shared/types.js').SearchQuery} */
const query = {
  query: "test",
  provider: "tavily",
  maxResults: 10
};

const response = await search(query);
// response is typed as SearchResponse
```

## Storage Migration

### Val Town Blob Storage

The new storage layer uses a namespaced key structure:

```javascript
// Old (if you had custom storage)
await blob.setJSON("myalert", alertData);

// New (namespaced)
await blob.setJSON("mockingbird:alerts:myalert", alertData);
```

Use the storage functions instead:
```javascript
import { saveAlert, getAlerts } from './platforms/valtown/storage.js';

await saveAlert(alert);
const alerts = await getAlerts();
```

### Local Development Storage

When developing locally, data is stored in `.mockingbird-data/`:

```
.mockingbird-data/
├── mockingbird:alerts:{id}.json
├── mockingbird:feeds:{id}.json
├── mockingbird:runs:{alertId}:{runId}.json
└── mockingbird:feeditems:{feedId}:{itemId}.json
```

Add to `.gitignore`:
```
.mockingbird-data/
```

## Breaking Changes

### None! 

This is a reorganization, not a breaking change. The old structure is preserved in the `main.js` file at the root for reference.

### Recommended Changes

1. **Update imports** to use the search harness instead of direct provider calls
2. **Use platform storage functions** instead of direct Blob/KV access
3. **Use type helpers** (`createAlert`, `createFeed`, etc.) for consistency

## Troubleshooting

### "Module not found" errors

Make sure your imports use the correct relative paths:
- From `platforms/valtown/`: use `../../shared/` and `../../core/`
- From root: use `./shared/` and `./core/`

### Storage not working locally

Ensure you have write permissions:
```bash
mkdir .mockingbird-data
chmod 755 .mockingbird-data
```

### Cron job not running in Val Town

1. Check that environment variables are set
2. Verify cron expression syntax
3. Check Val Town logs for errors

### Search results look different

The harness normalizes all results to a standard format. If you need provider-specific data, it's in the `metadata` field:

```javascript
const response = await search({ query: "test", provider: "tavily" });
const providerSpecific = response.metadata; // Provider-specific data
```

## Getting Help

1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design details
2. Read provider-specific READMEs in `core/search/[provider]/`
3. Run test commands to see examples: `deno task test:harness`
4. Look at test files: `core/search/*/test.js`

