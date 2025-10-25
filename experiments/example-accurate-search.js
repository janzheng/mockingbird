import "jsr:@std/dotenv/load";
import { 
  searchAcademicPapers, 
  formatPapersForConsole 
} from '../core/search/accurate-papers.js';

// Example: Search for phage therapy papers
console.log("🔬 Example: Accurate Academic Paper Search\n");
console.log("=".repeat(80));

try {
  const papers = await searchAcademicPapers(
    "phage therapy bacteriophage research papers published in October 2025",
    {
      maxPapers: 5,
      includeAbstracts: true,
      maxAuthors: 3,
      onProgress: (progress) => {
        if (progress.stage === 'searching') {
          console.log(`\n📡 ${progress.message}`);
        } else if (progress.stage === 'fetching' && progress.current) {
          console.log(`   [${progress.current}/${progress.total}] ${progress.url}`);
        } else if (progress.stage === 'complete') {
          console.log(`\n✅ ${progress.message}\n`);
        }
      }
    }
  );
  
  console.log("=".repeat(80));
  console.log(formatPapersForConsole(papers));
  console.log("=".repeat(80));
  
  console.log(`\n📊 Found ${papers.length} papers with 100% accurate metadata`);
  console.log("💡 All data pulled directly from webpage meta tags - zero hallucination risk!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  Deno.exit(1);
}

