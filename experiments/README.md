# Experiments

This folder contains experimental scripts for research and discovery tasks using various search APIs.

## 🎯 Available Experiments

### 🏆 Phage Therapy Triple Hybrid Search (RECOMMENDED)

**File:** `phage-therapy-triple-hybrid.js`

**⭐ BEST FOR COMPREHENSIVE RESEARCH:** Combines three powerful sources for maximum coverage of phage therapy papers.

**Run with:**
```bash
# Default: last 30 days
deno run --allow-env --allow-net --allow-read ./experiments/phage-therapy-triple-hybrid.js

# Custom timeframe (e.g., last 60 days)
deno run --allow-env --allow-net --allow-read ./experiments/phage-therapy-triple-hybrid.js 60

# Last 7 days for very recent papers
deno run --allow-env --allow-net --allow-read ./experiments/phage-therapy-triple-hybrid.js 7
```

**Strategy:**
1. **PubMed Search** - High-quality indexed biomedical papers via E-utilities API
2. **bioRxiv/medRxiv API** - Direct access to preprints with microbiology category filtering
3. **Exa Search** - Other academic sources using auto search (neural + keyword)
4. **Smart Deduplication** - Removes duplicates by DOI and title similarity
5. **Source Attribution** - Clear labels showing where each paper was found

**Why this approach is comprehensive:**
- ✅ **PubMed coverage** - All indexed biomedical papers with complete structured metadata
- ✅ **Preprint discovery** - Finds latest preprints from bioRxiv/medRxiv before PubMed indexing
- ✅ **Broader coverage** - Exa finds papers from Europe PMC, PLOS, ASM, MDPI, etc.
- ✅ **100% DOI coverage** - All papers have verified DOIs
- ✅ **Complete metadata** - Full author lists, abstracts, dates, journals
- ✅ **Intelligent filtering** - Phage-specific content filtering, excludes collection pages
- ✅ **Smart deduplication** - Best metadata preserved when duplicates found

**Output sections:**
- **FROM PUBMED** - Complete metadata from PubMed's structured API
- **FROM BIORXIV/MEDRXIV** - Preprints with category labels
- **FROM EXA - OTHER SOURCES** - Papers from diverse academic publishers

**Use this for:**
- Literature reviews requiring comprehensive coverage
- Finding the newest research (including preprints)
- When you need both peer-reviewed AND preprint papers
- Identifying cutting-edge research before PubMed indexing
- Academic research requiring complete metadata

**Environment required:**
```
EXA_API_KEY=your_exa_key    # Required for Exa search
```

---

### 🔬 Multi-Topic Phage Research Search

**File:** `phage-multi-topic-search.js`

**⭐ BEST FOR BROAD COVERAGE:** Searches 12 different phage-related topics across all three sources.

**Run with:**
```bash
# Default: last 7 days
deno run --allow-env --allow-net --allow-read ./experiments/phage-multi-topic-search.js

# Custom timeframe (e.g., last 14 days)
deno run --allow-env --allow-net --allow-read ./experiments/phage-multi-topic-search.js 14
```

**Strategy:**
1. Searches **12 phage research topics** systematically
2. For each topic: PubMed + bioRxiv/medRxiv API + Exa
3. Targets ~5 papers per source per topic
4. Tags each paper: `[source, type, topic]`
5. Smart deduplication across all papers
6. Results organized by topic

**Topics covered:**
- 🧬 Phage therapy
- 💻 Phage bioinformatics  
- 🔗 Phage-host interactions
- 🧪 Phage biology
- 🛡️ Phage resistance
- ⚔️ Phage defense
- 🔧 Phage engineering
- 💊 Phage-antibiotic synergy
- 🌍 Phageome
- 🦠 Virome
- 🧬 Prophage
- 🩺 Phage-immune interactions

**Why this approach is powerful:**
- ✅ **Multi-topic coverage** - Captures diverse aspects of phage research
- ✅ **Topic-specific filtering** - Customized search terms and filters per topic
- ✅ **Comprehensive tagging** - Each paper tagged with source, type, and topic
- ✅ **Smart category mapping** - Uses appropriate bioRxiv categories per topic
- ✅ **Focused timeframe** - Default 7-day window for very recent papers
- ✅ **Complete metadata** - DOIs, authors, abstracts, dates, journals
- ✅ **Organized output** - Results grouped by topic and source

**Output structure:**
```
📚 TOPIC: "PHAGE THERAPY"
  📊 From PubMed (5 papers)
  📊 From bioRxiv/medRxiv (3 papers)
  📊 From Exa (4 papers)

📚 TOPIC: "PHAGE BIOINFORMATICS"
  📊 From PubMed (4 papers)
  📊 From bioRxiv/medRxiv (2 papers)
  📊 From Exa (5 papers)
  
... (continues for all 12 topics)
```

**Use this for:**
- Broad surveys of phage research landscape
- Discovering research across multiple phage-related areas
- Building comprehensive research databases
- Tracking multiple research directions simultaneously
- Finding papers at the intersection of multiple topics

