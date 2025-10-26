/**
 * Val Town Storage Adapters
 * 
 * Provides unified storage interface that works in both Val Town and local development
 * Uses Val Town's Blob storage and SQLite when in Val Town environment
 * Falls back to local file storage when developing locally
 */

const isValTown = typeof Deno !== "undefined" && Deno.env.get("valtown");

// Val Town storage imports (only loaded in Val Town environment)
let blob, sqlite;
if (isValTown) {
  const { blob: blobImport } = await import("https://esm.town/v/std/blob");
  const { sqlite: sqliteImport } = await import("https://esm.town/v/stevekrouse/sqlite");
  blob = blobImport;
  sqlite = sqliteImport;
}

// ==================== FILE READING ====================

/**
 * Read file content - environment aware
 */
export async function readFileContent(filePath) {
  if (isValTown) {
    const { readFile } = await import("https://esm.town/v/std/utils/index.ts");
    return await readFile(filePath, import.meta.url);
  } else {
    return await Deno.readTextFile(filePath);
  }
}

// ==================== BLOB STORAGE ====================

const BLOB_PREFIX = {
  alerts: 'mockingbird:alerts:',
  feeds: 'mockingbird:feeds:',
  runs: 'mockingbird:runs:',
  feedItems: 'mockingbird:feeditems:',
};

/**
 * Get from blob storage
 */
async function blobGet(key) {
  if (isValTown) {
    return await blob.getJSON(key);
  } else {
    // Local development: use file system
    try {
      const content = await Deno.readTextFile(`./.mockingbird-data/${key}.json`);
      return JSON.parse(content);
    } catch (_error) {
      return null;
    }
  }
}

/**
 * Set to blob storage
 */
async function blobSet(key, value) {
  if (isValTown) {
    await blob.setJSON(key, value);
  } else {
    // Local development: use file system
    await Deno.mkdir('./.mockingbird-data', { recursive: true });
    await Deno.writeTextFile(
      `./.mockingbird-data/${key}.json`,
      JSON.stringify(value, null, 2)
    );
  }
}

/**
 * List keys from blob storage
 */
async function blobList(prefix) {
  if (isValTown) {
    return await blob.list(prefix);
  } else {
    // Local development: list files
    try {
      const entries = [];
      for await (const entry of Deno.readDir('./.mockingbird-data')) {
        if (entry.isFile && entry.name.startsWith(prefix) && entry.name.endsWith('.json')) {
          entries.push(entry.name.replace('.json', ''));
        }
      }
      return entries;
    } catch (_error) {
      return [];
    }
  }
}

/**
 * Delete from blob storage
 */
async function blobDelete(key) {
  if (isValTown) {
    await blob.delete(key);
  } else {
    // Local development: delete file
    try {
      await Deno.remove(`./.mockingbird-data/${key}.json`);
    } catch (_error) {
      // Ignore if file doesn't exist
    }
  }
}

// ==================== ALERTS ====================

/**
 * Get all alerts
 * @returns {Promise<Alert[]>}
 */
export async function getAlerts() {
  const keys = await blobList(BLOB_PREFIX.alerts);
  const alerts = await Promise.all(
    keys.map(key => blobGet(key))
  );
  return alerts.filter(Boolean);
}

/**
 * Get a specific alert
 * @param {string} id - Alert ID
 * @returns {Promise<Alert|null>}
 */
export async function getAlert(id) {
  return await blobGet(`${BLOB_PREFIX.alerts}${id}`);
}

/**
 * Save an alert
 * @param {Alert} alert - Alert object
 */
export async function saveAlert(alert) {
  await blobSet(`${BLOB_PREFIX.alerts}${alert.id}`, alert);
}

/**
 * Delete an alert
 * @param {string} id - Alert ID
 */
export async function deleteAlert(id) {
  await blobDelete(`${BLOB_PREFIX.alerts}${id}`);
}

// ==================== FEEDS ====================

/**
 * Get all feeds
 * @returns {Promise<Feed[]>}
 */
