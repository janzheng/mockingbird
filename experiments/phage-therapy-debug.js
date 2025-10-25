import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from '../core/search/compound.js';

console.log("🔬 DEBUG MODE: Tracing Groq Compound search results\n");
console.log("=".repeat(80));

try {
  // Step 1: Get raw search results
  console.log("\n📡 STEP 1: RAW SEARCH (no formatting)");
  console.log("=".repeat(80));
  
  const rawQuery = `Search for phage therapy research papers published in October 2025.
Today's date is: ${new Date().toISOString().split('T')[0]}

Search PubMed, bioRxiv, medRxiv, and major journals.
For each paper you find, list EXACTLY what you see in the search results:
- The exact URL
- The exact title as shown
- The exact date as shown
- The exact journal name as shown

Do NOT reformat or interpret the information. Just report what you find.`;

  const rawResult = await searchWithCompound(rawQuery, {
    system: `You are a search tool that reports EXACTLY what you find in search results.
Do not reformat dates, do not interpret information, do not make assumptions.
Copy information EXACTLY as it appears in the search results.
If you can't find something, say so.`,
    temperature: 0.05, // Extremely low for maximum factuality
    max_tokens: 6000,
    search_settings: {
      include_domains: [
        "pubmed.ncbi.nlm.nih.gov",
        "europepmc.org",
        "biorxiv.org",
        "medrxiv.org",
        "nature.com",
        "science.org",
        "mdpi.com",
        "asm.org"
      ]
    }
  });
  
  const rawContent = rawResult.choices[0]?.message?.content;
  
  console.log("\n📄 RAW SEARCH RESULTS (unformatted):");
  console.log("-".repeat(80));
  console.log(rawContent);
  console.log("-".repeat(80));
  
  // Show tool calls if available
  if (rawResult.choices[0]?.message?.tool_calls) {
    console.log("\n🔧 TOOLS CALLED BY GROQ:");
    console.log("-".repeat(80));
    rawResult.choices[0].message.tool_calls.forEach((tool, i) => {
      console.log(`\n${i + 1}. Tool: ${tool.function?.name || tool.type || tool.id}`);
      console.log(`   ID: ${tool.id}`);
      
      if (tool.function?.arguments) {
        try {
          const args = JSON.parse(tool.function.arguments);
          console.log(`   Arguments:`);
          console.log(`   ${JSON.stringify(args, null, 2)}`);
        } catch (e) {
          console.log(`   Arguments (raw): ${tool.function.arguments}`);
        }
      }
    });
    console.log("-".repeat(80));
  }
  
  // Step 2: Now format the same results
  console.log("\n\n📊 STEP 2: FORMATTED VERSION");
  console.log("=".repeat(80));
  
  const formatQuery = `Take these search results and format them nicely:

${rawContent}

Format each paper as:
## Paper [number]
- **Title:** [exact title from search results]
- **Authors:** [authors as shown]
- **Journal:** [exact journal name from search results]
- **Date:** [exact date from search results]
- **URL:** [url]

CRITICAL: Use the EXACT information from the search results above. Do not change dates, journal names, or any other information.`;

  const formattedResult = await searchWithCompound(formatQuery, {
    system: `You are formatting search results. 
Use EXACTLY the information provided. 
Do not change or reinterpret dates, journal names, or any other details.
If information is unclear, mark it as [UNCLEAR IN SOURCE].`,
    temperature: 0.05,
    max_tokens: 4096,
  });
  
  const formattedContent = formattedResult.choices[0]?.message?.content;
  
  console.log("\n📋 FORMATTED RESULTS:");
  console.log("-".repeat(80));
  console.log(formattedContent);
  console.log("-".repeat(80));
  
  // Step 3: Extract and verify URLs
  console.log("\n\n🔍 STEP 3: URL VERIFICATION");
  console.log("=".repeat(80));
  
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const rawUrls = rawContent.match(urlRegex) || [];
  const formattedUrls = formattedContent.match(urlRegex) || [];
  
  console.log(`\nURLs found in raw results: ${rawUrls.length}`);
  console.log(`URLs found in formatted results: ${formattedUrls.length}`);
  
  if (rawUrls.length > 0) {
    console.log("\n⏳ Verifying URLs from raw results...");
    
    for (const url of [...new Set(rawUrls)].slice(0, 10)) {  // Check first 10 unique URLs
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000)
        });
        console.log(`${response.ok ? '✅' : '❌'} ${url}`);
      } catch (error) {
        console.log(`❌ ${url} (${error.message})`);
      }
    }
  }
  
  // Step 4: Side-by-side comparison
  console.log("\n\n📊 STEP 4: COMPARISON ANALYSIS");
  console.log("=".repeat(80));
  
  const compareQuery = `Compare these two versions and identify any discrepancies:

RAW SEARCH RESULTS:
${rawContent}

FORMATTED VERSION:
${formattedContent}

List any differences in:
- Dates (did formatting change the dates?)
- Journal names (did formatting change journal names?)
- Titles (did formatting change titles?)
- Any other information that differs

Be specific about what changed between raw and formatted versions.`;

  const comparisonResult = await searchWithCompound(compareQuery, {
    system: `You are comparing two versions of the same data. 
Identify EXACTLY what changed between them.
Point out any discrepancies in dates, journal names, or other details.`,
    temperature: 0.1,
    max_tokens: 2048,
  });
  
  console.log("\n🔎 DISCREPANCY ANALYSIS:");
  console.log("-".repeat(80));
  console.log(comparisonResult.choices[0]?.message?.content);
  console.log("-".repeat(80));
  
  // Statistics
  console.log("\n\n📈 STATISTICS:");
  console.log("=".repeat(80));
  console.log(`Total tokens used: ${rawResult.usage?.total_tokens + formattedResult.usage?.total_tokens + comparisonResult.usage?.total_tokens || 'N/A'}`);
  console.log(`  - Raw search: ${rawResult.usage?.total_tokens || 'N/A'} tokens`);
  console.log(`  - Formatting: ${formattedResult.usage?.total_tokens || 'N/A'} tokens`);
  console.log(`  - Comparison: ${comparisonResult.usage?.total_tokens || 'N/A'} tokens`);
  
  console.log("\n✅ Debug trace completed!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

