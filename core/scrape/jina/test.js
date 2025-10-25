import "jsr:@std/dotenv/load";
import { readWithJina, readJinaJson, readJinaAdvanced } from './jina.js';

// Get URL from command line arguments
const args = Deno.args;

if (args.length === 0) {
  console.error("❌ No URL provided!");
  console.log("\nUsage: deno task scrape:jina <url>");
  console.log("\nExamples:");
  console.log('  deno task scrape:jina "https://en.wikipedia.org/wiki/Artificial_intelligence"');
  console.log('  deno task scrape:jina "https://example.com/article"');
  console.log("\nOptions:");
  console.log('  --json       Return JSON response');
  console.log('  --advanced   Use ReaderLM-v2 for better conversion (3x tokens)');
  console.log('  --images     Include image captions');
  console.log('  --links      Gather all links at the end');
  console.log('  --fresh      Bypass cache and fetch fresh content');
  Deno.exit(1);
}

// Parse flags and content
const flags = args.filter(arg => arg.startsWith('--'));
const content = args.filter(arg => !arg.startsWith('--'));

const useJson = flags.includes('--json');
const useAdvanced = flags.includes('--advanced');
const useImages = flags.includes('--images');
const useLinks = flags.includes('--links');
const useFresh = flags.includes('--fresh');

if (content.length === 0) {
  console.error("❌ No URL provided!");
  Deno.exit(1);
}

const url = content.join(' ');

// Read mode
console.log(`📖 Reading: ${url}\n`);

if (useAdvanced) console.log("⚡ Using ReaderLM-v2 (high-quality conversion)");
if (useImages) console.log("🖼️  Including image captions");
if (useLinks) console.log("🔗 Gathering links at the end");
if (useFresh) console.log("♻️  Bypassing cache");
if (useJson) console.log("📋 Returning JSON response");
if (useAdvanced || useImages || useLinks || useFresh || useJson) console.log("");

try {
  let result;
  
  // Build options
  const options = {};
  if (useImages) {
    options.imageCaption = true;
    options.gatherAllImages = "End";
  }
  if (useLinks) {
    options.gatherAllLinks = "End";
  }
  if (useFresh) {
    options.bypassCache = true;
  }
  
  // Choose read method
  if (useJson) {
    result = await readJinaJson(url, options);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📋 JSON Response:\n");
    console.log(JSON.stringify(result, null, 2));
  } else if (useAdvanced) {
    result = await readJinaAdvanced(url, options);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📄 Content:\n");
    console.log(result);
  } else {
    result = await readWithJina(url, options);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📄 Content:\n");
    console.log(result);
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ Done!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}


