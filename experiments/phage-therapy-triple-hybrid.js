import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchResearchPapers } from '../core/search/exa-search/exa-search.js';
import { fetchAcademicMetadata } from '../core/scrape/index.js';

/**
 * Triple Hybrid Search: PubMed + bioRxiv API + Exa
 * 
 * Strategy:
 * 1. Search PubMed for indexed papers with "phage therapy"
 * 2. Search bioRxiv/medRxiv directly via API with microbiology filter
 * 3. Search Exa for other academic sources with natural language query
 * 
 * All searches filtered to last 30 days
 */

/**
 * Parse XML text into a basic DOM-like structure
 * Simple XML parser for PubMed data
 */
function parseXML(xmlText) {
  const getTextContent = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };

  const getAllTextContent = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'gi');
    const matches = [...xml.matchAll(regex)];
    return matches.map(m => m[1].trim());
  };

  return { getTextContent, getAllTextContent };
}

/**
 * Fetch complete metadata for PubMed articles using eFetch API
 */
async function fetchPubMedMetadata(pmids) {
  const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const pmidList = pmids.join(',');
  const fetchUrl = `${baseUrl}efetch.fcgi?db=pubmed&id=${pmidList}&retmode=xml&rettype=abstract`;
  
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`PubMed eFetch API returned ${response.status}`);
  }
  
  const xmlText = await response.text();
  const papers = [];
  const articleMatches = [...xmlText.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)];
  
  for (const articleMatch of articleMatches) {
    const articleXML = articleMatch[1];
    const parser = parseXML(articleXML);
    const paper = { source: 'pubmed' };
    
    // Extract PMID
    const pmid = parser.getTextContent(articleXML, 'PMID');
    if (pmid) {
      paper.pmid = pmid;
      paper.url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
    }
    
    // Extract title
    const articleTitle = parser.getTextContent(articleXML, 'ArticleTitle');
    if (articleTitle) {
      paper.title = articleTitle.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }
    
    // Extract abstract
    const abstractTexts = parser.getAllTextContent(articleXML, 'AbstractText');
    if (abstractTexts.length > 0) {
      paper.abstract = abstractTexts.join(' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }
    
    // Extract authors
    const authorList = articleXML.match(/<AuthorList[^>]*>([\s\S]*?)<\/AuthorList>/i);
    if (authorList) {
      const authors = [];
      const authorMatches = [...authorList[1].matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g)];
      
      for (const authorMatch of authorMatches) {
        const authorXML = authorMatch[1];
        const authorParser = parseXML(authorXML);
        const lastName = authorParser.getTextContent(authorXML, 'LastName');
        const foreName = authorParser.getTextContent(authorXML, 'ForeName');
        const initials = authorParser.getTextContent(authorXML, 'Initials');
        
        if (lastName) {
          if (foreName) {
            authors.push(`${foreName} ${lastName}`);
          } else if (initials) {
            authors.push(`${initials} ${lastName}`);
          } else {
            authors.push(lastName);
          }
        }
      }
      if (authors.length > 0) paper.authors = authors;
    }
    
    // Extract publication date
    const pubDate = articleXML.match(/<PubDate>([\s\S]*?)<\/PubDate>/i);
    if (pubDate) {
      const dateXML = pubDate[1];
      const dateParser = parseXML(dateXML);
      const year = dateParser.getTextContent(dateXML, 'Year');
      const month = dateParser.getTextContent(dateXML, 'Month');
      const day = dateParser.getTextContent(dateXML, 'Day');
      
      if (year) paper.year = year;
      if (month) paper.month = month;
      if (day) paper.day = day;
      
      if (day && month && year) {
        paper.dateFormatted = `${day} ${month} ${year}`;
      } else if (month && year) {
        paper.dateFormatted = `${month} ${year}`;
      } else if (year) {
        paper.dateFormatted = year;
      }
    }
    
    // Check ArticleDate if no PubDate
    if (!paper.dateFormatted) {
      const articleDate = articleXML.match(/<ArticleDate[^>]*>([\s\S]*?)<\/ArticleDate>/i);
      if (articleDate) {
        const dateXML = articleDate[1];
        const dateParser = parseXML(dateXML);
        const year = dateParser.getTextContent(dateXML, 'Year');
        const month = dateParser.getTextContent(dateXML, 'Month');
        const day = dateParser.getTextContent(dateXML, 'Day');
        
        if (year) paper.year = year;
        if (month) paper.month = month;
        if (day) paper.day = day;
        
        if (day && month && year) {
          paper.dateFormatted = `${day} ${month} ${year}`;
        } else if (month && year) {
          paper.dateFormatted = `${month} ${year}`;
        } else if (year) {
          paper.dateFormatted = year;
        }
      }
    }
    
    // Extract journal
    const journal = parser.getTextContent(articleXML, 'Title');
    if (journal) paper.journal = journal;
    
    // Extract DOI
    const articleIds = articleXML.match(/<ArticleIdList>([\s\S]*?)<\/ArticleIdList>/i);
    if (articleIds) {
      const doiMatch = articleIds[1].match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/i);
      if (doiMatch) paper.doi = doiMatch[1];
    }
    
    papers.push(paper);
  }
  
  return papers;
}

