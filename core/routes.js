import { readFileContent } from './utils.js';

// Setup routes for the Hono app
export function setupRoutes(app) {
  // Serve root with HTML content
  app.get('/', async (c) => {
    try {
      const htmlContent = await readFileContent('./frontend/index.html');
      return c.html(htmlContent);
    } catch (error) {
      console.error('Error reading HTML file:', error);
      return c.text('Error loading page', 500);
    }
  });

  // Health check endpoint
  app.get('/api/health', (c) => {
    return c.json({ status: 'ok', message: 'Hello from Mockingbird!' });
  });

  // Unwrap Hono errors to see original error details
  app.onError((err, c) => {
    throw err;
  });
}

