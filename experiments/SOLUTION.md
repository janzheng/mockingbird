# Solution: 100% Accurate Paper Metadata

## The Problem

When using LLMs (including Groq Compound) to search for academic papers, they often:
- Return truncated or simplified titles
- Provide incorrect or missing publication dates
- Get journal names wrong
- Make up or misremember metadata

Even when the URLs are correct, the metadata about those papers can be hallucinated.

## The Solution: Two-Step Approach

### Step 1: Use LLM for URL Discovery Only
Use Groq Compound's excellent web search capability to **find URLs** of relevant papers.

```javascript
const query = "Find URLs of phage therapy papers published in October 2025";
const result = await searchWithCompound(query, {
  system: "Return ONLY URLs, no metadata",
  search_settings: {
    include_domains: ["nature.com", "pubmed.ncbi.nlm.nih.gov", "mdpi.com"]
  }
});
```

### Step 2: Fetch Real Metadata from Webpages
Directly scrape the actual HTML of each paper's webpage to extract metadata from standardized meta tags.

```javascript
const html = await fetch(url).then(r => r.text());

// Extract from standard citation meta tags
const title = html.match(/<meta name="citation_title" content="([^"]+)"/)[1];
const date = html.match(/<meta name="citation_publication_date" content="([^"]+)"/)[1];
const journal = html.match(/<meta name="citation_journal_title" content="([^"]+)"/)[1];
const doi = html.match(/<meta name="citation_doi" content="([^"]+)"/)[1];
```

## Why This Works

### Academic journals use standardized meta tags:
- `citation_title` - Full paper title
- `citation_author` - Author names (can appear multiple times)
- `citation_publication_date` - Publication date
- `citation_journal_title` - Journal name
- `citation_doi` - DOI
- `citation_abstract` - Abstract
- Plus Dublin Core (`dc.title`, `dc.date`, etc.) and Open Graph alternatives

### These tags are:
- ✅ **Standardized** across most academic publishers
- ✅ **Structured** and machine-readable
- ✅ **Accurate** (maintained by publishers)
- ✅ **Complete** (full titles, all authors, etc.)

## Comparison

### Approach 1: LLM Extracts Everything ❌

```
Query: "Find phage therapy papers with titles, dates, journals"
Result: URLs ✅ + Metadata ⚠️ (may be wrong/incomplete)
```

**Issues:**
- Titles may be truncated
- Dates can be wrong or reformatted incorrectly  
- Journals may be missing or incorrect
- No authors
- No abstracts
- Hallucination risk

### Approach 2: LLM Finds URLs, Scraper Gets Metadata ✅

```
Step 1: "Find URLs of phage therapy papers"
Step 2: Fetch each URL and parse HTML meta tags
Result: URLs ✅ + Metadata ✅ (100% accurate from source)
```

**Benefits:**
- Full, untruncated titles
- Accurate publication dates
- Correct journal names
- All authors listed
- Abstracts included
- DOIs verified
- Zero hallucination risk for metadata

## Real Example

### Paper: Antibiotics Paper on MDPI

**URL:** https://www.mdpi.com/2079-6382/14/10/1040

#### What Groq Compound Returned (Approach 1):
```
Title: Phage Therapy as a Novel Alternative to Antibiotics
Date: 17 October 2025
Journal: Antibiotics
Authors: [Not shown]
Abstract: [Not shown]
```

#### What Direct Scraping Found (Approach 2):
```
Title: Phage Therapy as a Novel Alternative to Antibiotics Through 
       Adaptive Evolution and Fitness Trade-Offs
Date: October 2025
Journal: Antibiotics
Authors: Zhang, Song, Ahn, Juhee
DOI: 10.3390/antibiotics14101040
Abstract: The rapid emergence of antibiotic-resistant bacteria requires 
          solutions that extend beyond conventional antibiotics. 
          Bacteriophages (phages) provide targeted antibacterial 
          action but face two key limitations...
```

**Difference:** Complete title (second half was missing), authors added, abstract added, DOI added.

## Implementation

The current experiments implement this approach for academic paper searches:

### Triple Hybrid Search
```bash
deno task ex:triple-hybrid
```

Combines three sources (PubMed, bioRxiv/medRxiv, Exa) and uses direct metadata extraction:
- PubMed: Structured API with verified metadata
- bioRxiv/medRxiv: Direct API with complete metadata
- Exa: Finds URLs, then scrapes metadata from HTML

### Multi-Topic Search
```bash
deno task ex:multi-topic
```

Searches 12 phage topics across all three sources, using the same metadata extraction approach.

### What they do:
1. Search for papers using APIs or Exa (for URL discovery)
2. For Exa results:
   - Fetches each paper's HTML
   - Parses `citation_*` meta tags
   - Extracts authors, title, date, journal, DOI, abstract
3. For PubMed/bioRxiv: Uses their structured APIs directly
4. Smart deduplication by DOI and title similarity
5. Displays complete, accurate results organized by source

### Benefits:
- PubMed/bioRxiv provide structured metadata directly (no scraping needed)
- Exa URLs scraped for 100% accurate metadata
- Much lower hallucination risk
- Complete metadata (titles, authors, dates, abstracts, DOIs)

## Adapting for Other Use Cases

This approach works for ANY academic paper search:

```javascript
// Search for machine learning papers
"Find URLs of machine learning papers from NeurIPS 2024"

// Search for medical research  
"Find URLs of COVID-19 vaccine research from Nature Medicine"

// Search for climate science
"Find URLs of climate change papers published in Science"
```

Then scrape the same meta tags - they're standardized across publishers.

## Limitations

### When this approach won't work:
- Papers behind paywalls (may block scraping)
- Very old papers (may not have meta tags)
- Preprints on personal sites (inconsistent metadata)
- Non-academic sources (blogs, news, etc.)

### Fallback strategies:
- Use multiple meta tag formats (citation, Dublin Core, Open Graph)
- Try PubMed API for biomedical papers
- Use CrossRef API with DOI
- Parse visible HTML as last resort

## Best Practices

1. **Always use domain restrictions** for Groq search
   ```javascript
   search_settings: {
     include_domains: ["nature.com", "science.org", "*.edu"]
   }
   ```

2. **Be respectful when scraping**
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
   ```

3. **Handle errors gracefully**
   ```javascript
   if (metadata.error) {
     console.log(`Failed: ${metadata.error}`);
     continue;
   }
   ```

4. **Extract multiple authors**
   ```javascript
   const authorMatches = html.matchAll(/<meta name="citation_author" content="([^"]+)"/gi);
   const authors = [...authorMatches].map(m => m[1]);
   ```

5. **Format dates nicely**
   ```javascript
   if (date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
     // Convert 2025/10/16 to "16 Oct 2025"
   }
   ```

## Conclusion

For academic paper searches where accuracy matters:

1. ✅ Use LLM for **URL discovery** (it's good at this)
2. ✅ Use **web scraping** for metadata (100% accurate)
3. ❌ Don't trust LLM for paper metadata (hallucination risk)

This two-step approach gives you the best of both worlds: powerful search capabilities + guaranteed accuracy.

