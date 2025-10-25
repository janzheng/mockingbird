# Experiments

This folder contains experimental scripts that use Groq Compound search for various research and discovery tasks.

## 🎯 Quick Start: Best Approach for Academic Papers

For the most accurate results, use:
```bash
deno task ex:phage-therapy-urls-only
```

This uses Groq only for URL discovery, then fetches 100% accurate metadata directly from webpages. See `SOLUTION.md` for why this approach is superior.

## Running Experiments

Each experiment can be run using the deno task command:

```bash
deno task ex:experimentname
```

## Available Experiments

### 🏆 Phage Therapy Papers - URLs Only (RECOMMENDED) (`ex:phage-therapy-urls-only`)

**⭐ BEST ACCURACY:** Uses Groq only for URL discovery, then fetches real metadata from webpages.

**Run with:**
```bash
deno task ex:phage-therapy-urls-only
```

**Why this is best:**
- ✅ **100% accurate metadata** - pulled directly from webpage HTML meta tags
- ✅ **No hallucinations** - LLM only finds URLs, not metadata
- ✅ **Complete information** - gets full titles, authors, abstracts, DOIs
- ✅ **Verifiable** - every data point comes from the actual paper's webpage

**What it does:**
1. Uses Groq Compound to search and find paper URLs (domain-restricted)
2. Fetches each webpage directly
3. Extracts citation metadata from HTML meta tags:
   - `citation_title` - Full, accurate titles
   - `citation_author` - All authors
   - `citation_publication_date` - Real publication dates
   - `citation_journal_title` - Correct journal names
   - `citation_doi` - Verified DOIs
   - `citation_abstract` - Actual abstracts

**Output includes:**
- Full untruncated titles
- Author lists (first 5 + "et al.")
- Accurate dates in readable format
- Correct journal names
- DOIs with direct links
- Abstracts (first 300 characters)

**Use this for:**
- Academic citations
- Research reports
- Any situation where accuracy is critical
- When you need complete, verifiable information

---

### Phage Therapy Papers - Basic (`ex:phage-therapy`)

**⚠️ Note:** This basic version may produce hallucinations. Use the improved versions below for better accuracy.

Searches for recent phage therapy (bacteriophage therapy) academic research papers published in reputable journals within the last 30 days.

**Run with:**
```bash
deno task ex:phage-therapy
```

**What it does:**
- Searches multiple academic databases and journal sites
- Filters for papers published in the last 30 days
- Focuses on reputable journals (Nature, Science, The Lancet, mBio, Viruses, Antibiotics, etc.)
- Returns structured information about each paper

**Limitations:** May hallucinate papers or citations without verification.

---

### Phage Therapy Papers - Improved (`ex:phage-therapy-improved`)

**Recommended:** This version implements anti-hallucination strategies.

**Run with:**
```bash
deno task ex:phage-therapy-improved
```

**What it does:**
- **Uses `search_settings`** to restrict searches to academic domains
- **Two-step RAG approach:**
  1. First step: Raw search for papers with strict factual requirements
  2. Second step: Format results with verification markers
- **Displays tool calls** to show what sources were actually accessed
- **Marks unverified papers** that lack URLs or DOIs
- **Lower temperature** (0.1) for factual accuracy

**Anti-hallucination features:**
- Domain restrictions to academic sources only
- Explicit "do not make up papers" instructions
- Two-pass verification with different prompts
- Transparent marking of unverified information

---

### Phage Therapy Papers - Verified (`ex:phage-therapy-verified`)

**Most Reliable:** This version includes URL verification.

**Run with:**
```bash
deno task ex:phage-therapy-verified
```

**What it does:**
- Searches with domain restrictions
- **Automatically extracts URLs and DOIs** from results
- **Verifies each URL** by making HEAD requests
- Reports which URLs are valid vs inaccessible
- Creates a verified summary with confidence markers
- Provides direct PubMed search syntax for manual verification

**Anti-hallucination features:**
- All features from "improved" version
- Automatic URL extraction and verification
- Clear distinction between verified and unverified papers
- Direct links for manual verification
- Statistical reporting of verification results

---

### Phage Therapy Debug (`ex:phage-therapy-debug`)

**For Debugging:** Traces raw search results vs formatted output.

**Run with:**
```bash
deno task ex:phage-therapy-debug
```

**What it does:**
- Shows **raw unformatted search results** from Groq
- Shows **formatted version** with markdown
- Displays **tool calls** made by Groq Compound
- Performs **comparison analysis** to identify any discrepancies
- Verifies URLs are accessible

**Use this when:**
- You think the formatting is changing data
- You want to see what Groq actually found vs what it formatted
- You need to debug incorrect information

---

### URL Content Verification (`ex:verify-urls`)

**For Deep Verification:** Fetches actual webpage content and compares metadata.

**Run with:**
```bash
deno task ex:verify-urls
```

