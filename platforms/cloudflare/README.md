# Cloudflare Workers Backend

This folder will contain Cloudflare Workers-specific implementations for Mockingbird.

## Structure (Coming Soon)

```
platforms/cloudflare/
├── worker.js            # Cloudflare Worker entry point
├── cron.js              # Scheduled tasks using Cloudflare Cron Triggers
├── storage.js           # Cloudflare storage adapters (KV, Durable Objects, D1)
├── routes.js            # Cloudflare-specific routes
├── wrangler.toml        # Cloudflare Workers configuration
└── README.md            # This file
```

## Cloudflare Specific Features

### Storage

Cloudflare provides:
- **KV**: Key-value storage for alerts, feeds, etc.
- **D1**: SQLite database for structured queries
- **Durable Objects**: For real-time features and consistency
- **R2**: Object storage for large files

### Cron Triggers

Cloudflare Workers supports scheduled tasks via Cron Triggers in `wrangler.toml`.

### Environment Variables

Required Cloudflare secrets:
- `TAVILY_API_KEY` - For Tavily search
- `EXA_API_KEY` - For Exa search (optional)
- `JINA_API_KEY` - For Jina search (optional)

## Migration from Val Town

The core search functionality in `/shared` and `/core` will work with minimal changes.
Only the storage layer and environment detection needs to be adapted.

## Deployment

1. Install Wrangler CLI: `npm install -g wrangler`
2. Configure `wrangler.toml`
3. Set secrets: `wrangler secret put TAVILY_API_KEY`
4. Deploy: `wrangler deploy`

## Development

```bash
wrangler dev
```

## TODO

- [ ] Implement Cloudflare Workers entry point
- [ ] Create storage adapters for KV/D1
- [ ] Set up cron triggers
- [ ] Create wrangler.toml configuration
- [ ] Test migration from Val Town

