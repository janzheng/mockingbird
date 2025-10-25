import "jsr:@std/dotenv/load";
import { researchAndWait } from './exa-research.js';

// Get query from command line arguments
const instructions = Deno.args.join(' ');

if (!instructions) {
  console.error("❌ No research instructions provided!");
  console.log("\nUsage: deno task search:exa \"your research instructions here\"");
  console.log("\nExamples:");
  console.log('  deno task search:exa "What species of ant are similar to honeypot ants?"');
  console.log('  deno task search:exa "Latest developments in quantum computing"');
  console.log('  deno task search:exa "Compare the top 5 JavaScript frameworks"');
  Deno.exit(1);
}

console.log(`🔬 Researching: "${instructions}"\n`);

try {
  const result = await researchAndWait(instructions, {
    onProgress: (status) => {
      if (status.status === "created") {
        console.log(`📋 Research ID: ${status.researchId}`);
      } else if (status.status === "running") {
        console.log("⏳ Research in progress...");
      }
    }
  });
  
  console.log("✅ Research completed!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // Show the research output
  if (result.output?.content) {
    console.log(result.output.content);
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Show cost information
  if (result.costDollars) {
    console.log("\n💰 COST:");
    console.log(`   Total: $${result.costDollars.total.toFixed(4)}`);
    console.log(`   Searches: ${result.costDollars.numSearches}`);
    console.log(`   Pages crawled: ${result.costDollars.numPages}`);
    console.log(`   Reasoning tokens: ${result.costDollars.reasoningTokens.toLocaleString()}`);
  }
  
  // Show timing information
  if (result.createdAt && result.finishedAt) {
    const duration = ((result.finishedAt - result.createdAt) / 1000).toFixed(1);
    console.log(`\n⏱️  Duration: ${duration}s`);
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

