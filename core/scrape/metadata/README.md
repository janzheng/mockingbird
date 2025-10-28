# HTML Metadata Extractor

Extract metadata directly from webpages without relying on external APIs or LLMs.

## Features

- **Academic Papers**: Extracts citation metadata (title, authors, DOI, journal, abstract)
- **Social Media**: Extracts Open Graph and Twitter Card metadata (title, content, author, images)
- **Auto-detection**: Automatically detects the type of URL and uses appropriate extractor

## Usage

```javascript
import { fetchMetadataFromUrl, fetchAcademicMetadata, fetchSocialMetadata } from '../core/scrape/index.js';

// Auto-detect URL type and fetch metadata
const metadata = await fetchMetadataFromUrl('https://pubmed.ncbi.nlm.nih.gov/12345678/');

// Explicitly fetch academic metadata
const paper = await fetchAcademicMetadata('https://www.nature.com/articles/s41586-024-12345-6');

// Explicitly fetch social metadata
const tweet = await fetchSocialMetadata('https://twitter.com/username/status/123456789', 'twitter');
```

## Academic Metadata

Extracts the following fields from academic papers:

- `title` - Paper title (from citation_title meta tag)
- `authors` - Array of author names (first 5 + "et al." if more)
- `date` - Publication date (raw format)
- `dateFormatted` - Publication date (formatted as "DD Mon YYYY")
- `journal` - Journal name
- `doi` - Digital Object Identifier
- `abstract` - First 300 characters of abstract
- `url` - The URL that was fetched
- `type` - "academic"

### Supported Meta Tags

- `citation_title`, `og:title`, `dc.title`, `<title>`
- `citation_author` (multiple)
- `citation_publication_date`, `citation_online_date`, `article:published_time`, `dc.date`
- `citation_journal_title`, `citation_journal_abbrev`, `og:site_name`, `dc.publisher`
- `citation_doi`, `dc.identifier`
- `citation_abstract`, `dc.description`, `og:description`

## Social Media Metadata

Extracts the following fields from social media posts:

- `title` - Post title/headline
- `content` - Post content/description (first 300 characters)
- `author` - Creator/author handle
- `date` - Publication date (formatted)
- `image` - Featured image URL
- `url` - The URL that was fetched
- `type` - "twitter" or "linkedin"

### Supported Platforms

- Twitter/X (twitter.com, x.com)
- LinkedIn (linkedin.com)

### Supported Meta Tags

- `og:title`, `twitter:title`, `<title>`
- `og:description`, `twitter:description`, `description`
- `twitter:creator`, `twitter:site`, `author`
- `article:published_time`, `og:updated_time`
- `og:image`, `twitter:image`

## URL Type Detection

```javascript
import { detectUrlType } from '../core/scrape/index.js';

detectUrlType('https://pubmed.ncbi.nlm.nih.gov/12345678/'); // "academic"
detectUrlType('https://twitter.com/user/status/123'); // "twitter"
detectUrlType('https://linkedin.com/posts/user-123'); // "linkedin"
```

## Error Handling

All functions return an object with an `error` field if something goes wrong:

```javascript
const metadata = await fetchAcademicMetadata('https://broken-url.com');

if (metadata.error) {
  console.log(`Error: ${metadata.error}`);
  // Could be: "HTTP 404", "HTTP 403", "Timeout", etc.
}
```

## Examples

### Academic Paper from PubMed

```javascript
const paper = await fetchAcademicMetadata('https://pubmed.ncbi.nlm.nih.gov/39307533/');

console.log(paper.title);
// "Bacteriophages as Antimicrobial Agents"

console.log(paper.authors);
// ["Smith, J", "Jones, A", "Brown, K", "et al."]

console.log(paper.journal);
// "Nature Medicine"

console.log(paper.doi);
// "10.1038/s41591-024-12345-6"
```

### Twitter Post

```javascript
const tweet = await fetchMetadataFromUrl('https://twitter.com/scientist/status/123456');

console.log(tweet.title);
// "Exciting breakthrough in phage therapy!"

console.log(tweet.author);
// "@scientist"

console.log(tweet.content);
// "Just published our latest research on bacteriophages..."
```

## Implementation Details

- Uses native `fetch()` with 10-second timeout
- Sets User-Agent to mimic a real browser
- Parses HTML using regex (no DOM parser needed)
- Returns structured data (never hallucinates or interprets)
- Respects rate limits (add delays between requests)

## Best Practices

1. **Add delays** between requests to avoid rate limiting:
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 500));
   ```

2. **Handle errors gracefully**:
   ```javascript
   if (metadata.error) {
     console.log(`Skipping ${url}: ${metadata.error}`);
     continue;
   }
   ```

3. **Check for missing fields**:
   ```javascript
   console.log(`Title: ${paper.title || '[Not found]'}`);
   ```

4. **Use appropriate function**:
   - Use `fetchAcademicMetadata()` when you know it's a paper
   - Use `fetchSocialMetadata()` when you know it's social media
   - Use `fetchMetadataFromUrl()` when you're not sure

