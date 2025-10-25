# Search Providers

This directory contains various search provider integrations for the Mockingbird project.

## 🎯 Quick Start: Accurate Academic Paper Search

For **100% accurate** academic paper metadata, use the `accurate-papers.js` module:

```javascript
import { searchAcademicPapers } from './core/search/accurate-papers.js';

const papers = await searchAcademicPapers(
  "CRISPR gene editing papers from 2025"
);

// Returns array with full titles, authors, dates, journals, DOIs, abstracts
// All data scraped directly from webpages - zero hallucination risk!
```

See the [Accurate Papers](#accurate-academic-papers) section below for details.

## Available Providers

### Groq Compound

Location: `./groq-compound/`

Groq's Compound system integrates GPT-OSS 120B and Llama 4 models with external tools like web search, code execution, browser automation, and more.

**Quick Start:**
```javascript
import { searchWithCompound } from './search/groq-compound/compound.js';

const result = await searchWithCompound("Your query here");
console.log(result.choices[0]?.message?.content);
```

**CLI Testing:**
```bash
deno task search "Your query here"
```

[Full Documentation →](./groq-compound/README.md)

---

### Tavily

Location: `./tavily/`

Tavily is a search API optimized for LLMs and RAG, providing accurate, fact-based results with AI-generated answers.

**Quick Start:**
```javascript
import { searchWithTavily } from './search/tavily/tavily.js';

const result = await searchWithTavily("Who is Leo Messi?");
console.log(result.answer);
console.log(result.results);
```

**CLI Testing:**
```bash
deno task search:tavily "Your query here"
```

[Full Documentation →](./tavily/README.md)

---

### Exa Research

Location: `./exa-research/`

Exa Research is an asynchronous research tool that explores the web, gathers sources, synthesizes findings, and returns results with citations. Perfect for generating structured JSON or detailed markdown reports.

**Quick Start:**
```javascript
import { researchAndWait } from './search/exa-research/exa-research.js';

const result = await researchAndWait("What species of ant are similar to honeypot ants?");
console.log(result.output.content);
```

**CLI Testing:**
```bash
deno task search:exa "Your research instructions here"
```

[Full Documentation →](./exa-research/README.md)

---

### Exa Search

Location: `./exa-search/`

Exa Search provides intelligent web search with both traditional keyword search and embeddings-based neural search. Automatically chooses the best approach for your query and can extract full content.

**Quick Start:**
```javascript
import { searchAndContents } from './search/exa-search/exa-search.js';

const result = await searchAndContents("Latest research in LLMs", {
  text: true,
  numResults: 5
});
console.log(result.results);
```

**CLI Testing:**
```bash
deno task search:exa-search "Your query here"
```

[Full Documentation →](./exa-search/README.md)

---

### Search Settings (Domain Restrictions)

Restrict searches to specific domains to improve accuracy and reduce hallucinations:

```javascript
import { searchWithCompound } from './core/search/compound.js';

const result = await searchWithCompound("Find recent phage therapy papers", {
  temperature: 0.1,
  search_settings: {
    include_domains: [
      "pubmed.ncbi.nlm.nih.gov",
      "nature.com",
      "science.org",
      "*.edu"  // All educational institutions
    ]
  }
});
```

**Available search_settings options:**
- `include_domains`: Array of domains to restrict search to (supports wildcards like `*.edu`)
- `exclude_domains`: Array of domains to exclude from search
- `country`: Country to restrict search to (e.g., "united states")

This is particularly useful for academic research, fact-checking, and reducing hallucinations.

## Convenience Imports

You can import all providers from a single index file:

```javascript
import { 
  searchWithCompound,
  searchWithTavily,
  searchTavilyAnswer,
  researchAndWait,
  getResearchContent,
  searchAndContents,
  neuralSearch,
} from './search/index.js';
```

## Provider Comparison

| Provider | Best For | Speed | Capabilities |
|----------|----------|-------|--------------|
| **Groq Compound** | Real-time queries, code execution | ⚡ Very Fast | Web search, code execution, browser automation |
| **Tavily** | Quick facts, LLM-optimized search | ⚡ Fast | Web search, AI answers, news |
| **Exa Research** | Deep research, comprehensive reports | 🐢 Slower (async) | Deep web research, structured output, citations |
| **Exa Search** | Semantic search, content extraction | ⚡ Fast | Neural/keyword search, full content, highlights |

## Adding New Providers

To add a new search provider:

1. Create a new directory: `./your-provider-name/`
2. Add your provider implementation
3. Include a README.md with usage examples
4. Optionally add a test.js for CLI testing
5. Update this README with the new provider info
6. Add exports to `index.js`
7. Add a task to `deno.json` for CLI testing

### Recommended Structure

```
core/search/
├── README.md (this file)
├── index.js (convenience exports)
├── groq-compound/
│   ├── compound.js
│   ├── test.js
│   └── README.md
├── tavily/
│   ├── tavily.js
│   ├── test.js
│   └── README.md
├── exa-research/
│   ├── exa-research.js
│   ├── test.js
│   └── README.md
├── exa-search/
│   ├── exa-search.js
│   ├── test.js
│   └── README.md
└── your-provider/
    ├── provider.js
    ├── test.js
    └── README.md
```