**What it does:**
- Fetches the actual HTML of papers found by Groq
- Extracts metadata from webpage (citation_title, citation_date, etc.)
- Compares **claimed metadata** vs **actual webpage metadata**
- Shows exactly where discrepancies occur

**Use this when:**
- You need to verify if dates/journals are actually correct
- You suspect Groq is returning wrong metadata
- You need to confirm paper details before citing

**Recent findings:** See `DEBUG_FINDINGS.md` for comprehensive test results showing that:
- ✅ Dates are accurate (October 2025 papers verified)
- ✅ Journals are accurate
- ✅ URLs are valid
- ⚠️ Some titles may be truncated/simplified

---

### Inspect Compound Output (`ex:inspect-compound`)

**For Debugging Groq Compound:** Shows the complete raw output from Groq.

**Run with:**
```bash
deno task ex:inspect-compound
# Or with custom query:
deno task ex:inspect-compound "your custom search query"
```

**What it shows:**
- **Full raw JSON** - Complete unprocessed response
- **Response structure** - All top-level keys and types
- **Main content** - What users typically see
- **Message details** - Role, content length, etc.
- **Executed tools** - Which tools Groq actually used (search, visit, etc.)
  - Tool arguments (search queries, URLs visited)
  - Search results with scores
  - Output from each tool
- **Usage statistics** - Token counts and cost estimates
- **Usage breakdown by model** - Shows which models (Llama 4 Scout, GPT-OSS-120B) handled each step
- **Metadata** - Model, timestamps, finish reasons
- **Analysis** - What's present vs missing

**Use this when:**
- You want to see EVERYTHING Groq returns
- Debugging why results are unexpected
- Understanding which tools were actually called
- Checking which models were used
- Verifying token usage and costs

## Anti-Hallucination Strategies

Based on research and testing, here are proven strategies to reduce hallucinations in Groq Compound searches:

### 1. Use `search_settings` to Restrict Domains

Limit searches to reputable sources:

```javascript
search_settings: {
  include_domains: [
    "pubmed.ncbi.nlm.nih.gov",
    "nature.com",
    "science.org",
    "*.edu"  // Academic institutions
  ]
}
```

### 2. Two-Step RAG (Retrieval-Augmented Generation)

Separate retrieval from formatting:

```javascript
// Step 1: Retrieve with strict "don't make up" instructions
const searchResults = await searchWithCompound(query, {
  system: "Find actual papers. Do not make up information.",
  temperature: 0.1
});

// Step 2: Format with verification requirements  
const formatted = await searchWithCompound(`Format these results: ${searchResults}`, {
  system: "Mark unverified items clearly. Be honest about limitations.",
  temperature: 0.1
});
```

### 3. Lower Temperature for Factual Tasks

- Use 0.1-0.3 for research and factual retrieval
- Use 0.7-0.9 only for creative tasks

### 4. Extract and Verify URLs/DOIs

```javascript
// Extract URLs from LLM response
const urls = text.match(/https?:\/\/[^\s\)]+/g);

// Verify each URL
for (const url of urls) {
  const response = await fetch(url, { method: 'HEAD' });
  console.log(url, response.ok ? '✅' : '❌');
}
```

### 5. Explicit "Do Not Hallucinate" Instructions

Be very explicit in system prompts:
- "Do NOT make up papers or citations"
- "Only include information from actual search results"
- "If you cannot find something, say so explicitly"
- "Include source URLs for everything"

### 6. Display Tool Calls

Check what tools were actually used:

```javascript
if (result.choices[0]?.message?.tool_calls) {
  console.log("Tools used:", result.choices[0].message.tool_calls);
}
```

### 7. Mark Unverified Information

Always distinguish between verified and unverified:
- Papers with URLs: ✅ Verified
- Papers without URLs: ⚠️ [NEEDS VERIFICATION]
- Inaccessible URLs: ❌ [BROKEN LINK]

### 8. Provide Manual Verification Methods

Always include fallback verification:
- PubMed search syntax
- Direct links to databases
- Alternative search strategies

## Creating New Experiments

1. Create a new `.js` file in this directory
2. Import the compound search module:
   ```javascript
   import "jsr:@std/dotenv/load";
   import { searchWithCompound } from '../core/search/compound.js';
   ```
3. Write your experiment logic
4. Add a new task to `deno.json`:
   ```json
   "ex:yourexperiment": "deno run --allow-env --allow-net --allow-read ./experiments/yourexperiment.js"
   ```
5. **Consider implementing anti-hallucination strategies** from the section above

## Tips

- Use lower temperatures (0.1-0.3) for factual research tasks
- Use higher temperatures (0.7-0.9) for creative tasks
- Provide detailed system prompts to guide the search
- Use `max_tokens` to control response length
- Check `result.choices[0].message.tool_calls` to see which tools were used
- Groq Compound has access to web search, code execution, browser automation, and more

## Environment Requirements

Make sure you have a `GROQ_API_KEY` in your `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

