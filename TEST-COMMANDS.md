# Test Commands Reference

Quick reference for all search, scrape, and compound query commands in Mockingbird.

## Search Commands

### Tavily Search
Advanced AI-powered search with answer generation.

```bash
# Basic search with AI answer
deno task search:tavily "Who is Leo Messi?"

# Technology news
deno task search:tavily "Latest AI developments"

# Location-based queries
deno task search:tavily "Best restaurants in Tokyo"
```

### Jina Search
Search using Jina AI's search API.

```bash
# Basic search
deno task search:jina "latest AI developments"

# Restaurant search
deno task search:jina "best restaurants in Tokyo"

# Current events
deno task search:jina "current events in technology"
```

### Exa Search
Fast semantic search powered by Exa.

```bash
# Basic search
deno task search:exa "artificial intelligence breakthroughs"

# News search
deno task search:exa "climate change solutions"

# Academic search
deno task search:exa "quantum computing research"
```

### Exa Research
Deep research mode with comprehensive results.

```bash
# Research query
deno task search:exa-r "impact of AI on healthcare"

# Market research
deno task search:exa-r "renewable energy trends 2024"

# Technical research
deno task search:exa-r "machine learning algorithms comparison"
```

### Compound Search (Groq)
Multi-step research using Groq LLM to break down complex queries.

```bash
# Complex research query
deno task search "comprehensive analysis of renewable energy"

# Multi-faceted topic
deno task search "future of electric vehicles and infrastructure"

# Comparative research
deno task search "AI vs traditional programming approaches"
```

---

## Scrape Commands

### Tavily Extract
Extract and convert web pages to clean markdown or text.

```bash
# Single URL extraction
deno task scrape:tavily "https://arstechnica.com"

# Multiple URLs
deno task scrape:tavily "https://en.wikipedia.org/wiki/Artificial_intelligence" "https://en.wikipedia.org/wiki/Machine_Learning"

# Advanced extraction (more comprehensive, includes tables)
deno task scrape:tavily "https://en.wikipedia.org/wiki/Artificial_intelligence" --advanced

# Include images in results
deno task scrape:tavily "https://arstechnica.com" --images

# Extract as plain text instead of markdown
deno task scrape:tavily "https://arstechnica.com" --text

# Combine flags
deno task scrape:tavily "https://arstechnica.com" --advanced --images
```

**Tavily Extract Options:**
- `--advanced` - More comprehensive extraction with tables and embedded content (uses 2x credits)
- `--images` - Include list of images and favicon
- `--text` - Extract as plain text instead of markdown

### Jina Reader
Read and convert web pages using Jina AI's reader.

```bash
# Basic read
deno task scrape:jina "https://en.wikipedia.org/wiki/Artificial_intelligence"

# Article extraction
deno task scrape:jina "https://arstechnica.com"

# JSON response format
deno task scrape:jina "https://arstechnica.com" --json

# Advanced conversion with ReaderLM-v2 (better quality, 3x tokens)
deno task scrape:jina "https://arstechnica.com" --advanced

# Include image captions
deno task scrape:jina "https://arstechnica.com" --images

# Gather all links at the end
deno task scrape:jina "https://arstechnica.com" --links

# Bypass cache for fresh content
deno task scrape:jina "https://arstechnica.com" --fresh

# Combine multiple options
deno task scrape:jina "https://arstechnica.com" --advanced --images --links
```

**Jina Reader Options:**
- `--json` - Return JSON response instead of markdown
- `--advanced` - Use ReaderLM-v2 for better conversion (3x tokens)
- `--images` - Include image captions
- `--links` - Gather all links at the end
- `--fresh` - Bypass cache and fetch fresh content

---

## Common Use Cases

### Research Workflow
```bash
# 1. Start with compound search to explore topic
deno task search "quantum computing applications"

# 2. Search specific sources
deno task search:tavily "quantum computing IBM research"

# 3. Extract detailed content from results
deno task scrape:tavily "https://research.ibm.com/quantum" --advanced

# 4. Get readable version
deno task scrape:jina "https://research.ibm.com/quantum" --advanced
```

### News Aggregation
```bash
# Find latest news
deno task search:exa "latest technology news today"

# Get AI summary
deno task search:tavily "tech news summary today"

# Extract full articles
deno task scrape:tavily "https://techcrunch.com/article" "https://arstechnica.com/article"
```

### Content Analysis
```bash
# Research topic deeply
deno task search:exa-r "blockchain technology trends"

# Extract specific pages with images
deno task scrape:tavily "https://arstechnica.com" --advanced --images

# Get structured data
deno task scrape:jina "https://arstechnica.com" --json
```

### Quick Content Extraction
```bash
# Fast markdown conversion
deno task scrape:tavily "https://arstechnica.com"

# With all images and links
deno task scrape:jina "https://arstechnica.com" --images --links
```

---

## Tips

### Search Tips
- Use **Tavily** for questions that need AI-generated answers
- Use **Jina** for general web search
- Use **Exa** for fast semantic search
- Use **Exa Research** for comprehensive research mode
- Use **Compound Search** for complex, multi-faceted queries

### Scrape Tips
- Use **Tavily Extract** for:
  - Multiple URLs at once (up to 20)
  - When you need images and favicons
  - When you want markdown or plain text
  - When you need tables and structured content (--advanced)

- Use **Jina Reader** for:
  - High-quality article conversion (--advanced)
  - When you need JSON output (--json)
  - When you want image captions (--images)
  - When you need all links extracted (--links)
  - When content needs to be fresh (--fresh)

### Performance
- Basic extraction: ~1-2 seconds per URL
- Advanced extraction: ~3-5 seconds per URL (but more comprehensive)
- Batch extraction (Tavily): Process multiple URLs in one request
- Cache: Jina caches results; use --fresh to bypass

### Credits & Costs
- **Tavily Extract**: 1 credit per 5 URLs (basic), 2 credits per 5 URLs (advanced)
- **Jina Reader**: Standard rate, 3x tokens for --advanced mode

---

## Environment Variables Required

Make sure these are set in your `.env` file:

```bash
TAVILY_API_KEY=tvly-xxxxx
JINA_API_KEY=jina_xxxxx
EXA_API_KEY=exa_xxxxx
GROQ_API_KEY=gsk_xxxxx
```

