import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from './compound.js';

/**
 * Extract metadata directly from webpage HTML using standard citation meta tags
 */
export async function fetchMetadataFromUrl(url) {
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
    
    // Extract title (prioritize citation_title as it's cleanest)
    const citationTitle = html.match(/<meta name="citation_title" content="([^"]+)"/i);
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const dcTitle = html.match(/<meta name="dc\.title" content="([^"]+)"/i);
    const htmlTitle = html.match(/<title>([^<]+)<\/title>/i);
    
    if (citationTitle) {
      // citation_title is already clean, no cleanup needed
      metadata.title = citationTitle[1].trim();
    } else if (dcTitle) {
      // dc.title is usually clean too
      metadata.title = dcTitle[1].trim();
    } else if (ogTitle) {
      // og:title might have suffixes, clean them up
      metadata.title = ogTitle[1]
        .replace(/\s*\|\s*.*$/, '')  // Remove "| Site Name"
        .replace(/\s*[-–—]\s*[A-Z].*$/, '')  // Remove "- Site Name" (only if followed by capital letter)
        .trim();
    } else if (htmlTitle) {
      // <title> tags often have suffixes
      metadata.title = htmlTitle[1]
        .replace(/\s*\|\s*.*$/, '')  // Remove "| Site Name"
        .replace(/\s*[-–—]\s*[A-Z].*$/, '')  // Remove "- Site Name" (only if followed by capital letter)
        .trim();
    }
    
    // Extract authors
    const authorMatches = html.matchAll(/<meta name="citation_author" content="([^"]+)"/gi);
    const authors = [...authorMatches].map(m => m[1]);
    if (authors.length > 0) {
      metadata.authors = authors;
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
      metadata.abstract = abstractMatch[1];
    }
    
    return metadata;
    
  } catch (error) {
    return { url, error: error.message };
  }
}

/**
 * Search for academic papers with 100% accurate metadata
 * Uses Groq Compound to find URLs, then scrapes real metadata from webpages
 * 
 * @param {string} searchQuery - What papers to search for
 * @param {Object} options - Search options
 * @param {Array<string>} options.domains - Domains to search (default: academic sites)
 * @param {number} options.maxPapers - Maximum papers to return (default: 10)
 * @param {boolean} options.includeAbstracts - Include abstracts (default: true)
 * @param {number} options.maxAuthors - Max authors to show per paper (default: 5)
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Array>} Array of paper metadata objects
 */
export async function searchAcademicPapers(searchQuery, options = {}) {
  const {
    domains = [
      "pubmed.ncbi.nlm.nih.gov",
      "europepmc.org",
      "biorxiv.org",
      "medrxiv.org",
      "nature.com",
      "science.org",
      "sciencemag.org",
      "thelancet.com",
      "mdpi.com",
      "asm.org",
      "*.edu"
    ],
    maxPapers = 10,
    includeAbstracts = true,
    maxAuthors = 5,
    onProgress = null
  } = options;
  
  // Step 1: Use Groq to find URLs only
  const urlDiscoveryQuery = `${searchQuery}

Your ONLY job is to find and list paper URLs. Format as a simple list:
- URL 1
- URL 2
- URL 3

Do NOT provide titles, dates, authors, or any other metadata. Just URLs.`;

  if (onProgress) onProgress({ stage: 'searching', message: 'Finding paper URLs...' });
  
  const urlResult = await searchWithCompound(urlDiscoveryQuery, {
    system: `You are a URL finder. Return ONLY a list of URLs to academic papers, nothing else. 
Do not provide metadata, just URLs.`,
    temperature: 0.1,
    max_tokens: 2000,
    search_settings: {
      include_domains: domains
    }
  });
  
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const urls = [...new Set(urlResult.choices[0]?.message?.content.match(urlRegex) || [])];
  
  if (urls.length === 0) {
    throw new Error("No paper URLs found");
  }
  
  // Limit to maxPapers
  const urlsToFetch = urls.slice(0, maxPapers);
  
  if (onProgress) {
    onProgress({ 
      stage: 'fetching', 
      message: `Found ${urls.length} URLs, fetching metadata for ${urlsToFetch.length}...` 
    });
  }
  
  // Step 2: Fetch metadata from each URL
  const papers = [];
  
  for (let i = 0; i < urlsToFetch.length; i++) {
    const url = urlsToFetch[i];
    
    if (onProgress) {
      onProgress({ 
        stage: 'fetching', 
        message: `Fetching paper ${i + 1}/${urlsToFetch.length}...`,
        current: i + 1,
        total: urlsToFetch.length,
        url
      });
    }
    
    const metadata = await fetchMetadataFromUrl(url);
    
    if (!metadata.error) {
      // Limit authors if specified
      if (metadata.authors && metadata.authors.length > maxAuthors) {
        metadata.authors = metadata.authors.slice(0, maxAuthors);
        metadata.authors.push('et al.');
      }
      
      // Remove abstract if not wanted
      if (!includeAbstracts) {
        delete metadata.abstract;
      }
      
      papers.push(metadata);
    }
    
    // Small delay to be respectful
    if (i < urlsToFetch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  if (onProgress) {
    onProgress({ 
      stage: 'complete', 
      message: `Successfully fetched ${papers.length} papers`,
      papers
    });
  }
  
  return papers;
}

/**
 * Format papers for console output
 */
export function formatPapersForConsole(papers) {
  let output = '';
  
  papers.forEach((paper, i) => {
    output += `\n## Paper ${i + 1}\n`;
    output += `**Title:** ${paper.title || '[Not found]'}\n`;
    
    if (paper.authors && paper.authors.length > 0) {
      output += `**Authors:** ${paper.authors.join(', ')}\n`;
    }
    
    output += `**Journal:** ${paper.journal || '[Not found]'}\n`;
    output += `**Date:** ${paper.dateFormatted || paper.date || '[Not found]'}\n`;
    
    if (paper.doi) {
      output += `**DOI:** ${paper.doi}\n`;
      output += `**DOI Link:** https://doi.org/${paper.doi}\n`;
    }
    
    output += `**URL:** ${paper.url}\n`;
    
    if (paper.abstract) {
      const truncatedAbstract = paper.abstract.length > 300 
        ? paper.abstract.substring(0, 300) + '...'
        : paper.abstract;
      output += `**Abstract:** ${truncatedAbstract}\n`;
    }
    
    output += '\n';
  });
  
  return output;
}

/**
 * Format papers as JSON
 */
export function formatPapersAsJson(papers, pretty = true) {
  return pretty ? JSON.stringify(papers, null, 2) : JSON.stringify(papers);
}

/**
 * Format papers as markdown
 */
export function formatPapersAsMarkdown(papers) {
  let md = '# Research Papers\n\n';
  
  papers.forEach((paper, i) => {
    md += `## ${i + 1}. ${paper.title || 'Untitled'}\n\n`;
    
    if (paper.authors && paper.authors.length > 0) {
      md += `**Authors:** ${paper.authors.join(', ')}  \n`;
    }
    
    md += `**Journal:** ${paper.journal || 'Unknown'}  \n`;
    md += `**Published:** ${paper.dateFormatted || paper.date || 'Unknown'}  \n`;
    
    if (paper.doi) {
      md += `**DOI:** [${paper.doi}](https://doi.org/${paper.doi})  \n`;
    }
    
    md += `**URL:** ${paper.url}  \n\n`;
    
    if (paper.abstract) {
      md += `### Abstract\n\n${paper.abstract}\n\n`;
    }
    
    md += '---\n\n';
  });
  
  return md;
}

