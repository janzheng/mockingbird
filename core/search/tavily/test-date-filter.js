import "jsr:@std/dotenv/load";
import { searchTavilyResults } from './tavily.js';

/**
 * Test Tavily's date filtering for academic papers
 * 
 * This script tests whether Tavily's start_date and end_date parameters
 * actually filter results to the specified date range when searching
 * for academic papers on bioRxiv/medRxiv.
 */

/**
 * Parse publication date from bioRxiv/medRxiv DOI
 * Format: 10.1101/YYYY.MM.DD.XXXXXX
 */
function parseDateFromDOI(doi) {
  if (!doi || !doi.includes('10.1101/')) {
    return null;
  }
  
  const doiDateMatch = doi.match(/10\.1101\/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!doiDateMatch) {
    return null;
  }
  
  const [_, year, month, day] = doiDateMatch;
  const date = new Date(`${year}-${month}-${day}`);
  return {
    date,
    formatted: `${year}-${month}-${day}`,
    year,
    month,
    day
  };
}

/**
 * Test Tavily date filtering
 */
async function testTavilyDateFilter() {
  console.log("🧪 Testing Tavily Date Filter for Academic Papers\n");
  console.log("=".repeat(80));
  
  // Test with a 30-day window (last month)
  const today = new Date();
  const daysBack = 30;
  const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(today);
  
  console.log("\n📅 Test Parameters:");
  console.log(`   Query: "phage therapy preprint"`);
  console.log(`   Start Date: ${startDateStr}`);
  console.log(`   End Date: ${endDateStr}`);
  console.log(`   Expected: Only papers published between these dates`);
  console.log(`   Domains: bioRxiv.org, medRxiv.org`);
  console.log("\n" + "=".repeat(80));
  
  try {
    console.log("\n🔍 Calling Tavily API...\n");
    
    const results = await searchTavilyResults("phage therapy preprint", {
      maxResults: 20,
      includeDomains: ["biorxiv.org", "medrxiv.org"],
      searchDepth: "advanced",
      start_date: startDateStr,
      end_date: endDateStr
    });
    
    console.log(`✅ Tavily returned ${results.length} results\n`);
    console.log("=".repeat(80));
    console.log("\n📊 Analyzing Results:\n");
    
    let withinRange = 0;
    let outsideRange = 0;
    let noDOI = 0;
    const outsideRangePapers = [];
    
    results.forEach((result, idx) => {
      const url = result.url.toLowerCase();
      
      // Skip non-bioRxiv/medRxiv URLs
      if (!url.includes('biorxiv.org') && !url.includes('medrxiv.org')) {
        return;
      }
      
      // Skip redirect URLs
      if (url.includes('/lookup/') || url.includes('/external-ref')) {
        return;
      }
      
      console.log(`\n[${idx + 1}] ${result.title}`);
      console.log(`    URL: ${result.url}`);
      console.log(`    Tavily published_date: ${result.published_date || 'not provided'}`);
      
      // Try to extract DOI from URL
      let doi = null;
      const doiMatch = result.url.match(/10\.1101\/[\d.]+/);
      if (doiMatch) {
        doi = doiMatch[0];
        console.log(`    DOI: ${doi}`);
        
        const parsedDate = parseDateFromDOI(doi);
        if (parsedDate) {
          console.log(`    📅 Actual Publication Date (from DOI): ${parsedDate.formatted}`);
          
          // Check if within range
          if (parsedDate.date >= startDate && parsedDate.date <= today) {
            console.log(`    ✅ Within date range`);
            withinRange++;
          } else {
            console.log(`    ❌ OUTSIDE date range (${parsedDate.date < startDate ? 'too old' : 'future date'})`);
            outsideRange++;
            outsideRangePapers.push({
              title: result.title,
              doi,
              actualDate: parsedDate.formatted,
              url: result.url
            });
          }
        } else {
          console.log(`    ⚠️  Could not parse date from DOI`);
          noDOI++;
        }
      } else {
        console.log(`    ⚠️  No DOI found in URL`);
        noDOI++;
      }
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("\n📈 Summary:\n");
    console.log(`   Total results: ${results.length}`);
    console.log(`   Papers within date range (${startDateStr} to ${endDateStr}): ${withinRange}`);
    console.log(`   Papers OUTSIDE date range: ${outsideRange}`);
    console.log(`   Papers without parseable DOI: ${noDOI}`);
    
    if (outsideRange > 0) {
      console.log("\n❌ TAVILY DATE FILTERING FAILED");
      console.log(`   ${outsideRange} paper(s) were returned outside the requested date range:\n`);
      
      outsideRangePapers.forEach((paper, idx) => {
        console.log(`   ${idx + 1}. "${paper.title}"`);
        console.log(`      Published: ${paper.actualDate}`);
        console.log(`      DOI: ${paper.doi}`);
        console.log(`      URL: ${paper.url}\n`);
      });
      
      console.log("   ⚠️  Conclusion: Tavily's start_date/end_date parameters do NOT");
      console.log("   effectively filter bioRxiv/medRxiv preprints by publication date.");
    } else if (withinRange > 0) {
      console.log("\n✅ TAVILY DATE FILTERING WORKS");
      console.log(`   All ${withinRange} paper(s) with parseable dates were within the requested range.`);
    } else {
      console.log("\n⚠️  INCONCLUSIVE");
      console.log("   No papers with parseable dates were found to test filtering.");
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("\n💡 Recommendation:");
    if (outsideRange > 0) {
      console.log("   For reliable date filtering of bioRxiv/medRxiv preprints,");
      console.log("   use the bioRxiv API directly instead of Tavily.");
      console.log("   See: https://api.biorxiv.org/");
    } else if (withinRange > 0) {
      console.log("   Tavily's date filtering appears to work for this query.");
      console.log("   Consider testing with different queries to verify consistency.");
    }
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    Deno.exit(1);
  }
}

// Run the test
console.log("\n");
testTavilyDateFilter();

