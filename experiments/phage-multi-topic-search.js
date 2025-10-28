import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchResearchPapers } from '../core/search/exa-search/exa-search.js';
import { fetchAcademicMetadata } from '../core/scrape/index.js';

/**
 * Multi-Topic Phage Research Search
 * 
 * Strategy:
 * 1. Search multiple topics: "phage therapy" and "phage bioinformatics"
 * 2. For each topic, search: PubMed + bioRxiv API + Exa
 * 3. Collect ~5 papers from each source for each topic
 * 4. Tag each paper with: [source, type, topic]
 * 5. All searches filtered to last 7 days
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
async function searchPubMed(query, daysBack = 7, maxResults = 10) {
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
 * Now with flexible term matching for different topics
 */
async function searchBioRxiv(startDate, endDate, topic) {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  
  console.log(`📅 Searching bioRxiv from ${startDateStr} to ${endDateStr}`);
  console.log(`🔍 Topic: ${topic}`);
  
  // Select appropriate categories based on topic
  const categoryMap = {
    'phage therapy': ['microbiology'],
    'phage bioinformatics': ['microbiology', 'bioinformatics'],
    'phage-host interactions': ['microbiology', 'immunology'],
    'phage biology': ['microbiology'],
    'phage resistance': ['microbiology'],
    'phage defense': ['microbiology', 'immunology'],
    'phage engineering': ['microbiology', 'synthetic biology'],
    'phage-antibiotic synergy': ['microbiology', 'pharmacology and toxicology'],
    'phageome': ['microbiology', 'bioinformatics'],
    'virome': ['microbiology', 'bioinformatics'],
    'prophage': ['microbiology', 'bioinformatics'],
    'phage-immune interactions': ['microbiology', 'immunology']
  };
  
  const categories = categoryMap[topic] || ['microbiology'];
  console.log(`🏷️  Category filters: ${categories.join(', ')}`);
  
  const papers = [];
  
  // Search both bioRxiv and medRxiv across all relevant categories
  for (const server of ['biorxiv', 'medrxiv']) {
    for (const category of categories) {
      try {
        let apiUrl = `https://api.biorxiv.org/details/${server}/${startDateStr}/${endDateStr}/0`;
        apiUrl += `?category=${encodeURIComponent(category)}`;
        
        console.log(`  Fetching from ${server} (${category})...`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.log(`  ⚠️  ${server} API returned ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        const collection = data.collection || [];
        
        console.log(`  Found ${collection.length} total papers on ${server} in ${category}`);
      
      // Filter for papers matching our topic
      const matchingPapers = collection.filter(paper => {
        const title = (paper.title || '').toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const text = `${title} ${abstract}`;
        
        // Always exclude obvious macrophage papers (unless about bacteriophages)
        const isMacrophagePaper = title.includes('macrophage') && 
                                  !text.includes('bacteriophage') && 
                                  !text.includes('phage therapy');
        
        if (isMacrophagePaper) return false;
        
        // For virome and phageome: must have "phage" in title (to ensure phage-specific)
        if (topic === 'virome' || topic === 'phageome') {
          const hasPhageInTitle = /\bphage\b/i.test(title) || title.includes('bacteriophage');
          if (!hasPhageInTitle) return false;
        }
        
        // Check for phage-related terms (in title or abstract)
        const hasPhage = /\bphage\b/i.test(text) || text.includes('bacteriophage');
        if (!hasPhage) return false;
        
        // Topic-specific filtering
        switch(topic) {
          case 'phage therapy':
            return text.includes('therapy') || text.includes('therapeutic') || text.includes('treatment');
          
          case 'phage bioinformatics':
            return text.includes('bioinformatics') || text.includes('computational') || 
                   text.includes('genomic') || text.includes('metagenomics');
          
          case 'phage-host interactions':
            return text.includes('host') || text.includes('infection') || text.includes('interaction');
          
          case 'phage biology':
            return text.includes('biology') || text.includes('lifecycle') || text.includes('life cycle') ||
                   text.includes('replication') || text.includes('morphology');
          
          case 'phage resistance':
            return text.includes('resistance') || text.includes('resistant');
          
          case 'phage defense':
            return text.includes('defense') || text.includes('defence') || text.includes('crispr') ||
                   text.includes('restriction') || text.includes('immunity');
          
          case 'phage engineering':
            return text.includes('engineering') || text.includes('engineered') || text.includes('synthetic') ||
                   text.includes('design') || text.includes('modification');
          
          case 'phage-antibiotic synergy':
            return (text.includes('antibiotic') || text.includes('antimicrobial')) && 
                   (text.includes('synergy') || text.includes('combination') || text.includes('combined'));
          
          case 'phageome':
            return text.includes('phageome') || text.includes('phage community') || text.includes('phage diversity');
          
          case 'virome':
            return text.includes('virome') || text.includes('viral community') || text.includes('viral metagenome');
          
          case 'prophage':
            return text.includes('prophage') || text.includes('lysogen') || text.includes('lysogenic') ||
                   text.includes('temperate phage');
          
          case 'phage-immune interactions':
            return text.includes('immune') || text.includes('immunity') || text.includes('immunolog');
          
          default:
            return true;
        }
      });
      
        console.log(`  Filtered to ${matchingPapers.length} ${topic} papers`);
        
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
            category: paper.category,
            tags: [server, 'preprint', topic]  // Add tags
          });
        }
      } catch (error) {
        console.log(`  ❌ Error fetching from ${server} (${category}): ${error.message}`);
      }
    }
  }
  
  // Deduplicate papers by DOI (since we may have searched multiple categories)
  const uniquePapers = deduplicatePapers(papers);
  console.log(`  Total unique papers after deduplication: ${uniquePapers.length}`);
  
  return uniquePapers;
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
async function searchMultiTopicPhageResearch(daysBack = 7) {
  console.log(`🔬 MULTI-TOPIC PHAGE RESEARCH SEARCH\n`);
  console.log("Strategy:");
  console.log("1. Search 12 phage-related topics");
  console.log("2. For each topic: PubMed + bioRxiv/medRxiv + Exa");
  console.log("3. Target ~5 papers from each source for each topic");
  console.log("4. All searches filtered to last 7 days");
  console.log("5. Tag each paper: [source, type, topic]");
  console.log("6. Deduplicate and display by topic\n");
  console.log("=".repeat(80));
  
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  const topics = [
    'phage therapy',
    'phage bioinformatics',
    'phage-host interactions',
    'phage biology',
    'phage resistance',
    'phage defense',
    'phage engineering',
    'phage-antibiotic synergy',
    'phageome',
    'virome',
    'prophage',
    'phage-immune interactions'
  ];
  const allPapersByTopic = {};
  
  try {
    // Search each topic
    for (const topic of topics) {
      console.log(`\n\n${'='.repeat(80)}`);
      console.log(`🔍 SEARCHING TOPIC: "${topic.toUpperCase()}"`);
      console.log('='.repeat(80));
      console.log(`📅 Date Range: Last ${daysBack} days (${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]})`);
      
      const topicPapers = [];
      
      // STEP 1: Search PubMed
      console.log(`\n\n📡 STEP 1: Searching PubMed for "${topic}"`);
      console.log("-".repeat(80));
      
      const pubmedSearch = await searchPubMed(topic, daysBack, 10);
      console.log(`✅ Found ${pubmedSearch.count} papers in PubMed`);
      
      if (pubmedSearch.pmids.length > 0) {
        console.log(`📥 Fetching metadata for ${pubmedSearch.pmids.length} PubMed papers...`);
        const pubmedPapers = await fetchPubMedMetadata(pubmedSearch.pmids);
        
        // Add tags to PubMed papers
        pubmedPapers.forEach(paper => {
          paper.tags = ['pubmed', 'research paper', topic];
        });
        
        // Take first 5
        topicPapers.push(...pubmedPapers.slice(0, 5));
        console.log(`✅ Retrieved ${pubmedPapers.slice(0, 5).length} papers from PubMed`);
      }
      
      // STEP 2: Search bioRxiv/medRxiv
      console.log(`\n\n📡 STEP 2: Searching bioRxiv/medRxiv for "${topic}"`);
      console.log("-".repeat(80));
      
      const biorxivPapers = await searchBioRxiv(startDate, now, topic);
      
      // Take first 5
      topicPapers.push(...biorxivPapers.slice(0, 5));
      console.log(`✅ Retrieved ${biorxivPapers.slice(0, 5).length} preprints from bioRxiv/medRxiv`);
      
      // STEP 3: Search Exa
      console.log(`\n\n📡 STEP 3: Searching Exa for "${topic}"`);
      console.log("-".repeat(80));
      console.log("Using: auto search + category filter + includeText filter");
      
      // Adjust Exa query and includeText based on topic
      const exaQueryMap = {
        'phage therapy': {
          query: "phage therapy OR bacteriophage treatment",
          includeText: ["phage therapy"]
        },
        'phage bioinformatics': {
          query: "phage bioinformatics OR bacteriophage genomics OR phage computational analysis",
          includeText: ["phage"]
        },
        'phage-host interactions': {
          query: "phage host interactions OR bacteriophage infection OR phage bacteria interaction",
          includeText: ["phage"]
        },
        'phage biology': {
          query: "phage biology OR bacteriophage lifecycle OR phage replication",
          includeText: ["phage"]
        },
        'phage resistance': {
          query: "phage resistance OR bacteriophage resistance OR bacterial resistance to phages",
          includeText: ["phage"]
        },
        'phage defense': {
          query: "phage defense OR bacterial defense OR CRISPR phage OR restriction modification",
          includeText: ["phage"]
        },
        'phage engineering': {
          query: "phage engineering OR engineered bacteriophage OR synthetic phage",
          includeText: ["phage"]
        },
        'phage-antibiotic synergy': {
          query: "phage antibiotic synergy OR phage antibiotic combination",
          includeText: ["phage"]
        },
        'phageome': {
          query: "phageome OR phage community OR phage diversity",
          includeText: ["phage"]
        },
        'virome': {
          query: "virome OR viral metagenome OR viral community",
          includeText: ["phage"]
        },
        'prophage': {
          query: "prophage OR lysogenic phage OR temperate bacteriophage",
          includeText: ["phage"]
        },
        'phage-immune interactions': {
          query: "phage immune interactions OR bacteriophage immunity",
          includeText: ["phage"]
        }
      };
      
      const exaConfig = exaQueryMap[topic] || { query: "bacteriophage OR phage", includeText: ["phage"] };
      const exaQuery = exaConfig.query;
      const includeText = exaConfig.includeText;
      
      const exaResult = await searchResearchPapers(exaQuery, {
        type: "auto",
        numResults: 30,  // Request more since we'll filter
        startPublishedDate: startDate.toISOString(),
        endPublishedDate: now.toISOString(),
        includeText: includeText,
      });
      
      console.log(`✅ Found ${exaResult.results.length} results from Exa`);
      
      // Filter out collection/index pages
      const filteredResults = exaResult.results.filter(result => {
        const url = result.url.toLowerCase();
        
        if (url.includes('/toc/')) return false;
        if (url.match(/\/journal\/[^/]+\/?$/)) return false;
        if (url.includes('/research-topics/')) return false;
        if (url.includes('/collections/')) return false;
        if (url.includes('/collection/')) return false;
        if (url.includes('/authors')) return false;
        if (url.includes('/latest')) return false;
        if (url.includes('/recent')) return false;
        
        if (url.includes('/article')) return true;
        if (url.includes('/articles/')) return true;
        if (url.includes('/doi/')) return true;
        if (url.match(/\/\d{7,}\/?$/)) return true;
        if (url.match(/\/[a-z0-9-]{10,}/)) return true;
        
        if ((url.includes('biorxiv.org') || url.includes('medrxiv.org') || url.includes('arxiv.org')) 
            && !url.includes('/collection')) {
          return true;
        }
        
        return false;
      });
      
      console.log(`📄 Filtered to ${filteredResults.length} actual paper URLs`);
      
      // Fetch metadata for Exa results
      const exaPapers = [];
      const TARGET_PAPERS = 5;
      console.log(`📄 Fetching metadata (stopping at ${TARGET_PAPERS} valid papers)...`);
      
      for (let i = 0; i < filteredResults.length && exaPapers.length < TARGET_PAPERS; i++) {
        const result = filteredResults[i];
        console.log(`  [${i + 1}/${filteredResults.length}] (collected: ${exaPapers.length}/${TARGET_PAPERS}) ${result.url}`);
        
        const metadata = await fetchAcademicMetadata(result.url);
        
        if (!metadata.error) {
          const title = (metadata.title || result.title || '').toLowerCase();
          const abstract = (metadata.abstract || result.text || '').toLowerCase();
          const text = `${title} ${abstract}`;
          
          // Must have DOI
          if (!metadata.doi) {
            console.log(`     ⏭️  Skipping - no DOI`);
            continue;
          }
          
          // Must have journal information (validates it's a real research paper)
          if (!metadata.journal) {
            console.log(`     ⏭️  Skipping - no journal metadata`);
            continue;
          }
          
          // Topic-specific filtering
          const hasPhage = text.includes('phage') || text.includes('bacteriophage');
          if (!hasPhage) {
            console.log(`     ⏭️  Skipping - no phage content`);
            continue;
          }
          
          // For virome and phageome: must have "phage" in title (to ensure phage-specific)
          if (topic === 'virome' || topic === 'phageome') {
            const hasPhageInTitle = /\bphage\b/i.test(title) || title.includes('bacteriophage');
            if (!hasPhageInTitle) {
              console.log(`     ⏭️  Skipping - ${topic} paper without phage in title`);
              continue;
            }
          }
          
          let isRelevant = false;
          
          switch(topic) {
            case 'phage therapy':
              isRelevant = text.includes('therapy') || text.includes('treatment') || text.includes('therapeutic');
              break;
            
            case 'phage bioinformatics':
              isRelevant = text.includes('bioinformatics') || text.includes('computational') || text.includes('genomic');
              break;
            
            case 'phage-host interactions':
              isRelevant = text.includes('host') || text.includes('infection') || text.includes('interaction');
              break;
            
            case 'phage biology':
              isRelevant = text.includes('biology') || text.includes('lifecycle') || text.includes('life cycle') ||
                         text.includes('replication') || text.includes('morphology');
              break;
            
            case 'phage resistance':
              isRelevant = text.includes('resistance') || text.includes('resistant');
              break;
            
            case 'phage defense':
              isRelevant = text.includes('defense') || text.includes('defence') || text.includes('crispr') ||
                         text.includes('restriction') || text.includes('immunity');
              break;
            
            case 'phage engineering':
              isRelevant = text.includes('engineering') || text.includes('engineered') || text.includes('synthetic') ||
                         text.includes('design') || text.includes('modification');
              break;
            
            case 'phage-antibiotic synergy':
              isRelevant = (text.includes('antibiotic') || text.includes('antimicrobial')) && 
                         (text.includes('synergy') || text.includes('combination') || text.includes('combined'));
              break;
            
            case 'phageome':
              isRelevant = text.includes('phageome') || text.includes('phage community') || text.includes('diversity');
              break;
            
            case 'virome':
              isRelevant = text.includes('virome') || text.includes('viral community') || text.includes('viral metagenome');
              break;
            
            case 'prophage':
              isRelevant = text.includes('prophage') || text.includes('lysogen') || text.includes('lysogenic') ||
                         text.includes('temperate');
              break;
            
            case 'phage-immune interactions':
              isRelevant = text.includes('immune') || text.includes('immunity') || text.includes('immunolog');
              break;
            
            default:
              isRelevant = true;
          }
          
          if (!isRelevant) {
            console.log(`     ⏭️  Skipping - not relevant to ${topic}`);
            continue;
          }
          
          metadata.source = 'exa';
          metadata.exaTitle = result.title;
          metadata.exaPublishedDate = result.publishedDate;
          metadata.tags = ['exa', 'research paper', topic];
          
          exaPapers.push(metadata);
          console.log(`     ✅ Valid paper (${exaPapers.length}/${TARGET_PAPERS})`);
        } else {
          console.log(`     ⚠️  Error: ${metadata.error}`);
        }
        
        // Small delay
        if (i < filteredResults.length - 1 && exaPapers.length < TARGET_PAPERS) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      
      topicPapers.push(...exaPapers);
      console.log(`✅ Retrieved ${exaPapers.length} papers from Exa`);
      
      // Store papers for this topic
      allPapersByTopic[topic] = topicPapers;
      
      console.log(`\n✅ Total papers collected for "${topic}": ${topicPapers.length}`);
    }
    
    // Deduplicate across all papers
    console.log("\n\n🔄 DEDUPLICATING ALL PAPERS");
    console.log("-".repeat(80));
    
    const allPapers = Object.values(allPapersByTopic).flat();
    console.log(`Total papers before deduplication: ${allPapers.length}`);
    
    const uniquePapers = deduplicatePapers(allPapers);
    console.log(`✅ Unique papers after deduplication: ${uniquePapers.length}`);
    console.log(`Duplicates removed: ${allPapers.length - uniquePapers.length}`);
    
    // Display results by topic
    console.log("\n\n📋 RESULTS BY TOPIC");
    console.log("=".repeat(80));
    
    for (const topic of topics) {
      const topicPapers = uniquePapers.filter(p => p.tags && p.tags.includes(topic));
      
      console.log(`\n\n${'='.repeat(80)}`);
      console.log(`📚 TOPIC: "${topic.toUpperCase()}" (${topicPapers.length} papers)`);
      console.log('='.repeat(80));
      
      // Group by source
      const bySource = {
        pubmed: topicPapers.filter(p => p.tags.includes('pubmed')),
        biorxiv: topicPapers.filter(p => p.tags.includes('biorxiv')),
        medrxiv: topicPapers.filter(p => p.tags.includes('medrxiv')),
        exa: topicPapers.filter(p => p.tags.includes('exa'))
      };
      
      for (const [sourceKey, papers] of Object.entries(bySource)) {
        if (papers.length === 0) continue;
        
        const sourceLabel = sourceKey === 'pubmed' ? 'PubMed' : 
                           sourceKey === 'biorxiv' ? 'bioRxiv' :
                           sourceKey === 'medrxiv' ? 'medRxiv' : 'Exa';
        
        console.log(`\n\n📊 From ${sourceLabel} (${papers.length} papers)`);
        console.log("-".repeat(80));
        
        papers.forEach((paper, i) => {
          console.log(`\n${"-".repeat(80)}`);
          console.log(`## Paper ${i + 1}: ${paper.title}`);
          console.log(`${"-".repeat(80)}`);
          console.log(`**Tags:** ${paper.tags.join(', ')}`);
          console.log(`**URL:** ${paper.url}`);
          
          if (paper.pmid) {
            console.log(`**PMID:** ${paper.pmid}`);
          }
          
          if (paper.doi) {
            console.log(`**DOI:** ${paper.doi}`);
          }
          
          if (paper.authors && paper.authors.length > 0) {
            console.log(`\n**Authors (${paper.authors.length}):** ${paper.authors.slice(0, 5).join(', ')}${paper.authors.length > 5 ? ', et al.' : ''}`);
          }
          
          console.log(`**Journal:** ${paper.journal || '[Not found]'}`);
          console.log(`**Date:** ${paper.dateFormatted || paper.exaPublishedDate || paper.date || '[Not found]'}`);
          
          if (paper.abstract) {
            console.log(`\n**Abstract:** ${paper.abstract.substring(0, 300)}${paper.abstract.length > 300 ? '...' : ''}`);
          }
        });
      }
    }
    
    // Summary statistics
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 SUMMARY STATISTICS");
    console.log("=".repeat(80));
    
    console.log(`\nSearch Parameters:`);
    console.log(`  Date range: Last ${daysBack} days`);
    console.log(`  Topics searched: ${topics.join(', ')}`);
    console.log(`  Sources: PubMed + bioRxiv/medRxiv + Exa`);
    console.log(`  Target: ~5 papers per source per topic`);
    
    console.log(`\nResults:`);
    console.log(`  Total unique papers: ${uniquePapers.length}`);
    
    for (const topic of topics) {
      const topicPapers = uniquePapers.filter(p => p.tags && p.tags.includes(topic));
      console.log(`\n  ${topic}:`);
      console.log(`    Total: ${topicPapers.length} papers`);
      console.log(`    - PubMed: ${topicPapers.filter(p => p.tags.includes('pubmed')).length}`);
      console.log(`    - bioRxiv/medRxiv: ${topicPapers.filter(p => p.tags.includes('biorxiv') || p.tags.includes('medrxiv')).length}`);
      console.log(`    - Exa: ${topicPapers.filter(p => p.tags.includes('exa')).length}`);
    }
    
    console.log(`\n  Duplicates removed: ${allPapers.length - uniquePapers.length}`);
    
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
    
    console.log(`\n✅ ADVANTAGES:`);
    console.log(`  🏷️  Tags: Each paper tagged with [source, type, topic]`);
    console.log(`  🎯 Multi-topic: Search multiple topics in one run`);
    console.log(`  📅 7-day window: Focus on very recent publications`);
    console.log(`  🔄 Smart deduplication: Prevents double-counting`);
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    Deno.exit(1);
  }
}

// Get days back from command line or use default
const daysBack = parseInt(Deno.args[0]) || 7;

console.log("\n" + "=".repeat(80));
console.log(`🔬 COMPREHENSIVE MULTI-TOPIC PHAGE RESEARCH SEARCH`);
console.log(`📅 Date Range: Last ${daysBack} days`);
console.log(`🏷️  Topics: 12 phage research areas`);
console.log(`    • phage therapy, phage bioinformatics, phage-host interactions`);
console.log(`    • phage biology, phage resistance, phage defense`);
console.log(`    • phage engineering, phage-antibiotic synergy`);
console.log(`    • phageome, virome, prophage, phage-immune interactions`);
console.log("=".repeat(80) + "\n");

// Run the search
searchMultiTopicPhageResearch(daysBack);

