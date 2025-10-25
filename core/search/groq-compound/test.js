import "jsr:@std/dotenv/load";
import { searchWithCompound } from './compound.js';

// Get query from command line arguments
const query = Deno.args.join(' ');

if (!query) {
  console.error("❌ No query provided!");
  console.log("\nUsage: deno task search \"your search query here\"");
  console.log("\nExamples:");
  console.log('  deno task search "What is the weather in San Francisco?"');
  console.log('  deno task search "Latest news about AI"');
  console.log('  deno task search "Write a haiku about coding"');
  Deno.exit(1);
}

console.log(`🔍 Searching: "${query}"\n`);

try {
  const result = await searchWithCompound(query);
  
  console.log(result.choices[0]?.message?.content);
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