/**
 * Search PubMed for papers within a specific date range
 */
async function searchPubMed(query, daysBack = 30, maxResults = 20) {
  const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };
  
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  
  const searchUrl = `${baseUrl}esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&datetype=pdat&mindate=${startDateStr}&maxdate=${endDateStr}&retmode=json&retmax=${maxResults}`;
  
  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`PubMed API returned ${response.status}`);
  }
  
  const data = await response.json();
  const pmids = data.esearchresult?.idlist || [];
  const count = data.esearchresult?.count || 0;
  
  return { pmids, count, startDate, endDate };
}

/**
 * Search bioRxiv/medRxiv directly for preprints
 * API endpoint: https://api.biorxiv.org/details/[server]/[start_date]/[end_date]/[cursor]
 * With optional category filter
 */
async function searchBioRxiv(startDate, endDate, category = 'microbiology') {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  
  console.log(`📅 Searching bioRxiv from ${startDateStr} to ${endDateStr}`);
  if (category) {
    console.log(`🏷️  Category filter: ${category}`);
  }
  
  const papers = [];
  
  // Search both bioRxiv and medRxiv
  for (const server of ['biorxiv', 'medrxiv']) {
    try {
      let apiUrl = `https://api.biorxiv.org/details/${server}/${startDateStr}/${endDateStr}/0`;
      if (category) {
        apiUrl += `?category=${encodeURIComponent(category)}`;
      }
      
      console.log(`  Fetching from ${server}...`);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.log(`  ⚠️  ${server} API returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const collection = data.collection || [];
      
      console.log(`  Found ${collection.length} total papers on ${server}`);
      
      // Filter for papers matching phage terms
      const matchingPapers = collection.filter(paper => {
        const title = (paper.title || '').toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const text = `${title} ${abstract}`;
        
        // Must be about bacteriophages, not other types of phages
        const hasBacteriophage = text.includes('bacteriophage');
        const hasPhageTherapy = text.includes('phage therapy');
        const hasPhage = /\bphage\b/i.test(text); // Word boundary to avoid "macrophage"
        
        // Exclude obvious macrophage papers
        const isMacrophagePaper = title.includes('macrophage') && 
                                  !title.includes('bacteriophage') && 
                                  !title.includes('phage therapy');
        
        return (hasBacteriophage || hasPhageTherapy || hasPhage) && !isMacrophagePaper;
      });
      
      console.log(`  Filtered to ${matchingPapers.length} phage-related papers`);
      
      // Convert to our metadata format
      for (const paper of matchingPapers) {
        papers.push({
          source: server,
          title: paper.title,
          authors: paper.authors?.split(';').map(a => a.trim()) || [],
          doi: paper.doi,
          url: `https://www.${server}.org/content/${paper.doi}v${paper.version}`,
          abstract: paper.abstract,
          date: paper.date,
          dateFormatted: paper.date,
          year: paper.date?.split('-')[0],
          month: paper.date?.split('-')[1],
          day: paper.date?.split('-')[2],
          journal: server === 'biorxiv' ? 'bioRxiv' : 'medRxiv',
          category: paper.category
        });
      }
    } catch (error) {
      console.log(`  ❌ Error fetching from ${server}: ${error.message}`);
    }
  }
  
  return papers;
}

