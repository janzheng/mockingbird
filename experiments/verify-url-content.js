import "jsr:@std/dotenv/load";

console.log("🔍 Verifying actual URL content vs search results\n");

// URLs from the search results
const urlsToCheck = [
  {
    url: "https://www.nature.com/articles/s41598-025-05069-y",
    claimedTitle: "Engineered phage-silver nanoparticle complexes as a new tool for targeted therapies",
    claimedDate: "16 October 2025",
    claimedJournal: "Scientific Reports"
  },
  {
    url: "https://www.mdpi.com/2079-6382/14/10/1040",
    claimedTitle: "Phage Therapy as a Novel Alternative to Antibiotics",
    claimedDate: "17 October 2025",
    claimedJournal: "Antibiotics"
  },
  {
    url: "https://www.nature.com/articles/s44298-025-00155-4",
    claimedTitle: "Therapeutic potential of Shigella phage SSG23 against Shigella sonnei biofilms and in BALB/c mice",
    claimedDate: "16 October 2025",
    claimedJournal: "[Not shown]"
  }
];

async function extractMetadataFromHtml(html) {
  const metadata = {};
  
  // Extract title from meta tags or title tag
  const titleMatch = html.match(/<meta name="citation_title" content="([^"]+)"/i) ||
                     html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1];
  
  // Extract publication date
  const dateMatch = html.match(/<meta name="citation_publication_date" content="([^"]+)"/i) ||
                    html.match(/<meta name="citation_online_date" content="([^"]+)"/i) ||
                    html.match(/<meta property="article:published_time" content="([^"]+)"/i);
  if (dateMatch) metadata.date = dateMatch[1];
  
  // Extract journal name
  const journalMatch = html.match(/<meta name="citation_journal_title" content="([^"]+)"/i) ||
                       html.match(/<meta property="og:site_name" content="([^"]+)"/i);
  if (journalMatch) metadata.journal = journalMatch[1];
  
  // Extract DOI
  const doiMatch = html.match(/<meta name="citation_doi" content="([^"]+)"/i) ||
                   html.match(/doi\.org\/(10\.\d{4,}\/[^\s"]+)/i);
  if (doiMatch) metadata.doi = doiMatch[1];
  
  return metadata;
}

for (const paper of urlsToCheck) {
  console.log("=".repeat(80));
  console.log(`\n🔗 Checking: ${paper.url}\n`);
  
  try {
    const response = await fetch(paper.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      continue;
    }
    
    const html = await response.text();
    const actualMetadata = await extractMetadataFromHtml(html);
    
    console.log("📊 CLAIMED (from Groq search results):");
    console.log(`   Title:   ${paper.claimedTitle}`);
    console.log(`   Date:    ${paper.claimedDate}`);
    console.log(`   Journal: ${paper.claimedJournal}`);
    
    console.log("\n📄 ACTUAL (from webpage metadata):");
    console.log(`   Title:   ${actualMetadata.title || '[NOT FOUND]'}`);
    console.log(`   Date:    ${actualMetadata.date || '[NOT FOUND]'}`);
    console.log(`   Journal: ${actualMetadata.journal || '[NOT FOUND]'}`);
    if (actualMetadata.doi) {
      console.log(`   DOI:     ${actualMetadata.doi}`);
    }
    
    // Compare
    console.log("\n🔍 COMPARISON:");
    
    if (actualMetadata.title) {
      const titleMatch = actualMetadata.title.toLowerCase().includes(paper.claimedTitle.toLowerCase().substring(0, 30));
      console.log(`   Title:   ${titleMatch ? '✅ Match' : '❌ MISMATCH'}`);
      if (!titleMatch) {
        console.log(`            Claimed: "${paper.claimedTitle.substring(0, 50)}..."`);
        console.log(`            Actual:  "${actualMetadata.title.substring(0, 50)}..."`);
      }
    } else {
      console.log(`   Title:   ⚠️  Could not extract from page`);
    }
    
    if (actualMetadata.date) {
      // Compare dates - could be in different formats
      const claimedDateNormalized = paper.claimedDate.toLowerCase().replace(/\s+/g, '');
      const actualDateNormalized = actualMetadata.date.toLowerCase().replace(/\s+/g, '');
      const dateMatch = claimedDateNormalized.includes(actualDateNormalized) || 
                       actualDateNormalized.includes(claimedDateNormalized) ||
                       actualMetadata.date.includes('2025');
      
      console.log(`   Date:    ${dateMatch ? '✅ Match/Close' : '❌ MISMATCH'}`);
      if (!dateMatch) {
        console.log(`            Claimed: ${paper.claimedDate}`);
        console.log(`            Actual:  ${actualMetadata.date}`);
      }
    } else {
      console.log(`   Date:    ⚠️  Could not extract from page`);
    }
    
    if (actualMetadata.journal && paper.claimedJournal !== '[Not shown]') {
      const journalMatch = actualMetadata.journal.toLowerCase().includes(paper.claimedJournal.toLowerCase()) ||
                          paper.claimedJournal.toLowerCase().includes(actualMetadata.journal.toLowerCase());
      console.log(`   Journal: ${journalMatch ? '✅ Match' : '❌ MISMATCH'}`);
      if (!journalMatch) {
        console.log(`            Claimed: ${paper.claimedJournal}`);
        console.log(`            Actual:  ${actualMetadata.journal}`);
      }
    } else if (actualMetadata.journal) {
      console.log(`   Journal: ℹ️  Found: ${actualMetadata.journal}`);
    } else {
      console.log(`   Journal: ⚠️  Could not extract from page`);
    }
    
  } catch (error) {
    console.log(`❌ Error fetching URL: ${error.message}`);
  }
  
  console.log();
}

console.log("=".repeat(80));
console.log("\n✅ Verification complete!");
console.log("\n💡 INTERPRETATION:");
console.log("   ✅ = Search results match actual webpage");
console.log("   ❌ = Search results DO NOT match webpage (hallucination or wrong metadata)");
console.log("   ⚠️  = Could not verify (metadata not found on page)");

