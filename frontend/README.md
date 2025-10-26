# Hacker News-Styled Search Interface

## What Was Built

A clean, Hacker News-inspired search interface using Alpine.js that connects to the Mockingbird search harness.

## Features

### 🎨 Visual Design
- **Classic HN Orange Header** (#ff6600)
- **Monospace Menlo font** throughout
- **Clean, minimal styling** matching Hacker News aesthetic
- **Simple beige background** (#f6f6ef)

### 🔍 Search Functionality
- **Query input** with Enter key support
- **Provider selection** dropdown:
  - Groq Compound (AI) - default
  - Tavily
  - Exa
  - Jina
- **AI Answer toggle** checkbox
- **Real-time search** via `/api/search` endpoint

### 📊 Results Display

**AI Summary Section:**
- Orange-bordered answer box
- Shows AI-generated summary when available
- Only appears when `includeAnswer` is checked

**Search Results List:**
Each result displays:
1. **Number** (1., 2., 3., etc.)
2. **Title** (linked to source)
3. **Metadata line** with:
   - Time ago (e.g., "2 hours ago")
   - Source provider (e.g., "tavily")
   - Relevance score
   - Domain name
4. **Snippet** - preview of content

### 🎯 Special Features

**Smart Date Formatting:**
- "just now" for recent
- "X hours ago" for today
- "X days ago" for this week
- Full date for older

**Visited Links:**
- Unvisited: black
- Visited: gray (#828282)

**Domain Extraction:**
- Shows clean domain (without www.)

**Loading States:**
- Disabled button while searching
- "Searching..." indicator
- Error messages in red box

## How It Works

### Frontend Flow
```
User enters query → Click search → POST /api/search → 
  → Receive SearchResponse → 
  → Display AI answer (if available) → 
  → Display results in HN style
```

### Backend Integration
```javascript
// Sends to your search harness
POST /api/search
{
  "query": "artificial intelligence",
  "provider": "compound",
  "maxResults": 30,
  "includeAnswer": true
}

// Receives standardized response
{
  "success": true,
  "provider": "compound",
  "results": [...],
  "answer": "AI-generated summary...",
  "totalResults": 30
}
```

### Groq Compound Search
When using the Groq Compound provider:
- Returns AI-synthesized answer in `response.answer`
- Results include search sources
- Content is displayed prominently

## Usage

### Start the Server
```bash
deno task serve
```

### Visit
```
http://localhost:9990
```

### Try Some Searches
- "latest AI news"
- "quantum computing breakthroughs"
- "OpenAI announcements"
- "what is happening with LLMs"

### Switch Providers
Use the dropdown to compare results from:
- **Groq Compound**: AI-powered search with synthesis
- **Tavily**: News and web search
- **Exa**: Neural search
- **Jina**: Multimodal search

## Code Structure

### Alpine.js Component
```javascript
searchApp() {
  return {
    query: '',              // Search query
    provider: 'compound',   // Selected provider
    includeAnswer: true,    // Show AI answer
    loading: false,         // Loading state
    results: [],            // Search results
    answer: '',             // AI answer
    error: '',              // Error message
    
    executeSearch(),        // Main search function
    formatDate(),           // Date formatting
    getDomain()             // Extract domain from URL
  }
}
```

### Styling
- **Pure CSS** (no Tailwind)
- **Inline styles** for easy deployment
- **Responsive** design
- **Accessible** markup

## Customization

### Change Colors
```css
.header {
  background: #ff6600;  /* Change header color */
}

.answer-box {
  border-left: 3px solid #ff6600;  /* Change accent color */
}
```

### Adjust Result Count
```javascript
body: JSON.stringify({
  maxResults: 50,  // Change from 30 to more/less
}),
```

### Modify Date Format
Edit the `formatDate()` function to change how dates are displayed.

## Benefits

1. **Clean & Fast**: Minimal design, quick loading
2. **Familiar**: HN users feel right at home
3. **Functional**: All search providers accessible
4. **Extensible**: Easy to add features
5. **Responsive**: Works on mobile and desktop

## Next Steps

### Potential Enhancements
- [ ] Add pagination for results
- [ ] Save search history
- [ ] Create alerts from searches
- [ ] Add keyboard shortcuts (j/k navigation)
- [ ] Implement infinite scroll
- [ ] Add search filters
- [ ] Create feed view
- [ ] Add bookmarking

### Integration with Alerts
You can now:
1. Do a search
2. Like the results?
3. Click "Create Alert" to monitor this query
4. Results automatically added to your feed

## Notes

- Uses Menlo font (as per your preference)
- All search goes through the unified harness
- Results are normalized regardless of provider
- AI answers only work with providers that support them (Groq Compound, Tavily)
- Error handling for network issues

Enjoy your HN-styled search interface! 🚀

