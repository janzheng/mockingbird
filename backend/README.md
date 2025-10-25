# Backend Modules

This directory is for backend-specific logic and business logic.

## Structure

Organize your backend code by feature:

```
backend/
├── api/           # API-specific logic
├── services/      # Business logic services
└── models/        # Data models
```

## Example

```javascript
// backend/services/greetings.js
export function getGreeting(name) {
  return `Hello, ${name}!`;
}
```

Import in routes:

```javascript
// core/routes.js
import { getGreeting } from '../backend/services/greetings.js';

app.get('/api/greet/:name', (c) => {
  const name = c.req.param('name');
  return c.json({ message: getGreeting(name) });
});
```

