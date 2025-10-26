# Val Town Backend

This folder contains Val Town-specific implementations for Mockingbird.

## Structure

```
platforms/valtown/
├── main.js              # Val Town entry point (HTTP handler)
├── cron.js              # Cron job handler for running alerts
├── storage.js           # Val Town storage adapters (Blob, SQLite)
├── routes.js            # Val Town-specific routes
└── README.md            # This file
```

## Val Town Specific Features

### Storage

Val Town provides:
- **Blob Storage**: For storing large objects, search results, etc.
- **SQLite**: For structured data like alerts, feeds, and run history

### Cron Jobs

Val Town supports cron jobs natively. The `cron.js` file exports a function that:
1. Fetches all active alerts
2. Executes searches for each alert
3. Stores results
4. Sends notifications if configured

### Environment Variables

Required Val Town secrets:
- `TAVILY_API_KEY` - For Tavily search
- `EXA_API_KEY` - For Exa search (optional)
- `JINA_API_KEY` - For Jina search (optional)

## Deployment

1. Create a new Val Town project
2. Upload all files from this directory
3. Set environment variables in Val Town settings
4. Deploy `main.js` as an HTTP val
5. Deploy `cron.js` as a Cron val with your desired schedule

## Local Development

You can still test locally:

```bash
deno task serve
```

The code will automatically detect it's not in Val Town and use local storage.

