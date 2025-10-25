import "jsr:@std/dotenv/load";
import { searchAndContents } from './exa-search.js';

// Get query from command line arguments
const query = Deno.args.join(' ');

if (!query) {
  console.error("❌ No query provided!");
  console.log("\nUsage: deno task search:exa-search \"your search query here\"");
  console.log("\nExamples:");
  console.log('  deno task search:exa-search "Latest research in LLMs"');
  console.log('  deno task search:exa-search "Best practices for Deno"');
  console.log('  deno task search:exa-search "TypeScript design patterns"');
  Deno.exit(1);
}

console.log(`🔎 Searching: "${query}"\n`);

try {
  const result = await searchAndContents(query, {
    numResults: 5,
    text: true,
  });
  
  console.log(`✅ Found ${result.results.length} results\n`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // Show each result
  result.results.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   🔗 ${item.url}`);
    
    if (item.author) {
      console.log(`   👤 ${item.author}`);
    }
    
    if (item.publishedDate) {
      const date = new Date(item.publishedDate);
      console.log(`   📅 ${date.toLocaleDateString()}`);
    }
    
    if (item.text) {
      const preview = item.text.substring(0, 200).replace(/\n/g, ' ');
      console.log(`   📄 ${preview}...`);
    }
    
    console.log("");
  });
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Show cost if available
  if (result.costDollars) {
    console.log("\n💰 COST:");
    console.log(`   Total: $${result.costDollars.total.toFixed(4)}`);
    if (result.costDollars.breakDown) {
      const breakdown = result.costDollars.breakDown[0];
      if (breakdown) {
        console.log(`   Search: $${breakdown.search?.toFixed(4) || 0}`);
        console.log(`   Contents: $${breakdown.contents?.toFixed(4) || 0}`);
      }
    }
  }
  
  // Show search type used
  if (result.resolvedSearchType) {
    console.log(`\n🔍 Search type: ${result.resolvedSearchType}`);
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