**Environment required:**
```
EXA_API_KEY=your_exa_key    # Required for Exa search
```

---

## 📊 Comparison

| Feature | Triple Hybrid | Multi-Topic |
|---------|--------------|-------------|
| **Topics** | Single topic (phage therapy) | 12 topics |
| **Default timeframe** | 30 days | 7 days |
| **Papers per search** | ~30-60 papers | ~60-180 papers |
| **Best for** | Deep dive, comprehensive literature review | Broad survey, multiple topics |
| **Output organization** | By source | By topic, then source |
| **Speed** | Faster | Slower (more topics) |
| **Coverage** | Deep | Wide |

**Quick decision guide:**
- 🎯 **Use Triple Hybrid** when you want comprehensive coverage of a single topic
- 🌐 **Use Multi-Topic** when you want to survey multiple aspects of phage research

---

## 🛠️ Technical Details

### Data Sources

Both experiments use the same three data sources:

1. **PubMed (via E-utilities API)**
   - Free, no API key required
   - High-quality indexed biomedical literature
   - Complete structured metadata
   - Precise date filtering
   - Direct PMIDs and URLs

2. **bioRxiv/medRxiv (via REST API)**
   - Free, no API key required
   - Preprints before peer review
   - Category filtering (microbiology, bioinformatics, etc.)
   - Usually 1-2 days ahead of PubMed indexing
   - Complete metadata including abstracts

3. **Exa (via Exa API)**
   - Requires API key (paid service)
   - Neural + keyword hybrid search
   - Broader journal coverage beyond biomedical
   - Category filtering for "research paper"
   - Text filtering for content requirements

### Metadata Extraction

Papers include:
- ✅ **Title** - Full, untruncated titles
- ✅ **Authors** - Complete author lists
- ✅ **Abstract** - Full abstracts when available
- ✅ **DOI** - Digital Object Identifiers
- ✅ **Journal/Platform** - Publication venue
- ✅ **Date** - Publication or preprint date
- ✅ **URL** - Direct link to paper
- ✅ **Source** - Where the paper was found
- ✅ **Tags** - Source, type, topic (multi-topic only)

### Deduplication Strategy

Both experiments use intelligent deduplication:

1. **Priority 1: DOI matching** - Exact DOI matches are considered duplicates
2. **Priority 2: Title similarity** - >90% title similarity considered duplicates
3. **Source preference** - PubMed metadata preferred when duplicates found
4. **Tag preservation** - Multi-topic search preserves all relevant topic tags

### Quality Filtering

Papers must meet these criteria:
- ✅ Contains "phage" or "bacteriophage" in title or abstract
- ✅ Has a valid DOI
- ✅ Not a collection page or table of contents
- ✅ Within specified date range
- ✅ Excludes obvious false positives (e.g., macrophage-only papers)

---

## 🚀 Getting Started

### Prerequisites

1. **Deno installed**
   ```bash
   # macOS/Linux
   curl -fsSL https://deno.land/x/install/install.sh | sh
   
   # Or with Homebrew
   brew install deno
   ```

2. **Exa API key**
   - Sign up at [exa.ai](https://exa.ai)
   - Get your API key
   - Add to `.env` file in project root

3. **Environment setup**
   Create a `.env` file in the project root:
   ```bash
   EXA_API_KEY=your_exa_api_key_here
   ```

### Running Your First Search

**For single-topic comprehensive search:**
```bash
deno run --allow-env --allow-net --allow-read ./experiments/phage-therapy-triple-hybrid.js
```

**For multi-topic survey:**
```bash
deno run --allow-env --allow-net --allow-read ./experiments/phage-multi-topic-search.js
```

### Cost Estimates

**Triple Hybrid (per search):**
- PubMed: Free
- bioRxiv/medRxiv: Free
- Exa: ~$0.01-0.02 (50 results)
- **Total: ~$0.01-0.02 per search**

**Multi-Topic (per search):**
- PubMed: Free
- bioRxiv/medRxiv: Free
- Exa: ~$0.12-0.24 (12 topics × 30 results each)
- **Total: ~$0.12-0.24 per search**

---

## 📝 Tips

- **Start with shorter timeframes** (7 days) to test before running longer searches
- **PubMed/bioRxiv are free** - only Exa requires paid API
- **Check API quotas** before large-scale searches
- **Use delays** between requests to respect rate limits (already built-in)
- **Review output sections** to understand what each source found
- **Save results** - redirect output to a file with `> results.txt`

---

## 🔮 Future Enhancements

Possible additions to these experiments:
- Additional topic areas for multi-topic search
- More preprint servers (arXiv, Research Square)
- Export to structured formats (JSON, CSV, BibTeX)
- Citation network analysis
- Automatic email digests
- Integration with reference managers

---

## 📚 Related Documentation

- See `core/search/README.md` for search module documentation
- See `core/scrape/README.md` for metadata extraction details
- See `SOLUTION.md` for additional search strategies
- See `old-experiments/` folder for archived experimental approaches

