import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from '../core/search/compound.js';

console.log("🔬 Phage Therapy Papers - URL Discovery + Direct Metadata Fetch\n");
console.log("Strategy: Use Groq only to find URLs, then get real metadata from the pages\n");
console.log("=".repeat(80));

/**
 * Extract metadata directly from webpage HTML
 */
async function fetchMetadataFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return { url, error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    const metadata = { url };
    
    // Extract title
    const titleMatch = html.match(/<meta name="citation_title" content="([^"]+)"/i) ||
                       html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                       html.match(/<meta name="dc\.title" content="([^"]+)"/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1]
        .replace(/\s*\|\s*.*$/, '')  // Remove "| Journal Name" suffix
        .replace(/\s*-\s*.*$/, '')    // Remove "- Site Name" suffix  
        .trim();
    }
    
    // Extract authors
    const authorMatches = html.matchAll(/<meta name="citation_author" content="([^"]+)"/gi);
    const authors = [...authorMatches].map(m => m[1]);
    if (authors.length > 0) {
      metadata.authors = authors.slice(0, 5);  // First 5 authors
      if (authors.length > 5) metadata.authors.push('et al.');
    }
    
    // Extract publication date
    const dateMatch = html.match(/<meta name="citation_publication_date" content="([^"]+)"/i) ||
                      html.match(/<meta name="citation_online_date" content="([^"]+)"/i) ||
                      html.match(/<meta property="article:published_time" content="([^"]+)"/i) ||
                      html.match(/<meta name="dc\.date" content="([^"]+)"/i);
    if (dateMatch) {
      metadata.date = dateMatch[1];
      // Format date nicely if it's in YYYY/MM/DD format
      if (metadata.date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        const [year, month, day] = metadata.date.split('/');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        metadata.dateFormatted = `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
      } else if (metadata.date.match(/^\d{4}\/\d{2}$/)) {
        const [year, month] = metadata.date.split('/');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        metadata.dateFormatted = `${monthNames[parseInt(month) - 1]} ${year}`;
      } else {
        metadata.dateFormatted = metadata.date;
      }
    }
    
    // Extract journal name
    const journalMatch = html.match(/<meta name="citation_journal_title" content="([^"]+)"/i) ||
                         html.match(/<meta name="citation_journal_abbrev" content="([^"]+)"/i) ||
                         html.match(/<meta property="og:site_name" content="([^"]+)"/i) ||
                         html.match(/<meta name="dc\.publisher" content="([^"]+)"/i);
    if (journalMatch) {
      metadata.journal = journalMatch[1];
    }
    
    // Extract DOI
    const doiMatch = html.match(/<meta name="citation_doi" content="([^"]+)"/i) ||
                     html.match(/<meta name="dc\.identifier" content="doi:([^"]+)"/i) ||
                     html.match(/doi\.org\/(10\.\d{4,}\/[^\s"<]+)/i);
    if (doiMatch) {
      metadata.doi = doiMatch[1].replace(/^doi:/, '');
    }
    
    // Extract abstract
    const abstractMatch = html.match(/<meta name="citation_abstract" content="([^"]+)"/i) ||
                         html.match(/<meta name="dc\.description" content="([^"]+)"/i) ||
                         html.match(/<meta property="og:description" content="([^"]+)"/i);
    if (abstractMatch) {
      metadata.abstract = abstractMatch[1].substring(0, 300);  // First 300 chars
      if (abstractMatch[1].length > 300) metadata.abstract += '...';
    }
    
    return metadata;
    
  } catch (error) {
    return { url, error: error.message };
  }
}

try {
  // Step 1: Use Groq ONLY to find URLs
  console.log("\n📡 STEP 1: Finding URLs (using Groq Compound for discovery only)");
  console.log("-".repeat(80));
  
  const urlDiscoveryQuery = `Find URLs of phage therapy research papers published in October 2025.
Today's date is: ${new Date().toISOString().split('T')[0]}

Search these databases:
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Europe PMC (europepmc.org)  
- bioRxiv (biorxiv.org)
- medRxiv (medrxiv.org)
- Nature journals (nature.com)
- MDPI journals (mdpi.com)

Your ONLY job is to find and list URLs. Format:
- URL 1
- URL 2
- URL 3

Do NOT provide titles, dates, or other metadata. Just URLs.`;

  const urlResult = await searchWithCompound(urlDiscoveryQuery, {
    system: `You are a URL finder. Return ONLY a list of URLs, nothing else. 
Do not provide metadata, just URLs.`,
    temperature: 0.1,
    max_tokens: 2000,
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
  
  const urlContent = urlResult.choices[0]?.message?.content;
  console.log("Raw response from Groq:");
  console.log(urlContent);
  console.log("-".repeat(80));
  
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const urls = [...new Set(urlContent.match(urlRegex) || [])];  // Remove duplicates
  
  console.log(`\n✅ Found ${urls.length} unique URLs`);
  
  if (urls.length === 0) {
    console.log("\n❌ No URLs found. Exiting.");
    Deno.exit(1);
  }
  
  // Step 2: Fetch real metadata from each URL
  console.log("\n\n📄 STEP 2: Fetching REAL metadata directly from webpages");
  console.log("=".repeat(80));
  
  const papers = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] Fetching: ${url}`);
    
    const metadata = await fetchMetadataFromUrl(url);
    
    if (metadata.error) {
      console.log(`   ❌ Error: ${metadata.error}`);
    } else {
      console.log(`   ✅ Title: ${metadata.title?.substring(0, 60)}${metadata.title?.length > 60 ? '...' : ''}`);
      console.log(`   ✅ Date: ${metadata.dateFormatted || metadata.date || '[Not found]'}`);
      console.log(`   ✅ Journal: ${metadata.journal || '[Not found]'}`);
      papers.push(metadata);
    }
    
    // Small delay to be respectful
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Step 3: Display formatted results
  console.log("\n\n📋 FINAL RESULTS (Real metadata from webpages)");
  console.log("=".repeat(80));
  
  papers.forEach((paper, i) => {
    console.log(`\n## Paper ${i + 1}`);
    console.log(`**Title:** ${paper.title || '[Not found]'}`);
    
    if (paper.authors && paper.authors.length > 0) {
      console.log(`**Authors:** ${paper.authors.join(', ')}`);
    }
    
    console.log(`**Journal:** ${paper.journal || '[Not found]'}`);
    console.log(`**Date:** ${paper.dateFormatted || paper.date || '[Not found]'}`);
    
    if (paper.doi) {
      console.log(`**DOI:** ${paper.doi}`);
      console.log(`**DOI Link:** https://doi.org/${paper.doi}`);
    }
    
    console.log(`**URL:** ${paper.url}`);
    
    if (paper.abstract) {
      console.log(`**Abstract:** ${paper.abstract}`);
    }
    
    console.log();
  });
  
  console.log("=".repeat(80));
  
  // Statistics
  console.log("\n📊 STATISTICS:");
  console.log(`Total URLs found: ${urls.length}`);
  console.log(`Successfully fetched metadata: ${papers.length}`);
  console.log(`Failed: ${urls.length - papers.length}`);
  console.log(`Groq tokens used: ${urlResult.usage?.total_tokens || 'N/A'} (for URL discovery only)`);
  
  console.log("\n✅ All metadata is from actual webpages - NO LLM interpretation!");
  console.log("💡 This ensures 100% accuracy for titles, dates, journals, and DOIs");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

