import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from '../core/search/compound.js';

console.log("🔬 Searching for recent phage therapy research papers (improved)...\n");

// Step 1: Search with domain restrictions and get raw results
const searchSystemPrompt = `You are a research assistant tasked with finding recent academic papers.
Your job is to search for phage therapy papers published in the last 30 days and return ONLY information that you find in actual search results.
Do NOT make up or infer information. If you cannot find specific papers, say so explicitly.
Focus on finding actual URLs, DOIs, and publication metadata from real sources.`;

const searchQuery = `Search for phage therapy (bacteriophage therapy) research papers published in the last 30 days.
Current date: ${new Date().toISOString().split('T')[0]}

Look for papers in:
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature journals (nature.com)
- Science journals (science.org, sciencemag.org)
- The Lancet (thelancet.com)
- mBio (mbio.asm.org)
- Viruses journal (mdpi.com/journal/viruses)
- Antibiotics journal (mdpi.com/journal/antibiotics)
- bioRxiv/medRxiv preprints (biorxiv.org, medrxiv.org)

Include the actual URLs and DOIs you find. List each paper you discover with its source link.`;

try {
  console.log("📡 Step 1: Searching academic databases...\n");
  
  const searchResult = await searchWithCompound(searchQuery, {
    system: searchSystemPrompt,
    temperature: 0.1, // Very low temperature for factual retrieval
    max_tokens: 4096,
    search_settings: {
      include_domains: [
        "pubmed.ncbi.nlm.nih.gov",
        "nature.com",
        "science.org",
        "sciencemag.org",
        "thelancet.com",
        "mbio.asm.org",
        "asm.org",
        "mdpi.com",
        "biorxiv.org",
        "medrxiv.org",
        "*.edu",
        "scholar.google.com",
        "europepmc.org"
      ]
    }
  });
  
  const initialResults = searchResult.choices[0]?.message?.content;
  
  console.log("📄 RAW SEARCH RESULTS:");
  console.log("=".repeat(80));
  console.log(initialResults);
  console.log("=".repeat(80));
  
  // Check for tool calls to see what sources were actually accessed
  if (searchResult.choices[0]?.message?.tool_calls) {
    console.log("\n🔧 TOOLS USED IN SEARCH:");
    searchResult.choices[0].message.tool_calls.forEach((tool, i) => {
      console.log(`\n  ${i + 1}. ${tool.function?.name || tool.type}`);
      if (tool.function?.arguments) {
        try {
          const args = JSON.parse(tool.function.arguments);
          console.log(`     Query: ${args.query || args.url || 'N/A'}`);
        } catch (e) {
          // If we can't parse, skip
        }
      }
    });
  }
  
  // Step 2: Format the results with strict citation requirements
  console.log("\n\n📊 Step 2: Formatting and validating results...\n");
  
  const formattingSystemPrompt = `You are a meticulous academic research assistant.
Format the search results provided into a structured list of papers.
CRITICAL RULES:
1. ONLY include papers that have URLs or DOIs in the search results
2. Do NOT add any papers that weren't in the search results
3. If a paper lacks a verifiable URL/DOI, mark it as "[UNVERIFIED]"
4. If no recent papers were found, clearly state that
5. Group papers by source (PubMed, Nature, etc.)`;

  const formattingQuery = `Format these search results into a structured list:

${initialResults}

For each paper found, provide:
- Title
- Authors
- Journal
- Publication date
- **URL/DOI** (REQUIRED - if missing, mark as UNVERIFIED)
- Brief summary

If the search didn't find many recent papers, acknowledge this honestly.`;

  const formattedResult = await searchWithCompound(formattingQuery, {
    system: formattingSystemPrompt,
    temperature: 0.1,
    max_tokens: 4096,
  });
  
  const formattedContent = formattedResult.choices[0]?.message?.content;
  
  console.log("📋 FORMATTED RESULTS:");
  console.log("=".repeat(80));
  console.log(formattedContent);
  console.log("=".repeat(80));
  
  // Display metadata
  console.log("\n📊 METADATA:");
  console.log(`Total tokens used: ${searchResult.usage?.total_tokens + formattedResult.usage?.total_tokens || 'N/A'}`);
  console.log(`  - Search step: ${searchResult.usage?.total_tokens || 'N/A'}`);
  console.log(`  - Format step: ${formattedResult.usage?.total_tokens || 'N/A'}`);
  
  console.log("\n💡 RECOMMENDATIONS TO REDUCE HALLUCINATIONS:");
  console.log("  1. Verify each URL/DOI manually before trusting the results");
  console.log("  2. Cross-reference with PubMed directly: https://pubmed.ncbi.nlm.nih.gov/");
  console.log("  3. Papers marked [UNVERIFIED] should be treated with caution");
  console.log("  4. Consider implementing a URL verification step in the pipeline");
  
  console.log("\n✅ Search completed successfully!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

