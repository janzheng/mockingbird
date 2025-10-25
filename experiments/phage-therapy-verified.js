import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from '../core/search/compound.js';

console.log("🔬 Searching for recent phage therapy papers with URL verification...\n");

/**
 * Verify if a URL is accessible
 */
async function verifyUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Extract URLs from text using regex
 */
function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Extract DOIs from text
 */
function extractDois(text) {
  const doiRegex = /10\.\d{4,9}\/[-._;()\/:A-Z0-9]+/gi;
  const matches = text.match(doiRegex) || [];
  return [...new Set(matches)];
}

try {
  // Step 1: Search with very specific instructions
  console.log("📡 Step 1: Searching for papers with source links...\n");
  
  const searchQuery = `Find phage therapy research papers published in the last 30 days.
Today's date is: ${new Date().toISOString().split('T')[0]}

Search these sources:
- PubMed: https://pubmed.ncbi.nlm.nih.gov
- Europe PMC: https://europepmc.org
- bioRxiv: https://biorxiv.org
- medRxiv: https://medrxiv.org

For each paper you find, include:
1. The full URL to the paper
2. The DOI if available
3. The title, authors, and journal
4. Publication date

IMPORTANT: Only list papers you can actually find with real URLs. Include the URLs in your response.`;

  const searchResult = await searchWithCompound(searchQuery, {
    system: `You are a research assistant. Find actual papers and include their URLs. 
Do not make up papers. If you can't find many recent papers, say so.`,
    temperature: 0.1,
    max_tokens: 4096,
    search_settings: {
      include_domains: [
        "pubmed.ncbi.nlm.nih.gov",
        "europepmc.org",
        "biorxiv.org",
        "medrxiv.org",
        "nature.com",
        "science.org",
        "thelancet.com",
        "mdpi.com",
        "asm.org"
      ]
    }
  });
  
  const searchResults = searchResult.choices[0]?.message?.content;
  console.log("📄 INITIAL SEARCH RESULTS:");
  console.log("=".repeat(80));
  console.log(searchResults);
  console.log("=".repeat(80));
  
  // Step 2: Extract and verify URLs
  console.log("\n🔍 Step 2: Extracting and verifying URLs...\n");
  
  const urls = extractUrls(searchResults);
  const dois = extractDois(searchResults);
  
  console.log(`Found ${urls.length} URLs and ${dois.length} DOIs in results`);
  
  if (urls.length > 0) {
    console.log("\n⏳ Verifying URLs (this may take a moment)...");
    
    const verificationResults = await Promise.all(
      urls.map(async (url) => {
        const isValid = await verifyUrl(url);
        return { url, isValid };
      })
    );
    
    const validUrls = verificationResults.filter(r => r.isValid);
    const invalidUrls = verificationResults.filter(r => !r.isValid);
    
    console.log(`\n✅ Valid URLs: ${validUrls.length}`);
    validUrls.forEach(r => console.log(`   - ${r.url}`));
    
    if (invalidUrls.length > 0) {
      console.log(`\n❌ Invalid/Inaccessible URLs: ${invalidUrls.length}`);
      invalidUrls.forEach(r => console.log(`   - ${r.url}`));
    }
  }
  
  if (dois.length > 0) {
    console.log(`\n📚 DOIs found: ${dois.length}`);
    dois.forEach(doi => {
      console.log(`   - ${doi}`);
      console.log(`     https://doi.org/${doi}`);
    });
  }
  
  // Step 3: Create a verified summary
  console.log("\n📊 Step 3: Creating verified summary...\n");
  
  const summaryQuery = `Based on these search results, create a summary of phage therapy papers found:

${searchResults}

Format as a numbered list. For each paper:
- Include the URL if you mentioned it
- Mark papers without verifiable URLs as [NEEDS VERIFICATION]
- Be honest about the limitations of the search

Verified URLs:
${urls.join('\n')}`;

  const summaryResult = await searchWithCompound(summaryQuery, {
    system: `Create a clear summary. Be honest about what was actually found vs what might need verification.`,
    temperature: 0.1,
    max_tokens: 2048,
  });
  
  console.log("📋 VERIFIED SUMMARY:");
  console.log("=".repeat(80));
  console.log(summaryResult.choices[0]?.message?.content);
  console.log("=".repeat(80));
  
  // Display statistics
  console.log("\n📊 STATISTICS:");
  console.log(`Total URLs found: ${urls.length}`);
  console.log(`Total DOIs found: ${dois.length}`);
  console.log(`Tokens used: ${searchResult.usage?.total_tokens + summaryResult.usage?.total_tokens || 'N/A'}`);
  
  // Recommendations
  console.log("\n💡 NEXT STEPS:");
  console.log("  1. Visit the verified URLs to confirm paper details");
  console.log("  2. Search PubMed directly with: phage therapy AND (\"2025/09\"[PDat] : \"2025/10\"[PDat])");
  console.log("  3. Check bioRxiv: https://biorxiv.org/search/phage%20therapy");
  console.log("  4. Papers without verified URLs should be manually checked");
  
  console.log("\n✅ Search completed!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

