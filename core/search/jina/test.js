import "jsr:@std/dotenv/load";
import { searchWithJina } from './jina.js';

// Get query from command line arguments
const query = Deno.args.join(' ');

if (!query) {
  console.error("❌ No query provided!");
  console.log("\nUsage: deno task search:jina \"your search query\"");
  console.log("\nExamples:");
  console.log('  deno task search:jina "latest AI developments"');
  console.log('  deno task search:jina "best restaurants in Tokyo"');
  console.log('  deno task search:jina "current events in technology"');
  Deno.exit(1);
}

console.log(`🔍 Searching: "${query}"\n`);

try {
  const result = await searchWithJina(query);
  
  console.log(`✅ Found ${result.data?.length || 0} results:\n`);
  
  if (result.data && result.data.length > 0) {
    result.data.forEach((item, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`\n${index + 1}. ${item.title || 'No title'}\n`);
      console.log(`   🔗 ${item.url || 'No URL'}`);
      
      if (item.content) {
        console.log(`\n   📄 Content Preview:\n`);
        console.log(`   ${item.content.substring(0, 300)}...`);
      }
      console.log("");
    });
  }
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log("✅ Done!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

