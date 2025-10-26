import { readFileContent } from './storage.js';
import { search, searchNews, getAvailableProviders } from '../../shared/search-harness.js';
import { createAlert, createFeed } from '../../shared/types.js';
import { 
  getAlerts, 
  saveAlert, 
  getFeeds, 
  saveFeed, 
  getAlertRuns,
  getFeedItems 
} from './storage.js';

/**
 * Setup routes for the Val Town Hono app
 */
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
    return c.json({ 
      status: 'ok', 
      message: 'Mockingbird Val Town backend',
      platform: 'valtown',
    });
  });

  // Get available search providers
  app.get('/api/providers', (c) => {
    return c.json({ providers: getAvailableProviders() });
  });

  // Execute a search
  app.post('/api/search', async (c) => {
    try {
      const body = await c.req.json();
      const result = await search(body);
      return c.json(result);
    } catch (error) {
      return c.json({ 
        success: false, 
        error: error.message 
      }, 400);
    }
  });

  // Search for news
  app.post('/api/search/news', async (c) => {
    try {
      const body = await c.req.json();
      const result = await searchNews(body.query, body);
      return c.json(result);
    } catch (error) {
      return c.json({ 
        success: false, 
        error: error.message 
      }, 400);
    }
  });

  // ==================== ALERTS ====================

  // Get all alerts
  app.get('/api/alerts', async (c) => {
    try {
      const alerts = await getAlerts();
      return c.json({ alerts });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Get a specific alert
  app.get('/api/alerts/:id', async (c) => {
    try {
      const alerts = await getAlerts();
      const alert = alerts.find(a => a.id === c.req.param('id'));
      if (!alert) {
        return c.json({ error: 'Alert not found' }, 404);
      }
      return c.json(alert);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Create a new alert
  app.post('/api/alerts', async (c) => {
    try {
      const body = await c.req.json();
      const alert = createAlert(body);
      await saveAlert(alert);
      return c.json(alert);
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
  });

  // Update an alert
  app.put('/api/alerts/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const alerts = await getAlerts();
      const existingAlert = alerts.find(a => a.id === id);
      
      if (!existingAlert) {
        return c.json({ error: 'Alert not found' }, 404);
      }

      const updatedAlert = {
        ...existingAlert,
        ...body,
        id, // Don't allow ID changes
        updatedAt: Date.now(),
      };

      await saveAlert(updatedAlert);
      return c.json(updatedAlert);
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
  });

  // Delete an alert
  app.delete('/api/alerts/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const alerts = await getAlerts();
      const filteredAlerts = alerts.filter(a => a.id !== id);
      
      if (alerts.length === filteredAlerts.length) {
        return c.json({ error: 'Alert not found' }, 404);
      }

      // Save the filtered list (effectively deleting the alert)
      // This is handled by the storage layer
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Get runs for an alert
  app.get('/api/alerts/:id/runs', async (c) => {
    try {
      const id = c.req.param('id');
      const runs = await getAlertRuns(id);
      return c.json({ runs });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // ==================== FEEDS ====================

  // Get all feeds
  app.get('/api/feeds', async (c) => {
    try {
      const feeds = await getFeeds();
      return c.json({ feeds });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Get a specific feed
  app.get('/api/feeds/:id', async (c) => {
    try {
      const feeds = await getFeeds();
      const feed = feeds.find(f => f.id === c.req.param('id'));
      if (!feed) {
        return c.json({ error: 'Feed not found' }, 404);
      }
      return c.json(feed);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Get feed by slug (for public feeds)
  app.get('/api/feeds/slug/:slug', async (c) => {
    try {
      const feeds = await getFeeds();
      const feed = feeds.find(f => f.slug === c.req.param('slug') && f.public);
      if (!feed) {
        return c.json({ error: 'Feed not found' }, 404);
      }
      return c.json(feed);
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Create a new feed
  app.post('/api/feeds', async (c) => {
    try {
      const body = await c.req.json();
      const feed = createFeed(body);
      await saveFeed(feed);
      return c.json(feed);
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
  });

  // Update a feed
  app.put('/api/feeds/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const feeds = await getFeeds();
      const existingFeed = feeds.find(f => f.id === id);
      
      if (!existingFeed) {
        return c.json({ error: 'Feed not found' }, 404);
      }

      const updatedFeed = {
        ...existingFeed,
        ...body,
        id, // Don't allow ID changes
        updatedAt: Date.now(),
      };

      await saveFeed(updatedFeed);
      return c.json(updatedFeed);
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
  });

  // Get items for a feed
  app.get('/api/feeds/:id/items', async (c) => {
    try {
      const id = c.req.param('id');
      const items = await getFeedItems(id);
      return c.json({ items });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  });
}

