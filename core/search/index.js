// Search provider exports for easy importing

// Groq Compound
export {
  searchWithCompound,
  searchCompoundText,
  searchCompoundStream,
  searchWithTools,
} from './groq-compound/compound.js';

// Tavily Search
export {
  searchWithTavily,
  searchTavilyResults,
  searchTavilyAnswer,
  searchTavilyAdvanced,
  searchTavilyNews,
} from './tavily/tavily.js';

// Jina Search
export {
  searchWithJina,
  searchJinaResults,
} from './jina/jina.js';

// Exa Research
export {
  createResearch,
  getResearch,
  pollResearch,
  researchAndWait,
  getResearchContent,
  getResearchParsed,
  cancelResearch,
} from './exa-research/exa-research.js';

// Exa Search
export {
  searchWithExa,
  searchAndContents,
  getResults,
  getContext,
  neuralSearch,
  keywordSearch,
  fastSearch,
  searchResearchPapers,
  searchNews,
  searchCompanies,
  searchGitHub,
} from './exa-search/exa-search.js';

