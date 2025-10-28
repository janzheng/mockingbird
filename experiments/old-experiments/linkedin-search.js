import "jsr:@std/dotenv/load";
import { searchLinkedInPosts } from "../../core/search/index.js";

/**
 * LinkedIn Post Search Experiment
 * 
 * Searches LinkedIn for posts on a given topic and returns clean metadata:
 * - Post title
 * - Author
 * - Published date
 * - URL
 * 
 * Usage:
 *   deno run --allow-env --allow-net --allow-read ./experiments/linkedin-search.js "your query"
 */

const query = Deno.args[0] || "phage therapy research";
const numResults = parseInt(Deno.args[1]) || 15;

// Parse flags
const args = Deno.args;
const hasRecentFlag = args.includes("--recent");
const daysArg = args.find(arg => arg.startsWith("--days="));
const daysBack = daysArg ? parseInt(daysArg.split("=")[1]) : (hasRecentFlag ? 7 : null);

console.log("🔍 LinkedIn Post Search");
console.log("=".repeat(80));
console.log(`Query: "${query}"`);
console.log(`Max Results: ${numResults}`);
if (daysBack) {
  console.log(`📅 Date Filter: Last ${daysBack} days`);
}
console.log("=".repeat(80));
console.log();

try {
  const searchOptions = {
    numResults,
    text: false, // Don't need full text, just metadata
  };

  // Add date filter if specified
  if (daysBack) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);
    searchOptions.startPublishedDate = dateThreshold.toISOString();
  }

  const result = await searchLinkedInPosts(query, searchOptions);

  console.log(`✅ Found ${result.results.length} LinkedIn posts`);
  console.log(`💰 Cost: $${result.costDollars?.total?.toFixed(4) || 'N/A'}`);
  
  // Check average relevance score
  const scores = result.results
    .filter(r => r.score !== undefined)
    .map(r => r.score);
  
  if (scores.length > 0) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Warn if results seem off-topic
    if (avgScore < 0.30 && daysBack) {
      console.log();
      console.log("⚠️  WARNING: Low relevance scores detected!");
      console.log(`   Average relevance: ${(avgScore * 100).toFixed(1)}%`);
      console.log(`   This suggests there may not be many posts about "${query}" in the last ${daysBack} days.`);
      console.log(`   Try: Removing --recent flag or using --days=30 for a longer time range.`);
    }
  }
  
  console.log();
  console.log("=".repeat(80));
  console.log();

  // Format and display results
  result.results.forEach((post, index) => {
    // Add warning emoji for low relevance posts
    const relevanceWarning = (post.score !== undefined && post.score < 0.25) ? "⚠️  " : "";
    
    console.log(`${index + 1}. ${relevanceWarning}${post.title}`);
    console.log(`   👤 Author: ${post.author || "Unknown"}`);
    console.log(`   📅 Published: ${formatDate(post.publishedDate)}`);
    console.log(`   🔗 URL: ${post.url}`);
    
    // Show score if available with color coding
    if (post.score !== undefined) {
      const scorePercent = (post.score * 100).toFixed(1);
      const scoreEmoji = post.score >= 0.35 ? "⭐" : (post.score >= 0.25 ? "🔸" : "⚠️ ");
      console.log(`   ${scoreEmoji} Relevance: ${scorePercent}%`);
    }
    
    console.log();
  });

  console.log("=".repeat(80));
  console.log();

  // Summary by author
  const authorCounts = {};
  result.results.forEach(post => {
    const author = post.author || "Unknown";
    authorCounts[author] = (authorCounts[author] || 0) + 1;
  });

  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topAuthors.length > 0) {
    console.log("📊 Top Authors:");
    topAuthors.forEach(([author, count]) => {
      console.log(`   ${author}: ${count} post${count > 1 ? 's' : ''}`);
    });
    console.log();
  }

  // Recent activity
  const validDates = result.results
    .filter(post => post.publishedDate && post.publishedDate !== "1970-01-01T00:00:00.000Z")
    .map(post => new Date(post.publishedDate))
    .sort((a, b) => b - a);

  if (validDates.length > 0) {
    const mostRecent = validDates[0];
    const oldest = validDates[validDates.length - 1];
    
    console.log("📅 Date Range:");
    console.log(`   Most Recent: ${formatDate(mostRecent.toISOString())}`);
    console.log(`   Oldest: ${formatDate(oldest.toISOString())}`);
    console.log();
  }

  // Export as JSON option
  if (Deno.args.includes("--json")) {
    const exportData = result.results.map(post => ({
      title: post.title,
      author: post.author,
      publishedDate: post.publishedDate,
      url: post.url,
      score: post.score,
    }));

    const filename = `linkedin-${query.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    await Deno.writeTextFile(filename, JSON.stringify(exportData, null, 2));
    console.log(`💾 Exported to ${filename}`);
    console.log();
  }

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error();
  console.error("Stack trace:", error.stack);
  Deno.exit(1);
}

/**
 * Format date string for display
 */
function formatDate(dateString) {
  if (!dateString || dateString === "1970-01-01T00:00:00.000Z") {
    return "Date unknown";
  }

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  } catch (e) {
    return dateString;
  }
}

console.log("✨ LinkedIn search complete!");
console.log();
console.log("💡 Tips:");
console.log("   - Add --json flag to export results to JSON file");
console.log("   - Add --recent flag to search last 7 days only");
console.log("   - Add --days=N to search last N days (e.g., --days=30)");
console.log("   - Change query: deno task ex:linkedin \"your query here\"");
console.log("   - Change result count: deno task ex:linkedin \"query\" 25");
console.log();
console.log("Examples:");
console.log("   deno task ex:linkedin \"biotech\" --recent");
console.log("   deno task ex:linkedin \"CRISPR\" --days=30");
console.log("   deno task ex:linkedin \"phage therapy\" 25 --recent --json");
console.log();

