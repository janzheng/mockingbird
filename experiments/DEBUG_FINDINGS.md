# Debug Findings: Groq Compound Search Accuracy

## Summary

After running comprehensive tests with actual URL verification, we found that **Groq Compound search results are largely accurate** for phage therapy papers from October 2025.

## Test Results

### ✅ What's Working Correctly

1. **URLs are valid** - All returned URLs are accessible and return 200 OK
2. **Dates are accurate** - October 2025 dates match actual publication dates on webpages
3. **Journal names are accurate** - Scientific Reports, Antibiotics, npj Viruses all match
4. **Titles mostly match** - Core titles are correct

### ⚠️ Minor Issues Found

#### 1. Title Truncation
**Paper 2 (MDPI Antibiotics):**
- **Groq returned:** "Phage Therapy as a Novel Alternative to Antibiotics"
- **Actual title:** "Phage Therapy as a Novel Alternative to Antibiotics Through Adaptive Evolution and Fitness Trade-Offs"
- **Issue:** Title was truncated/simplified, missing the second half

#### 2. Missing Journal Names
**Paper 3 (npj Viruses):**
- **Groq returned:** Journal "Not shown"
- **Actual journal:** npj Viruses
- **Issue:** Journal name was not extracted from search results

### 🔍 Verification Process

We ran three experiments:

#### 1. **Debug Trace** (`ex:phage-therapy-debug`)
- Shows raw search results vs formatted output
- Displays actual tool calls made by Groq
- Compares formatting step for data integrity
- **Finding:** Formatting step does NOT change dates or other data

#### 2. **URL Verification** (`ex:verify-urls`)
- Fetches actual webpage content
- Extracts metadata from HTML (citation_title, citation_date, etc.)
- Compares claimed vs actual metadata
- **Finding:** All dates and journals match actual content

#### 3. **URL Accessibility Check** (`ex:phage-therapy-verified`)
- Makes HEAD requests to verify URLs are accessible
- **Finding:** All URLs return 200 OK

## Comparison: Raw vs Formatted

```
STEP 1 (Raw Search Results):
- Returns: URL, Title, Date, Journal as found
- No interpretation or reformatting
- Temperature: 0.05 (very factual)

STEP 2 (Formatting):
- Takes raw results and adds markdown formatting
- Adds [UNCLEAR IN SOURCE] markers for missing data
- Does NOT change dates, titles, or journal names
- Temperature: 0.05 (maintains accuracy)

STEP 3 (Comparison Analysis):
- Identifies any discrepancies between raw and formatted
- Finding: Only changes are formatting, not data
```

## Token Usage

For full debug trace:
- Raw search: ~25,694 tokens
- Formatting: ~4,036 tokens
- Comparison: ~12,084 tokens
- **Total: ~41,814 tokens**

## Conclusions

### What's Causing "Incorrect" Information?

Based on testing, the issues are likely:

1. **Title simplification** - Groq sometimes returns shortened versions of titles
2. **Missing metadata** - Some journal names aren't extracted from search results
3. **NOT hallucination** - Dates and basic facts are correct
4. **NOT formatting errors** - The formatting step preserves data accurately

### Recommendations

#### For Best Accuracy:

1. **Use the debug mode** to see raw search results
2. **Verify URLs manually** for critical citations
3. **Check full titles** on actual webpages (they may be truncated in search results)
4. **Use search_settings** to restrict domains (already implemented)
5. **Use low temperature** (0.1 or lower) for factual tasks

#### When to Trust Results:

- ✅ Dates from major journals (Nature, MDPI, etc.) - highly accurate
- ✅ Journal names when explicitly shown - accurate
- ⚠️ Titles - may be simplified/truncated, verify for citations
- ⚠️ Author lists - often missing from search results

#### When to Verify Manually:

- 🔍 Papers marked [UNCLEAR IN SOURCE]
- 🔍 Titles that seem generic or incomplete
- 🔍 Any paper you plan to cite in academic work

## Available Debug Tools

Run these experiments to investigate accuracy:

```bash
# 1. Full debug trace with comparison
deno task ex:phage-therapy-debug

# 2. Verify URL content matches claims
deno task ex:verify-urls

# 3. Check URL accessibility
deno task ex:phage-therapy-verified

# 4. Standard improved search with domain restrictions
deno task ex:phage-therapy-improved
```

## Next Steps

### If You're Still Seeing Incorrect Data:

1. Run `deno task ex:phage-therapy-debug` 
2. Copy the specific paper with incorrect info
3. Run `deno task ex:verify-urls` to check that URL
4. Compare what Groq returned vs what's on the actual webpage

### To Improve Accuracy Further:

1. **More specific queries** - Include exact journal names or date ranges
2. **Post-processing** - Fetch full metadata from DOIs/URLs after search
3. **Multiple sources** - Cross-reference results from different searches
4. **Direct API calls** - Use PubMed API directly for academic papers (bypassing LLM interpretation)

## Example: Full Accuracy Check

```javascript
// 1. Search with Groq
const results = await searchWithCompound(query, { temperature: 0.05 });

// 2. Extract URLs
const urls = results.match(/https?:\/\/[^\s]+/g);

// 3. Fetch actual metadata
for (const url of urls) {
  const response = await fetch(url);
  const html = await response.text();
  const actualTitle = html.match(/<meta name="citation_title" content="([^"]+)"/);
  const actualDate = html.match(/<meta name="citation_publication_date" content="([^"]+)"/);
  
  // Compare with search results
  console.log("Claimed vs Actual:", { claimed, actual });
}
```

This ensures you're working with verified, accurate data from the source.

