/**
 * HTML Metadata Extractor
 * 
 * Extracts metadata from webpages including:
 * - Academic papers (citation metadata, DOI, authors, journal, etc.)
 * - Social media posts (Open Graph, Twitter Cards, etc.)
 * 
 * @module scrape/metadata
 */

/**
 * Detect the type of URL (academic paper vs social media)
 * 
 * @param {string} url - The URL to analyze
 * @returns {string} - 'academic', 'twitter', or 'linkedin'
 */
export function detectUrlType(url) {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'academic';
}

/**
 * Extract metadata from academic papers
 * Looks for citation metadata tags commonly used by publishers
 * 
 * @param {string} url - The URL to fetch
 * @returns {Promise<Object>} Metadata object with title, authors, date, journal, DOI, abstract
 */
export async function fetchAcademicMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return { url, type: 'academic', error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    const metadata = { url, type: 'academic' };
    
    // Extract title (prioritize citation_title as it's cleanest)
    const citationTitle = html.match(/<meta name="citation_title" content="([^"]+)"/i);
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const dcTitle = html.match(/<meta name="dc\.title" content="([^"]+)"/i);
    const htmlTitle = html.match(/<title>([^<]+)<\/title>/i);
    
    if (citationTitle) {
      metadata.title = citationTitle[1].trim();
    } else if (dcTitle) {
      metadata.title = dcTitle[1].trim();
    } else if (ogTitle) {
      metadata.title = ogTitle[1]
        .replace(/\s*\|\s*.*$/, '')
        .replace(/\s*[-–—]\s*[A-Z].*$/, '')
        .trim();
    } else if (htmlTitle) {
      metadata.title = htmlTitle[1]
        .replace(/\s*\|\s*.*$/, '')
        .replace(/\s*[-–—]\s*[A-Z].*$/, '')
        .trim();
    }
    
    // Extract authors - try multiple sources
    let authors = [];
    
    // Try citation_author meta tags first (most reliable)
    const authorMatches = html.matchAll(/<meta name="citation_author" content="([^"]+)"/gi);
    authors = [...authorMatches].map(m => m[1]);
    
    // If no citation_author, try JSON-LD structured data
    if (authors.length === 0) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/is);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          // Handle both single object and array
          const data = Array.isArray(jsonLd) ? jsonLd[0] : jsonLd;
          
          if (data.author) {
            if (Array.isArray(data.author)) {
              authors = data.author.map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
            } else if (typeof data.author === 'object' && data.author.name) {
              authors = [data.author.name];
            } else if (typeof data.author === 'string') {
              authors = [data.author];
            }
          }
        } catch (e) {
          // JSON-LD parsing failed, continue without it
        }
      }
    }
    
    // If still no authors, try dc.creator
    if (authors.length === 0) {
      const dcCreatorMatches = html.matchAll(/<meta name="dc\.creator" content="([^"]+)"/gi);
      authors = [...dcCreatorMatches].map(m => m[1]);
    }
    
    // If still no authors, try looking in the HTML for author names
    if (authors.length === 0) {
      const articleAuthorMatch = html.match(/<meta name="article:author" content="([^"]+)"/i);
      if (articleAuthorMatch) {
        authors = [articleAuthorMatch[1]];
      }
    }
    
    if (authors.length > 0) {
      metadata.authors = authors.slice(0, 5);
      if (authors.length > 5) metadata.authors.push('et al.');
    }
    
    // Extract publication date - try multiple sources and formats
    let dateString = null;
    
    // Try citation dates first
    const citationDateMatch = html.match(/<meta name="citation_publication_date" content="([^"]+)"/i) ||
                              html.match(/<meta name="citation_online_date" content="([^"]+)"/i);
    if (citationDateMatch) {
      dateString = citationDateMatch[1];
    }
    
    // Try article:published_time (often has full ISO date)
    if (!dateString) {
      const publishedTimeMatch = html.match(/<meta property="article:published_time" content="([^"]+)"/i);
      if (publishedTimeMatch) {
        dateString = publishedTimeMatch[1];
      }
    }
    
    // Try dc.date
    if (!dateString) {
      const dcDateMatch = html.match(/<meta name="dc\.date" content="([^"]+)"/i);
      if (dcDateMatch) {
        dateString = dcDateMatch[1];
      }
    }
    
    // Try JSON-LD structured data
    if (!dateString) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/is);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          const data = Array.isArray(jsonLd) ? jsonLd[0] : jsonLd;
          dateString = data.datePublished || data.dateCreated || data.dateModified;
        } catch (e) {
          // JSON-LD parsing failed, continue without it
        }
      }
    }
    
    if (dateString) {
      metadata.date = dateString;
      
      // Parse and format the date
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Try different date formats
      // Format: YYYY/MM/DD or YYYY-MM-DD
      if (dateString.match(/^\d{4}[\/\-]\d{2}[\/\-]\d{2}/)) {
        const parts = dateString.split(/[\/\-]/);
        const year = parts[0];
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        metadata.dateFormatted = `${day} ${monthNames[month - 1]} ${year}`;
        metadata.year = year;
        metadata.month = monthNames[month - 1];
        metadata.day = day;
      }
      // Format: YYYY/MM or YYYY-MM (no day)
      else if (dateString.match(/^\d{4}[\/\-]\d{2}$/)) {
        const parts = dateString.split(/[\/\-]/);
        const year = parts[0];
        const month = parseInt(parts[1]);
        metadata.dateFormatted = `${monthNames[month - 1]} ${year}`;
        metadata.year = year;
        metadata.month = monthNames[month - 1];
        // Note: day is missing
      }
      // Format: ISO 8601 (e.g., 2024-10-15T10:30:00Z)
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        metadata.dateFormatted = `${day} ${monthNames[month]} ${year}`;
        metadata.year = year.toString();
        metadata.month = monthNames[month];
        metadata.day = day;
      }
      // Format: Just year (YYYY)
      else if (dateString.match(/^\d{4}$/)) {
        metadata.dateFormatted = dateString;
        metadata.year = dateString;
        // Note: month and day are missing
      }
      // Unrecognized format - just use as-is
      else {
        metadata.dateFormatted = dateString;
        // Try to extract year at least
        const yearMatch = dateString.match(/\d{4}/);
        if (yearMatch) {
          metadata.year = yearMatch[0];
        }
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
      metadata.abstract = abstractMatch[1].substring(0, 300);
      if (abstractMatch[1].length > 300) metadata.abstract += '...';
    }
    
    return metadata;
    
  } catch (error) {
    return { url, type: 'academic', error: error.message };
  }
}

