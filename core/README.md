# Core Modules

This directory contains the core functionality for the Mockingbird app.

## Files

### `utils.js`
Core utility functions:
- `readFileContent(filePath)` - Environment-aware file reading (Val Town vs local Deno)
- `generateId()` - Generate unique IDs
- `nowTs()` - Get current timestamp

### `routes.js`
Route setup for the Hono app:
- Defines all HTTP endpoints
- Handles error unwrapping
- Serves static files and API endpoints

## Usage

Import utilities and routes in your `main.js`:

```javascript
import { setupRoutes } from './core/routes.js';
import { readFileContent, generateId } from './core/utils.js';
```

## Adding New Core Modules

Create new modules in this directory for shared functionality:

```javascript
// core/auth.js
export function checkAuth(token) {
  // authentication logic
}
```

Then import where needed:

```javascript
import { checkAuth } from './core/auth.js';
```

