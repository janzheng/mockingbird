# Groq Compound Search with Date Filtering

An enhanced version of the Groq Compound search that supports date range filtering for finding papers and articles published within specific timeframes.

## Overview

This module extends the standard Groq Compound search with built-in date filtering capabilities. It automatically adds date range instructions to both the system prompt and user query, ensuring the model restricts search results to the specified time period.

## Key Features

- ✅ **Date Range Filtering**: Search for content published within specific date ranges
- ✅ **ISO Date Format**: Uses YYYY-MM-DD format to avoid ambiguity
- ✅ **Flexible Date Input**: Accepts both Date objects and ISO strings
- ✅ **Automatic Tool Selection**: Sets `tool_choice: "auto"` when dates are provided
- ✅ **Helper Functions**: Convenient functions for common use cases
- ✅ **Backward Compatible**: Works with or without date filtering

## Installation

```javascript
import {
  searchWithCompoundDated,
  searchCompoundDatedText,
  searchPapersWithDateRange,
  searchRecentPapers,
} from "./compound-dated.js";
```

## Usage Examples

### 1. Search Papers in a Specific Date Range

```javascript
// Search for papers published between two dates
const result = await searchPapersWithDateRange(
  "CRISPR gene editing advances",
  "2023-01-01",
  "2024-12-31"
);

console.log(result.choices[0].message.content);
```

### 2. Search Recent Papers

```javascript
// Search papers from the last 6 months
const result = await searchRecentPapers(
  "phage therapy clinical trials",
  6,
  "months"
);

// Search papers from the last 2 years
const result2 = await searchRecentPapers(
  "mRNA vaccine technology",
  2,
  "years"
);
```

### 3. Simple Text Search with Dates

```javascript
// Get just the text content with date filtering
const text = await searchCompoundDatedText(
  "Latest advances in bacteriophage resistance",
  {
    startDate: "2024-01-01",
    endDate: "2024-10-26",
    temperature: 0.2,
    max_tokens: 1500,
  }
);

console.log(text);
```

### 4. Search with Only Start or End Date

```javascript
// Papers published after January 2024
const recentPapers = await searchCompoundDatedText(
  "antimicrobial resistance solutions",
  {
    startDate: "2024-01-01",
    temperature: 0.2,
  }
);

// Papers published before December 2023
const olderPapers = await searchCompoundDatedText(
  "COVID-19 vaccine development",
  {
    endDate: "2023-12-31",
    temperature: 0.2,
  }
);
```

### 5. Custom Search with Advanced Options

```javascript
const result = await searchWithCompoundDated(
  "What are the breakthrough discoveries in neuroscience?",
  {
    startDate: new Date("2024-01-01"), // Can use Date objects
    endDate: new Date(),                // Current date
    temperature: 0.2,
    max_tokens: 2000,
    system: "You are an expert neuroscience researcher. Focus on peer-reviewed publications.",
    search_settings: {
      include_domains: ["nature.com", "science.org", "cell.com"],
    },
  }
);
```

## API Reference

### `searchWithCompoundDated(query, options)`

Main function for searching with date filtering support.

**Parameters:**
- `query` (string): The search query or prompt
- `options` (object): Configuration options
  - `startDate` (Date|string): Start date for filtering (YYYY-MM-DD)
  - `endDate` (Date|string): End date for filtering (YYYY-MM-DD)
  - `model` (string): Model to use (default: "groq/compound")
  - `temperature` (number): Temperature for response generation
  - `max_tokens` (number): Maximum tokens in response
  - `system` (string): System prompt to guide the model
  - `search_settings` (object): Search behavior customization
  - `tool_choice` (string): Tool choice setting (auto-set when dates provided)
  - All other standard Groq API options

**Returns:** Promise<Object> - Full response object from Groq API

### `searchCompoundDatedText(query, options)`

Get just the text content from a dated search.

**Parameters:** Same as `searchWithCompoundDated`

**Returns:** Promise<string> - The text content from the response

### `searchPapersWithDateRange(query, startDate, endDate, options)`

Optimized for finding academic papers within a date range.

**Parameters:**
- `query` (string): The research query
- `startDate` (Date|string): Start date (YYYY-MM-DD or Date object)
- `endDate` (Date|string): End date (YYYY-MM-DD or Date object)
- `options` (object): Additional options (optional)

**Returns:** Promise<Object> - Full response object with paper information

### `searchRecentPapers(query, amount, unit, options)`

Search for papers from the last N days/months/years.

**Parameters:**
- `query` (string): The research query
- `amount` (number): Number of time units to go back (default: 1)
- `unit` (string): Time unit - 'days', 'months', or 'years' (default: 'years')
- `options` (object): Additional options (optional)

**Returns:** Promise<Object> - Full response object with paper information

### `searchCompoundDatedStream(query, onChunk, options)`

