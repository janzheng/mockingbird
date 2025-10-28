import "jsr:@std/dotenv/load";
import { searchLinkedInPosts } from "./exa-search.js";

console.log("🔍 Testing LinkedIn Post Search with Exa...\n");

// Test 1: Basic LinkedIn post search
console.log("Test 1: Basic search for phage therapy posts");
console.log("=".repeat(60));

try {
  const result = await searchLinkedInPosts("phage therapy clinical trials", {
    numResults: 5,
    text: true,
    highlights: {
      numSentences: 2,
      highlightsPerUrl: 2
    }
  });

  console.log(`Found ${result.results.length} LinkedIn posts`);
  console.log(`Cost: $${result.costDollars?.total?.toFixed(4) || 'N/A'}\n`);

  result.results.forEach((post, i) => {
    console.log(`\n${i + 1}. ${post.title}`);
    console.log(`   URL: ${post.url}`);
    console.log(`   Author: ${post.author || 'N/A'}`);
    console.log(`   Published: ${post.publishedDate || 'N/A'}`);
    
    if (post.highlights && post.highlights.length > 0) {
      console.log(`   Highlights:`);
      post.highlights.forEach(h => console.log(`   - ${h}`));
    }
  });

} catch (error) {
  console.error("❌ Error:", error.message);
}

// Test 2: Search with date filter
console.log("\n\n" + "=".repeat(60));
console.log("Test 2: Recent posts (last 30 days)");
console.log("=".repeat(60));

try {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await searchLinkedInPosts("biotech innovation", {
    numResults: 5,
    startPublishedDate: thirtyDaysAgo.toISOString(),
    text: false // Just get metadata, no full text
  });

  console.log(`Found ${result.results.length} recent LinkedIn posts`);
  
  result.results.forEach((post, i) => {
    console.log(`\n${i + 1}. ${post.title}`);
    console.log(`   URL: ${post.url}`);
    console.log(`   Published: ${post.publishedDate || 'N/A'}`);
  });

} catch (error) {
  console.error("❌ Error:", error.message);
}

// Test 3: Keyword search (exact matching)
console.log("\n\n" + "=".repeat(60));
console.log("Test 3: Keyword search for specific terms");
console.log("=".repeat(60));

try {
  const result = await searchLinkedInPosts("CRISPR gene editing breakthrough", {
    type: "keyword", // Use keyword search instead of neural
    numResults: 3,
    text: true
  });

  console.log(`Found ${result.results.length} LinkedIn posts (keyword search)`);
  
  result.results.forEach((post, i) => {
    console.log(`\n${i + 1}. ${post.title}`);
    console.log(`   URL: ${post.url}`);
    if (post.text) {
      console.log(`   Preview: ${post.text.substring(0, 200)}...`);
    }
  });

} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("\n\n✅ LinkedIn post search tests complete!");

