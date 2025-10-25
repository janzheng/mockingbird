import "jsr:@std/dotenv/load";
import { searchTavilyAdvanced } from './tavily.js';

// Get query from command line arguments
const query = Deno.args.join(' ');

if (!query) {
  console.error("❌ No query provided!");
  console.log("\nUsage: deno task search:tavily \"your search query here\"");
  console.log("\nExamples:");
  console.log('  deno task search:tavily "Who is Leo Messi?"');
  console.log('  deno task search:tavily "Latest AI developments"');
  console.log('  deno task search:tavily "Best restaurants in Tokyo"');
  Deno.exit(1);
}

console.log(`🔍 Searching: "${query}"\n`);

try {
  const result = await searchTavilyAdvanced(query, {
    includeAnswer: true,
    maxResults: 5,
  });
  
  // Show AI answer if available
  if (result.answer) {
    console.log("💡 Answer:\n");
    console.log(result.answer);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
  
  // Show search results
  if (result.results && result.results.length > 0) {
    console.log("📚 Sources:\n");
    result.results.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   ${item.url}`);
      if (item.content) {
        console.log(`   ${item.content.substring(0, 150)}...`);
      }
      console.log("");
    });
  }

  if(Array.isArray(result)) {
    console.log("📚 Results list:\n");
    console.log(JSON.stringify(result, null, 2));
  }
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