Stream the response with date filtering.

**Parameters:**
- `query` (string): The search query
- `onChunk` (function): Callback function for each chunk
- `options` (object): Same as `searchWithCompoundDated`

**Returns:** Promise<string> - Complete accumulated text

## How It Works

The date filtering works by:

1. **Converting dates to ISO format** (YYYY-MM-DD) to avoid ambiguity
2. **Enhancing the system prompt** with instructions to respect date ranges
3. **Modifying the user query** to explicitly state the date requirement
4. **Setting `tool_choice: "auto"`** to let the model invoke search/code tools
5. **Letting the model handle the filtering** via its web search and code execution capabilities

### Behind the Scenes

When you provide date parameters, the module:

```javascript
// Adds to system prompt:
"You have access to web search and code execution. 
Always restrict results to the date range supplied by the user."

// Modifies user query:
"[Your original query]

IMPORTANT: Only include sources published between 2023-01-01 and 2024-12-31 (inclusive)."
```

## Date Format

Dates can be provided in two formats:

1. **ISO String**: `"2024-01-01"`
2. **Date Object**: `new Date("2024-01-01")`

The module automatically converts both to the standard `YYYY-MM-DD` format.

## Best Practices

### 1. Be Specific in Your Query
```javascript
// Good
await searchPapersWithDateRange(
  "phage therapy efficacy in treating antibiotic-resistant infections clinical trials",
  "2023-01-01",
  "2024-12-31"
);

// Less specific (may return less focused results)
await searchPapersWithDateRange(
  "phage therapy",
  "2023-01-01",
  "2024-12-31"
);
```

### 2. Use Appropriate Date Ranges
```javascript
// For recent research, use recent dates
await searchRecentPapers("latest AI developments", 3, "months");

// For historical context, use broader ranges
await searchPapersWithDateRange(
  "history of CRISPR discovery",
  "2010-01-01",
  "2020-12-31"
);
```

### 3. Set Reasonable Token Limits
```javascript
// More tokens for comprehensive summaries
await searchCompoundDatedText(query, {
  startDate: "2024-01-01",
  max_tokens: 2000, // Comprehensive
});

// Fewer tokens for quick summaries
await searchCompoundDatedText(query, {
  startDate: "2024-01-01",
  max_tokens: 500, // Brief
});
```

### 4. Adjust Temperature for Your Use Case
```javascript
// Lower temperature for factual research
await searchPapersWithDateRange(query, start, end, {
  temperature: 0.2, // More focused and factual
});

// Higher temperature for creative exploration
await searchPapersWithDateRange(query, start, end, {
  temperature: 0.7, // More diverse results
});
```

## Testing

Run the test suite:

```bash
deno run --allow-env --allow-net test-dated.js
```

The test file includes examples of:
- Searching papers in specific date ranges
- Searching recent papers (last N months/years)
- Using simplified text functions
- Searching without dates (backward compatibility)
- Searching with only start or end dates

## Comparison with Original Compound

| Feature | Original `compound.js` | Dated `compound-dated.js` |
|---------|------------------------|---------------------------|
| Basic search | ✅ | ✅ |
| Date filtering | ❌ | ✅ |
| ISO date handling | ❌ | ✅ |
| Helper functions for papers | ❌ | ✅ |
| Recent papers search | ❌ | ✅ |
| Auto tool_choice | ❌ | ✅ (when dates used) |
| All original options | ✅ | ✅ |

## Notes

- The original `compound.js` file remains unchanged
- Date filtering is handled entirely through prompts, not separate API parameters
- The Groq Compound model uses its web search and code execution tools to filter by date
- Date filtering accuracy depends on the model's ability to interpret and apply the date constraints
- Works best with academic papers and articles that have clear publication dates

## Environment Variables

Requires `GROQ_API_KEY` environment variable:

```bash
export GROQ_API_KEY="your-api-key-here"
```

Or use a `.env` file:

```
GROQ_API_KEY=your-api-key-here
```

## Examples in the Wild

The current experiments use similar date-filtering approaches with direct API calls to PubMed and bioRxiv:
- `experiments/phage-therapy-triple-hybrid.js` - Uses PubMed E-utilities API with precise date filtering
- `experiments/phage-multi-topic-search.js` - Searches multiple topics with configurable date ranges

## Troubleshooting

### Issue: Results don't respect date range
- **Solution**: Make the date requirement more explicit in your query
- Try adding "peer-reviewed" or "published in" to your search terms
- Use more specific domain restrictions

### Issue: No results found
- **Solution**: Expand your date range
- Check if papers exist in that timeframe for your topic
- Try a broader query

### Issue: Getting papers outside the date range
- **Solution**: Lower the temperature to 0.1-0.2
- Be more explicit: "Only include papers with publication dates between..."
- Use domain restrictions to focus on academic sources

## License

Same as parent project.

