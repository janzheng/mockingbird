# Mockingbird

A minimal Hono + Alpine.js starter template that works with both Val Town and local Deno.

## Project Structure

```
/
├── main.js              # Entry point - minimal Hono setup
├── core/
│   ├── utils.js         # Core utilities (file reading, ID generation)
│   └── routes.js        # Route definitions
├── frontend/
│   └── index.html       # Alpine.js frontend
└── backend/             # Additional backend modules (as needed)
```

## Getting Started

### Local Development

```bash
# Run the development server
deno task serve

# The app will be available at http://localhost:9990
```

### Val Town Deployment

The app is designed to work seamlessly on Val Town. Simply:
1. Create a new Val Town project
2. Upload your files
3. The app will automatically detect the Val Town environment

## Key Features

- **Environment-aware file reading**: Automatically uses Val Town's `readFile` or Deno's native file reading
- **Hono for backend**: Fast, lightweight web framework
- **Alpine.js for frontend**: Minimal, reactive frontend framework
- **Tailwind CSS**: Utility-first styling
- **Menlo font**: Monospace typography throughout

## API Endpoints

- `GET /` - Serves the main HTML page
- `GET /api/health` - Health check endpoint

## Environment Detection

The app detects whether it's running on Val Town or locally:

```javascript
export default (typeof Deno !== "undefined" && Deno.env.get("valtown")) ? app.fetch : app;
```

## Adding New Features

### Adding Routes

Add new routes in `core/routes.js`:

```javascript
app.get('/api/myendpoint', (c) => {
  return c.json({ data: 'your data' });
});
```

### Adding Utilities

Add reusable functions in `core/utils.js` or create new modules in `/core`.

### Backend Logic

Create new modules in `/backend` for complex backend logic.