/**
 * Calculate string similarity (for deduplication)
 */
function similarity(s1, s2) {
  if (!s1 || !s2) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    
    return costs[s2.length];
  };
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

/**
 * Deduplicate papers by DOI and title similarity
 */
function deduplicatePapers(papers) {
  const seen = new Map();
  const unique = [];
  
  for (const paper of papers) {
    // Priority 1: DOI match
    if (paper.doi) {
      const doiKey = `doi:${paper.doi.toLowerCase()}`;
      if (seen.has(doiKey)) {
        const existing = seen.get(doiKey);
        // Prefer PubMed metadata over others
        if (paper.source === 'pubmed' && existing.source !== 'pubmed') {
          const idx = unique.findIndex(p => p === existing);
          unique[idx] = { ...paper, duplicateSource: existing.source };
          seen.set(doiKey, paper);
        }
        continue;
      }
      seen.set(doiKey, paper);
    }
    
    // Priority 2: Title similarity
    const normalizedTitle = paper.title?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedTitle && normalizedTitle.length > 20) {
      let isDuplicate = false;
      for (const [key, existing] of seen.entries()) {
        if (key.startsWith('title:')) {
          const existingTitle = key.slice(6);
          if (similarity(normalizedTitle, existingTitle) > 0.9) {
            // Prefer PubMed over others for duplicates
            if (paper.source === 'pubmed' && existing.source !== 'pubmed') {
              const idx = unique.findIndex(p => p === existing);
              unique[idx] = { ...paper, duplicateSource: existing.source };
              seen.delete(key);
              seen.set(`title:${normalizedTitle}`, paper);
            }
            isDuplicate = true;
            break;
          }
        }
      }
      if (isDuplicate) continue;
      seen.set(`title:${normalizedTitle}`, paper);
    }
    
    unique.push(paper);
  }
  
  return unique;
}

/**
 * Main function
 */