export async function getFeeds() {
  const keys = await blobList(BLOB_PREFIX.feeds);
  const feeds = await Promise.all(
    keys.map(key => blobGet(key))
  );
  return feeds.filter(Boolean);
}

/**
 * Get a specific feed
 * @param {string} id - Feed ID
 * @returns {Promise<Feed|null>}
 */
export async function getFeed(id) {
  return await blobGet(`${BLOB_PREFIX.feeds}${id}`);
}

/**
 * Save a feed
 * @param {Feed} feed - Feed object
 */
export async function saveFeed(feed) {
  await blobSet(`${BLOB_PREFIX.feeds}${feed.id}`, feed);
}

/**
 * Delete a feed
 * @param {string} id - Feed ID
 */
export async function deleteFeed(id) {
  await blobDelete(`${BLOB_PREFIX.feeds}${id}`);
}

// ==================== ALERT RUNS ====================

/**
 * Get runs for an alert
 * @param {string} alertId - Alert ID
 * @returns {Promise<AlertRun[]>}
 */
export async function getAlertRuns(alertId) {
  const keys = await blobList(`${BLOB_PREFIX.runs}${alertId}:`);
  const runs = await Promise.all(
    keys.map(key => blobGet(key))
  );
  return runs.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Save an alert run
 * @param {AlertRun} run - Alert run object
 */
export async function saveAlertRun(run) {
  await blobSet(`${BLOB_PREFIX.runs}${run.alertId}:${run.id}`, run);
}

// ==================== FEED ITEMS ====================

/**
 * Get items for a feed
 * @param {string} feedId - Feed ID
 * @param {Object} options - Query options
 * @returns {Promise<FeedItem[]>}
 */
export async function getFeedItems(feedId, options = {}) {
  const keys = await blobList(`${BLOB_PREFIX.feedItems}${feedId}:`);
  let items = await Promise.all(
    keys.map(key => blobGet(key))
  );
  items = items.filter(Boolean);

  // Filter options
  if (options.unreadOnly) {
    items = items.filter(item => !item.read);
  }
  if (options.starredOnly) {
    items = items.filter(item => item.starred);
  }

  // Sort by timestamp descending
  items.sort((a, b) => b.timestamp - a.timestamp);

  // Limit
  if (options.limit) {
    items = items.slice(0, options.limit);
  }

  return items;
}

/**
 * Save a feed item
 * @param {FeedItem} item - Feed item object
 */
export async function saveFeedItem(item) {
  await blobSet(`${BLOB_PREFIX.feedItems}${item.feedId}:${item.id}`, item);
}

/**
 * Update a feed item (for marking as read, starred, etc.)
 * @param {string} feedId - Feed ID
 * @param {string} itemId - Item ID
 * @param {Partial<FeedItem>} updates - Properties to update
 */
export async function updateFeedItem(feedId, itemId, updates) {
  const key = `${BLOB_PREFIX.feedItems}${feedId}:${itemId}`;
  const item = await blobGet(key);
  if (item) {
    await blobSet(key, { ...item, ...updates });
  }
}

/**
 * Delete a feed item
 * @param {string} feedId - Feed ID
 * @param {string} itemId - Item ID
 */
export async function deleteFeedItem(feedId, itemId) {
  await blobDelete(`${BLOB_PREFIX.feedItems}${feedId}:${itemId}`);
}

// ==================== SQLITE (for structured queries if needed) ====================

/**
 * Initialize SQLite tables (call this on startup if using SQLite)
 */
export async function initDatabase() {
  if (!isValTown || !sqlite) return;

  // Create tables for structured queries
  // For now, we're using Blob storage, but this is here for future use
  
  // Example: Alert runs table for efficient querying
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS alert_runs (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      success INTEGER NOT NULL,
      new_results INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await sqlite.execute(`
    CREATE INDEX IF NOT EXISTS idx_alert_runs_alert_id 
    ON alert_runs(alert_id, timestamp DESC)
  `);
}

