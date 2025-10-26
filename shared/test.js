/**
 * Test the unified search harness
 * Run with: deno run --allow-env --allow-net --allow-read --allow-write shared/test.js
 */

import "jsr:@std/dotenv/load";
import { search, searchNews, multiSearch, getAvailableProviders } from './search-harness.js';

console.log('=== Testing Mockingbird Search Harness ===\n');

// Test 1: Get available providers
console.log('1. Available providers:');
const providers = getAvailableProviders();
console.log(providers);
console.log('');

// Test 2: Simple search with Tavily
console.log('2. Testing Tavily search for "artificial intelligence"...');
try {
  const tavilyResult = await search({
    query: "artificial intelligence",
    provider: "tavily",
    maxResults: 3,
  });

  console.log(`Success: ${tavilyResult.success}`);
  console.log(`Provider: ${tavilyResult.provider}`);
  console.log(`Total results: ${tavilyResult.totalResults}`);
  
  if (tavilyResult.results.length > 0) {
    console.log('\nFirst result:');
    const first = tavilyResult.results[0];
    console.log(`  Title: ${first.title}`);
    console.log(`  URL: ${first.url}`);
    console.log(`  Snippet: ${first.snippet.substring(0, 100)}...`);
    console.log(`  Score: ${first.score}`);
    console.log(`  Source: ${first.source}`);
  }
} catch (error) {
  console.error('Error:', error.message);
}
console.log('\n---\n');

// Test 3: News search
console.log('3. Testing news search for "OpenAI"...');
try {
  const newsResult = await searchNews("OpenAI", { maxResults: 3 });

  console.log(`Success: ${newsResult.success}`);
  console.log(`Provider: ${newsResult.provider}`);
  console.log(`Total results: ${newsResult.totalResults}`);
  
  if (newsResult.results.length > 0) {
    console.log('\nNews results:');
    newsResult.results.forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.title}`);
      console.log(`     ${result.url}`);
      console.log(`     Published: ${result.publishedDate}`);
    });
  }
} catch (error) {
  console.error('Error:', error.message);
}
console.log('\n---\n');

// Test 4: Multi-provider search (if you have multiple API keys)
console.log('4. Testing multi-provider search...');
try {
  const multiResults = await multiSearch(
    {
      query: "quantum computing",
      maxResults: 2,
    },
    ["tavily"] // Add more providers if you have API keys
  );

  console.log(`Searched ${multiResults.length} providers:`);
  multiResults.forEach(result => {
    console.log(`\n  Provider: ${result.provider}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Results: ${result.totalResults}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
} catch (error) {
  console.error('Error:', error.message);
}
console.log('\n---\n');

// Test 5: Test with invalid provider
console.log('5. Testing error handling with invalid provider...');
try {
  const errorResult = await search({
    query: "test",
    provider: "nonexistent",
  });

  console.log(`Success: ${errorResult.success}`);
  console.log(`Error: ${errorResult.error}`);
} catch (error) {
  console.error('Unexpected error:', error.message);
}

console.log('\n=== Tests complete ===');