async function searchPhageTherapyTripleHybrid(daysBack = 30) {
  console.log(`🔬 PHAGE THERAPY PAPERS - TRIPLE HYBRID SEARCH\n`);
  console.log("Strategy:");
  console.log("1. Search PubMed for indexed biomedical papers");
  console.log("2. Search bioRxiv/medRxiv API with microbiology category filter");
  console.log("3. Search Exa for other academic sources");
  console.log("4. All searches filtered to last 30 days");
  console.log("5. Deduplicate by DOI and title similarity");
  console.log("6. Display combined results with source attribution\n");
  console.log("=".repeat(80));
  
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  try {
    // Define search queries
    const pubmedQuery = "phage therapy";
    const exaQuery = "phage therapy OR bacteriophage OR phage biology";
    
    console.log(`\n📝 Search Queries:`);
    console.log(`   PubMed: "${pubmedQuery}"`);
    console.log(`   bioRxiv/medRxiv: Date range + microbiology + client-side phage filtering`);
    console.log(`   Exa: "${exaQuery}" + includeText filter`);
    console.log(`\n📅 Date Range: Last ${daysBack} days (${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]})`);
    
    // STEP 1: Search PubMed
    console.log("\n\n📡 STEP 1: Searching PubMed");
    console.log("-".repeat(80));
    
    const pubmedSearch = await searchPubMed(pubmedQuery, daysBack, 20);
    console.log(`✅ Found ${pubmedSearch.count} papers in PubMed`);
    
    let pubmedPapers = [];
    if (pubmedSearch.pmids.length > 0) {
      console.log(`📥 Fetching metadata for ${pubmedSearch.pmids.length} PubMed papers...`);
      pubmedPapers = await fetchPubMedMetadata(pubmedSearch.pmids);
      console.log(`✅ Retrieved ${pubmedPapers.length} papers from PubMed`);
    }
    
    // STEP 2: Search bioRxiv/medRxiv
    console.log("\n\n📡 STEP 2: Searching bioRxiv/medRxiv via API");
    console.log("-".repeat(80));
    
    const biorxivPapers = await searchBioRxiv(startDate, now, 'microbiology');
    console.log(`✅ Retrieved ${biorxivPapers.length} preprints from bioRxiv/medRxiv`);
    
    // STEP 3: Search Exa
    console.log("\n\n📡 STEP 3: Searching Exa (other academic sources)");
    console.log("-".repeat(80));
    console.log("Goal: Find research papers from diverse academic sources");
    console.log("Using: auto search type + category filter + includeText filter");
    
    const exaResult = await searchResearchPapers(exaQuery, {
      type: "auto",  // Auto: balanced neural + keyword search
      numResults: 50,
      startPublishedDate: startDate.toISOString(),
      endPublishedDate: now.toISOString(),
      includeText: ["phage"],  // Ensure results contain "phage" in the text
      // Note: Removed includeDomains to cast a wider net
      // Exa's category:"research paper" will filter for academic sources
    });
    
    console.log(`✅ Found ${exaResult.results.length} results from Exa`);
    
    // Filter out collection/index pages
    const filteredResults = exaResult.results.filter(result => {
      const url = result.url.toLowerCase();
      
      // Exclude table of contents and collection pages
      if (url.includes('/toc/')) return false;
      if (url.match(/\/journal\/[^/]+\/?$/)) return false;
      if (url.includes('/research-topics/')) return false;
      if (url.includes('/collections/')) return false;
      if (url.includes('/collection/')) return false;
      if (url.includes('/authors')) return false;
      if (url.includes('/latest')) return false;
      if (url.includes('/recent')) return false;
      
      // Include if URL suggests individual article
      if (url.includes('/article')) return true;
      if (url.includes('/articles/')) return true;
      if (url.includes('/doi/')) return true;
      if (url.match(/\/\d{7,}\/?$/)) return true;
      if (url.match(/\/[a-z0-9-]{10,}/)) return true;
      
      // Preprint servers usually have good URL structure
      if ((url.includes('biorxiv.org') || url.includes('medrxiv.org') || url.includes('arxiv.org')) 
          && !url.includes('/collection')) {
        return true;
      }
      
      return false;
    });
    
    console.log(`📄 Filtered to ${filteredResults.length} actual paper URLs`);
    
    // Fetch metadata for Exa results
    const exaPapers = [];
    const TARGET_PAPERS = 20;
    console.log(`📄 Fetching metadata (stopping at ${TARGET_PAPERS} valid papers)...`);
    
    for (let i = 0; i < filteredResults.length && exaPapers.length < TARGET_PAPERS; i++) {
      const result = filteredResults[i];
      console.log(`  [${i + 1}/${filteredResults.length}] (collected: ${exaPapers.length}/${TARGET_PAPERS}) ${result.url}`);
      
      const metadata = await fetchAcademicMetadata(result.url);
      
      if (!metadata.error) {
        const title = (metadata.title || result.title || '').toLowerCase();
        const abstract = (metadata.abstract || result.text || '').toLowerCase();
        
        // Must have DOI
        if (!metadata.doi) {
          console.log(`     ⏭️  Skipping - no DOI`);
          continue;
        }
        
        // Must be phage-related
        const hasPhageInTitle = title.includes('phage') || title.includes('bacteriophage');
        const hasPhageInAbstract = abstract.includes('phage therapy') || 
                                  abstract.includes('bacteriophage') ||
                                  abstract.includes('phages as');
        
        if (!hasPhageInTitle && !hasPhageInAbstract) {
          console.log(`     ⏭️  Skipping - not phage-related`);
          continue;
        }
        
        metadata.source = 'exa';
        metadata.exaTitle = result.title;
        metadata.exaPublishedDate = result.publishedDate;
        exaPapers.push(metadata);
        console.log(`     ✅ Valid phage paper (${exaPapers.length}/${TARGET_PAPERS})`);
      } else {
        console.log(`     ⚠️  Error: ${metadata.error}`);
      }
      
      // Small delay
      if (i < filteredResults.length - 1 && exaPapers.length < TARGET_PAPERS) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    
    console.log(`✅ Retrieved ${exaPapers.length} papers from Exa`);
    
    // STEP 4: Deduplicate
    console.log("\n\n🔄 STEP 4: Deduplicating papers");
    console.log("-".repeat(80));
    
    const allPapers = [...pubmedPapers, ...biorxivPapers, ...exaPapers];
    console.log(`Total papers before deduplication: ${allPapers.length}`);
    console.log(`  - PubMed: ${pubmedPapers.length}`);
    console.log(`  - bioRxiv/medRxiv: ${biorxivPapers.length}`);
    console.log(`  - Exa: ${exaPapers.length}`);
    
    const uniquePapers = deduplicatePapers(allPapers);
    console.log(`\n✅ Unique papers after deduplication: ${uniquePapers.length}`);
    console.log(`Duplicates removed: ${allPapers.length - uniquePapers.length}`);
    
    // STEP 5: Display results by source
    console.log("\n\n📋 RESULTS");
    console.log("=".repeat(80));
    
    // Separate by source
    const fromPubMed = uniquePapers.filter(p => p.source === 'pubmed');
    const fromBioRxiv = uniquePapers.filter(p => p.source === 'biorxiv' || p.source === 'medrxiv');
    const fromExa = uniquePapers.filter(p => p.source === 'exa' || p.source === 'Exa');
    
    // Display PubMed papers
    if (fromPubMed.length > 0) {
      console.log(`\n\n📚 FROM PUBMED (${fromPubMed.length} papers)`);
      console.log("=".repeat(80));
      
      fromPubMed.forEach((paper, i) => {
        console.log(`\n${"-".repeat(80)}`);
        console.log(`## Paper ${i + 1}: ${paper.title}`);
        console.log(`${"-".repeat(80)}`);
        console.log(`**PMID:** ${paper.pmid}`);
        console.log(`**URL:** ${paper.url}`);
        
        if (paper.authors && paper.authors.length > 0) {
          console.log(`\n**Authors (${paper.authors.length}):** ${paper.authors.slice(0, 5).join(', ')}${paper.authors.length > 5 ? ', et al.' : ''}`);
        }
        
        console.log(`**Journal:** ${paper.journal || '[Not found]'}`);
        console.log(`**Date:** ${paper.dateFormatted || '[Not found]'}`);
        
        if (paper.doi) {
          console.log(`**DOI:** ${paper.doi}`);
        }
        
        if (paper.abstract) {
          console.log(`\n**Abstract:** ${paper.abstract.substring(0, 300)}${paper.abstract.length > 300 ? '...' : ''}`);
        }
        
        if (paper.duplicateSource) {
          console.log(`\n🔄 Note: Also found via ${paper.duplicateSource}`);
        }
      });
    }
    
    // Display bioRxiv/medRxiv preprints
    if (fromBioRxiv.length > 0) {
      console.log(`\n\n🧬 FROM BIORXIV/MEDRXIV (${fromBioRxiv.length} papers)`);
      console.log("=".repeat(80));
      console.log("Preprints from bioRxiv and medRxiv found via direct API");
      
      fromBioRxiv.forEach((paper, i) => {
        console.log(`\n${"-".repeat(80)}`);
        console.log(`## Paper ${i + 1}: ${paper.title}`);
        console.log(`${"-".repeat(80)}`);
        console.log(`**DOI:** ${paper.doi}`);
        console.log(`**URL:** ${paper.url}`);
        
        if (paper.authors && paper.authors.length > 0) {
          console.log(`\n**Authors (${paper.authors.length}):** ${paper.authors.slice(0, 5).join(', ')}${paper.authors.length > 5 ? ', et al.' : ''}`);
        }
        
        console.log(`**Date:** ${paper.dateFormatted || '[Not found]'}`);
        console.log(`**Platform:** ${paper.journal}`);
        console.log(`**Category:** ${paper.category || '[Not specified]'}`);
        
        if (paper.abstract) {
          console.log(`\n**Abstract:** ${paper.abstract.substring(0, 300)}${paper.abstract.length > 300 ? '...' : ''}`);
        }
        
        if (paper.duplicateSource) {
          console.log(`\n🔄 Note: Also found via ${paper.duplicateSource}`);
        }
      });
    }
    
    // Display Exa papers
    if (fromExa.length > 0) {
      console.log(`\n\n🌐 FROM EXA - OTHER SOURCES (${fromExa.length} papers)`);
      console.log("=".repeat(80));
      console.log("Papers from other academic sources");
      
      fromExa.forEach((paper, i) => {
        console.log(`\n${"-".repeat(80)}`);
        console.log(`## Paper ${i + 1}: ${paper.title || paper.exaTitle}`);
        console.log(`${"-".repeat(80)}`);
        console.log(`**URL:** ${paper.url}`);
        console.log(`**Source:** ${new URL(paper.url).hostname}`);
        
        if (paper.authors && paper.authors.length > 0) {
          console.log(`\n**Authors (${paper.authors.length}):** ${paper.authors.slice(0, 5).join(', ')}${paper.authors.length > 5 ? ', et al.' : ''}`);
        }
        
        console.log(`**Journal/Platform:** ${paper.journal || '[Not found]'}`);
        console.log(`**Date:** ${paper.dateFormatted || paper.exaPublishedDate || '[Not found]'}`);
        
        if (paper.doi) {
          console.log(`**DOI:** ${paper.doi}`);
        }
        
        if (paper.abstract) {
          console.log(`\n**Abstract:** ${paper.abstract.substring(0, 300)}${paper.abstract.length > 300 ? '...' : ''}`);
        }
        
        if (paper.duplicateSource) {
          console.log(`\n🔄 Note: Also found via ${paper.duplicateSource}`);
        }
      });
    }
    
    // Summary statistics
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 SUMMARY STATISTICS");
    console.log("=".repeat(80));
    
    console.log(`\nSearch Parameters:`);
    console.log(`  Date range: Last ${daysBack} days`);
    console.log(`  PubMed query: "${pubmedQuery}"`);
    console.log(`  bioRxiv/medRxiv: microbiology category + phage filtering`);
    console.log(`  Exa query: "${exaQuery}"`);
    console.log(`  Exa settings: type=auto, category="research paper", includeText=["phage"]`);
    
    console.log(`\nResults:`);
    console.log(`  Total unique papers: ${uniquePapers.length}`);
    console.log(`    - From PubMed: ${fromPubMed.length}`);
    console.log(`    - From bioRxiv/medRxiv: ${fromBioRxiv.length}`);
    console.log(`    - From Exa: ${fromExa.length}`);
    console.log(`  Duplicates removed: ${allPapers.length - uniquePapers.length}`);
    
    // Metadata completeness
    const withAuthors = uniquePapers.filter(p => p.authors && p.authors.length > 0).length;
    const withDates = uniquePapers.filter(p => p.dateFormatted || p.exaPublishedDate).length;
    const withAbstracts = uniquePapers.filter(p => p.abstract).length;
    const withDOI = uniquePapers.filter(p => p.doi).length;
    
    console.log(`\nMetadata Completeness:`);
    console.log(`  Authors: ${withAuthors}/${uniquePapers.length} (${Math.round(withAuthors/uniquePapers.length*100)}%)`);
    console.log(`  Dates: ${withDates}/${uniquePapers.length} (${Math.round(withDates/uniquePapers.length*100)}%)`);
    console.log(`  Abstracts: ${withAbstracts}/${uniquePapers.length} (${Math.round(withAbstracts/uniquePapers.length*100)}%)`);
    console.log(`  DOIs: ${withDOI}/${uniquePapers.length} (${Math.round(withDOI/uniquePapers.length*100)}%)`);
    
    console.log(`\n✅ ADVANTAGES OF TRIPLE HYBRID APPROACH:`);
    console.log(`  📚 PubMed: High-quality indexed papers with complete metadata`);
    console.log(`  🧬 bioRxiv/medRxiv API: Direct access to preprints with category filtering`);
    console.log(`  🌐 Exa: Auto search (neural+keyword) with category and text filters`);
    console.log(`  🔄 Smart deduplication: Best metadata preserved`);
    console.log(`  📅 Consistent date filtering: All sources use last 30 days`);
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    Deno.exit(1);
  }
}

// Get days back from command line or use default
const daysBack = parseInt(Deno.args[0]) || 30;

console.log("\n" + "=".repeat(80));
console.log(`🔬 TRIPLE HYBRID PHAGE THERAPY SEARCH`);
console.log(`📅 Date Range: Last ${daysBack} days`);
console.log("=".repeat(80) + "\n");

// Run the search
searchPhageTherapyTripleHybrid(daysBack);

