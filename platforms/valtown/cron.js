/**
 * Val Town Cron Job Handler
 * 
 * This file should be deployed as a separate Cron val in Val Town.
 * It runs on a schedule and executes all active alerts.
 * 
 * To deploy in Val Town:
 * 1. Create a new Cron val
 * 2. Set the schedule (e.g., "0 * * * *" for every hour)
 * 3. Copy this code into the val
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { search } from '../../shared/search-harness.js';
import {
  getAlerts,
  saveAlert,
  saveAlertRun,
  getFeedItems,
  saveFeedItem,
  getFeeds,
} from './storage.js';

/**
 * Check if any new results exist
 * @param {SearchResult[]} newResults - New search results
 * @param {string} alertId - Alert ID
 * @returns {Promise<{isNew: boolean, newResultIds: string[]}>}
 */
async function checkForNewResults(newResults, alertId) {
  // Get existing feed items for this alert
  const feeds = await getFeeds();
  const feedsWithAlert = feeds.filter(f => f.alertIds.includes(alertId));
  
  const existingUrls = new Set();
  for (const feed of feedsWithAlert) {
    const items = await getFeedItems(feed.id);
    items.forEach(item => existingUrls.add(item.result.url));
  }

  // Filter new results
  const newResultIds = [];
  const uniqueNewResults = newResults.filter(result => {
    if (!existingUrls.has(result.url)) {
      newResultIds.push(result.id);
      return true;
    }
    return false;
  });

  return {
    isNew: uniqueNewResults.length > 0,
    newResultIds,
    newResults: uniqueNewResults,
  };
}

/**
 * Process a single alert
 * @param {Alert} alert - The alert to process
 */
async function processAlert(alert) {
  console.log(`Processing alert: ${alert.name} (${alert.id})`);

  try {
    // Execute the search
    const searchResponse = await search({
      query: alert.query,
      provider: alert.provider,
      ...alert.searchOptions,
    });

    if (!searchResponse.success) {
      throw new Error(searchResponse.error);
    }

    // Check for new results
    const { isNew, newResultIds, newResults } = await checkForNewResults(
      searchResponse.results,
      alert.id
    );

    // Create alert run record
    const run = {
      id: crypto.randomUUID(),
      alertId: alert.id,
      timestamp: Date.now(),
      success: true,
      searchResponse,
      newResults: newResults.length,
      newResultIds,
    };

    await saveAlertRun(run);

    // If there are new results, add them to feeds
    if (isNew && newResults.length > 0) {
      console.log(`Found ${newResults.length} new results for alert: ${alert.name}`);
      
      const feeds = await getFeeds();
      const feedsWithAlert = feeds.filter(f => f.alertIds.includes(alert.id));

      for (const feed of feedsWithAlert) {
        for (const result of newResults) {
          const feedItem = {
            id: crypto.randomUUID(),
            feedId: feed.id,
            alertId: alert.id,
            result,
            timestamp: Date.now(),
            read: false,
            starred: false,
            tags: [],
          };
          await saveFeedItem(feedItem);
        }
      }

      // TODO: Send notifications if configured
      // if (alert.notificationChannels.length > 0) {
      //   await sendNotifications(alert, newResults);
      // }
    }

    // Update alert's lastRunAt
    alert.lastRunAt = Date.now();
    await saveAlert(alert);

    return {
      success: true,
      newResults: newResults.length,
    };

  } catch (error) {
    console.error(`Error processing alert ${alert.name}:`, error);

    // Save failed run
    const run = {
      id: crypto.randomUUID(),
      alertId: alert.id,
      timestamp: Date.now(),
      success: false,
      searchResponse: null,
      newResults: 0,
      newResultIds: [],
      error: error.message,
    };

    await saveAlertRun(run);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main cron function - executes all active alerts
 */
export default async function cronHandler() {
  console.log('Starting Mockingbird cron job...');

  try {
    // Get all active alerts
    const alerts = await getAlerts();
    const activeAlerts = alerts.filter(a => a.active);

    console.log(`Found ${activeAlerts.length} active alerts`);

    if (activeAlerts.length === 0) {
      console.log('No active alerts to process');
      return { success: true, processed: 0 };
    }

    // Process all alerts
    const results = await Promise.all(
      activeAlerts.map(alert => processAlert(alert))
    );

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalNewResults = results.reduce((sum, r) => sum + (r.newResults || 0), 0);

    console.log(`Cron job complete: ${successful} successful, ${failed} failed, ${totalNewResults} new results`);

    return {
      success: true,
      processed: activeAlerts.length,
      successful,
      failed,
      totalNewResults,
    };

  } catch (error) {
    console.error('Cron job error:', error);
    throw error;
  }
}

// For local testing
if (import.meta.main) {
  await cronHandler();
}

