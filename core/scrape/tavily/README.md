# Tavily Extract

> Extract web page content from one or more specified URLs using Tavily Extract.

## Features

- Extract clean content from any web page
- Support for single URL or batch extraction (up to 20 URLs)
- Basic and advanced extraction modes
- Output in markdown or plain text format
- Optional image and favicon extraction
- Configurable timeout settings

## Usage

### Basic Extraction

```javascript
import { extractWithTavily } from './tavily-extract.js';

// Extract from a single URL
const result = await extractWithTavily("https://en.wikipedia.org/wiki/Artificial_intelligence");

// Extract from multiple URLs
const multiResults = await extractWithTavily([
  "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "https://en.wikipedia.org/wiki/Machine_learning",
  "https://en.wikipedia.org/wiki/Data_science"
]);
```

### Extract Single URL

```javascript
import { extractSingleUrl } from './tavily-extract.js';

const page = await extractSingleUrl("https://example.com");
console.log(page.rawContent); // Extracted content (camelCase)
```

### Advanced Extraction

Advanced extraction retrieves more data including tables and embedded content:

```javascript
import { extractAdvanced } from './tavily-extract.js';

const result = await extractAdvanced("https://example.com/article");
```

### Extract with Images

```javascript
import { extractWithImages } from './tavily-extract.js';

const result = await extractWithImages("https://example.com");
console.log(result.results[0].images); // Array of image URLs
console.log(result.results[0].favicon); // Favicon URL
```

### Extract as Plain Text

```javascript
import { extractAsText } from './tavily-extract.js';

const result = await extractAsText("https://example.com");
// Content will be in plain text format instead of markdown
```

### Batch Extraction

```javascript
import { batchExtract } from './tavily-extract.js';

const urls = [
  "https://example.com/page1",
  "https://example.com/page2",
  "https://example.com/page3"
];

const result = await batchExtract(urls);
// Process successful extractions
result.results.forEach(page => {
  console.log(page.url);
  console.log(page.rawContent); // camelCase
});

// Handle failures
result.failedResults.forEach(failure => { // camelCase
  console.log(`Failed: ${failure.url} - ${failure.error}`);
});
```

## API Functions

### `extractWithTavily(urls, options)`

Main extraction function that supports all options.

**Parameters:**
- `urls` (string|Array<string>): Single URL or array of URLs (max 20)
- `options` (Object):
  - `includeImages` (boolean): Include images in results (default: false)
  - `includeFavicon` (boolean): Include favicon URL (default: false)
  - `extractDepth` (string): "basic" or "advanced" (default: "basic")
  - `format` (string): "markdown" or "text" (default: "markdown")
  - `timeout` (number): Max wait time in seconds (1.0-60.0)

**Returns:** Promise<Object> with:
- `results`: Array of successful extractions
- `failedResults`: Array of failed extractions (camelCase)
- `responseTime`: Time taken in seconds (camelCase)
- `requestId`: Unique request identifier (camelCase)

### `extractSingleUrl(url, options)`

Extract content from a single URL and return just the result object.

### `extractRawContent(urls, options)`

Extract and return just the results array (no metadata).

### `extractAdvanced(urls, options)`

Extract with advanced depth for more comprehensive results.

### `extractAsText(urls, options)`

Extract content as plain text instead of markdown.

### `extractWithImages(urls, options)`

Extract content with images and favicon included.

### `batchExtract(urls, options)`

Extract from multiple URLs (enforces array input and max 20 URLs).

## Important Notes

**API Parameter Format**: The Tavily SDK's `extract()` method expects URLs and options as separate parameters:
```javascript
tvly.extract(urlsArray, optionsObject)
```
Not as a single combined object. The wrapper functions in this module handle this correctly.

**Response Format**: The SDK returns camelCase properties (`rawContent`, `failedResults`, etc.) rather than snake_case.

## Response Format

The Tavily SDK returns camelCase properties:

```javascript
{
  results: [
    {
      url: "https://example.com",
      rawContent: "# Page Title\n\nPage content...",  // camelCase
      images: ["https://example.com/image1.jpg"],      // if includeImages: true
      favicon: "https://example.com/favicon.ico"       // if includeFavicon: true
    }
  ],
  failedResults: [                                     // camelCase
    {
      url: "https://failed-example.com",
      error: "Timeout error"
    }
  ],
  responseTime: 0.02,                                  // camelCase
  requestId: "123e4567-e89b-12d3-a456-426614174111"   // camelCase
}
```

## Extraction Modes

### Basic Extraction
- Default mode
- Faster response time
- Costs 1 credit per 5 successful URL extractions
- Good for most use cases

### Advanced Extraction
- Retrieves more comprehensive data
- Includes tables and embedded content
- Higher success rate on complex pages
- Costs 2 credits per 5 successful URL extractions
- May have higher latency

## Format Options

### Markdown (Default)
- Returns content in markdown format
- Preserves document structure
- Good for further processing

### Text
- Returns plain text
- May increase latency
- Good for simple text analysis

## Testing

Run the test script to extract content from URLs:

```bash
# Extract from a single URL
deno task search:tavily-extract "https://en.wikipedia.org/wiki/Artificial_intelligence"

# Extract from multiple URLs
deno task search:tavily-extract "https://example.com/page1" "https://example.com/page2"

# Use advanced extraction
deno task search:tavily-extract --advanced "https://example.com/complex-page"

# Include images
deno task search:tavily-extract --images "https://example.com"

# Extract as plain text
deno task search:tavily-extract --text "https://example.com"

# Combine options
deno task search:tavily-extract --advanced --images "https://example.com"
```

## Error Handling

The API may return the following errors:

- **400 Bad Request**: Invalid parameters (e.g., more than 20 URLs)
- **401 Unauthorized**: Missing or invalid API key
- **429 Too Many Requests**: Rate limit exceeded
- **432 Key/Plan Limit Exceeded**: Usage limit reached
- **433 PayGo Limit Exceeded**: Pay-as-you-go limit reached
- **500 Internal Server Error**: Server-side error

## Environment Variables

Set your Tavily API key:

```bash
TAVILY_API_KEY=tvly-YOUR_API_KEY
```

## Credits and Pricing

- **Basic extraction**: 1 credit per 5 successful URL extractions
- **Advanced extraction**: 2 credits per 5 successful URL extractions
- Maximum 20 URLs per request
- Failed extractions do not consume credits

## Best Practices

1. Use basic extraction for simple content pages
2. Use advanced extraction for complex pages with tables/embedded content
3. Batch multiple URLs together when possible (up to 20)
4. Handle failed_results to ensure robustness
5. Set appropriate timeout values for your use case
6. Only request images when needed to reduce response size