/**
 * Extract metadata from social media posts (Twitter/LinkedIn)
 * Looks for Open Graph and Twitter Card metadata
 * 
 * @param {string} url - The URL to fetch
 * @param {string} type - The type of social media ('twitter' or 'linkedin')
 * @returns {Promise<Object>} Metadata object with title, content, author, date, image
 */
export async function fetchSocialMetadata(url, type) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return { url, type, error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    const metadata = { url, type };
    
    // Extract title/headline
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const twitterTitle = html.match(/<meta name="twitter:title" content="([^"]+)"/i);
    const htmlTitle = html.match(/<title>([^<]+)<\/title>/i);
    
    if (ogTitle) {
      metadata.title = ogTitle[1].trim();
    } else if (twitterTitle) {
      metadata.title = twitterTitle[1].trim();
    } else if (htmlTitle) {
      metadata.title = htmlTitle[1].trim();
    }
    
    // Extract description/content
    const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/i);
    const twitterDescription = html.match(/<meta name="twitter:description" content="([^"]+)"/i);
    const metaDescription = html.match(/<meta name="description" content="([^"]+)"/i);
    
    if (ogDescription) {
      metadata.content = ogDescription[1].substring(0, 300);
      if (ogDescription[1].length > 300) metadata.content += '...';
    } else if (twitterDescription) {
      metadata.content = twitterDescription[1].substring(0, 300);
      if (twitterDescription[1].length > 300) metadata.content += '...';
    } else if (metaDescription) {
      metadata.content = metaDescription[1].substring(0, 300);
      if (metaDescription[1].length > 300) metadata.content += '...';
    }
    
    // Extract author/creator
    const twitterCreator = html.match(/<meta name="twitter:creator" content="([^"]+)"/i);
    const twitterSite = html.match(/<meta name="twitter:site" content="([^"]+)"/i);
    const authorMatch = html.match(/<meta name="author" content="([^"]+)"/i);
    
    if (twitterCreator) {
      metadata.author = twitterCreator[1];
    } else if (twitterSite) {
      metadata.author = twitterSite[1];
    } else if (authorMatch) {
      metadata.author = authorMatch[1];
    }
    
    // Extract publication date
    const publishedTime = html.match(/<meta property="article:published_time" content="([^"]+)"/i);
    const ogPublished = html.match(/<meta property="og:updated_time" content="([^"]+)"/i);
    
    if (publishedTime) {
      metadata.date = new Date(publishedTime[1]).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (ogPublished) {
      metadata.date = new Date(ogPublished[1]).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Extract image
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const twitterImage = html.match(/<meta name="twitter:image" content="([^"]+)"/i);
    
    if (ogImage) {
      metadata.image = ogImage[1];
    } else if (twitterImage) {
      metadata.image = twitterImage[1];
    }
    
    return metadata;
    
  } catch (error) {
    return { url, type, error: error.message };
  }
}

/**
 * Fetch metadata from a URL (automatically detects type)
 * 
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<Object>} Metadata object appropriate for the URL type
 */
export async function fetchMetadataFromUrl(url) {
  const urlType = detectUrlType(url);
  
  if (urlType === 'academic') {
    return await fetchAcademicMetadata(url);
  } else {
    return await fetchSocialMetadata(url, urlType);
  }
}

