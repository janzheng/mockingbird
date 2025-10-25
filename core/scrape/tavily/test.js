import "jsr:@std/dotenv/load";
import { extractWithTavily, extractSingleUrl, extractAdvanced, extractWithImages } from './tavily-extract.js';

// Get URL(s) from command line arguments
const args = Deno.args;

if (args.length === 0) {
  console.error("❌ No URL provided!");
  console.log("\nUsage: deno task search:tavily-extract <url> [url2] [url3] ...");
  console.log("\nExamples:");
  console.log('  deno task search:tavily-extract "https://en.wikipedia.org/wiki/Artificial_intelligence"');
  console.log('  deno task search:tavily-extract "https://example.com/page1" "https://example.com/page2"');
  console.log("\nOptions:");
  console.log('  Add --advanced for advanced extraction (more comprehensive)');
  console.log('  Add --images to include images in the results');
  console.log('  Add --text to extract as plain text instead of markdown');
  Deno.exit(1);
}

// Parse flags and URLs
const flags = args.filter(arg => arg.startsWith('--'));
const urls = args.filter(arg => !arg.startsWith('--'));

const hasAdvanced = flags.includes('--advanced');
const hasImages = flags.includes('--images');
const hasText = flags.includes('--text');

console.log(`🔍 Extracting content from ${urls.length} URL(s):\n`);
urls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
console.log("");

if (hasAdvanced) console.log("⚡ Using advanced extraction");
if (hasImages) console.log("🖼️  Including images");
if (hasText) console.log("📝 Extracting as plain text");
if (hasAdvanced || hasImages || hasText) console.log("");

try {
  let result;
  
  // Choose extraction method based on flags
  // Pass urls directly - the functions handle both single URLs and arrays
  if (hasAdvanced && hasImages) {
    result = await extractAdvanced(urls, {
      includeImages: true,
      includeFavicon: true,
    });
  } else if (hasAdvanced) {
    result = await extractAdvanced(urls);
  } else if (hasImages) {
    result = await extractWithImages(urls);
  } else {
    const options = {};
    if (hasText) options.format = "text";
    result = await extractWithTavily(urls, options);
  }
  
  
  // Show successful results
  if (result.results && result.results.length > 0) {
    console.log(`✅ Successfully extracted ${result.results.length} page(s):\n`);
    result.results.forEach((item, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`\n${index + 1}. ${item.url}\n`);
      
      if (item.favicon) {
        console.log(`   🔗 Favicon: ${item.favicon}`);
      }
      
      if (item.images && item.images.length > 0) {
        console.log(`   🖼️  Images (${item.images.length}):`);
        item.images.slice(0, 5).forEach((img, i) => {
          console.log(`      ${i + 1}. ${img}`);
        });
        if (item.images.length > 5) {
          console.log(`      ... and ${item.images.length - 5} more`);
        }
      }
      
      // Handle both rawContent (camelCase) and raw_content (snake_case)
      const content = item.rawContent || item.raw_content;
      if (content) {
        console.log(`\n   📄 Content Preview (first 500 chars):\n`);
        console.log(`   ${content.substring(0, 500)}...`);
      }
      console.log("");
    });
  }
  
  // Show failed results (handle both camelCase and snake_case)
  const failedResults = result.failedResults || result.failed_results;
  if (failedResults && failedResults.length > 0) {
    console.log(`\n❌ Failed to extract ${failedResults.length} page(s):\n`);
    failedResults.forEach((item, index) => {
      console.log(`${index + 1}. ${item.url}`);
      console.log(`   Error: ${item.error}\n`);
    });
  }
  
  // Show metadata (handle both camelCase and snake_case)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  const responseTime = result.responseTime || result.response_time;
  const requestId = result.requestId || result.request_id;
  console.log(`⏱️  Response time: ${responseTime}s`);
  console.log(`🆔 Request ID: ${requestId}\n`);
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

