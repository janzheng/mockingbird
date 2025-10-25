import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from '../core/search/compound.js';

console.log("🔬 Searching for recent phage therapy research papers...\n");

const systemPrompt = `You are a specialized academic research assistant with expertise in microbiology, virology, and phage therapy. 
Your task is to search for and identify recent peer-reviewed research papers about phage therapy (bacteriophage therapy) 
published in reputable academic journals within the last 30 days.

Focus on:
- Peer-reviewed research articles
- Publications from reputable journals (Nature, Science, The Lancet, PNAS, mBio, Viruses, Antibiotics, etc.)
- Recent publications (last 30 days)
- Original research, clinical trials, reviews, and case studies
- Exclude preprints unless explicitly noted

For each paper found, provide:
1. Title
2. Authors (first 3, et al. if more)
3. Journal name
4. Publication date
5. DOI or URL if available
6. Brief summary of key findings (2-3 sentences)

Format the results in a clear, organized way.`;

const query = `Find all academic research papers about phage therapy (bacteriophage therapy) published in reputable 
journals in the last 30 days. Include papers about:
- Clinical applications of phage therapy
- Phage-antibiotic combinations
- Phage resistance mechanisms
- Novel phage isolation and characterization
- Phage therapy for specific pathogens (e.g., Pseudomonas, Staphylococcus, E. coli)
- Personalized phage therapy
- Regulatory and safety aspects

Search multiple academic databases and journal sites. Today's date is ${new Date().toISOString().split('T')[0]}.`;

try {
  const result = await searchWithCompound(query, {
    system: systemPrompt,
    temperature: 0.3, // Lower temperature for more factual responses
    max_tokens: 4096,
  });
  
  const content = result.choices[0]?.message?.content;
  
  console.log("📄 RESULTS:\n");
  console.log("=".repeat(80));
  console.log(content);
  console.log("=".repeat(80));
  
  // Display metadata
  console.log("\n📊 METADATA:");
  console.log(`Model used: ${result.model}`);
  console.log(`Tokens used: ${result.usage?.total_tokens || 'N/A'} (input: ${result.usage?.prompt_tokens || 'N/A'}, output: ${result.usage?.completion_tokens || 'N/A'})`);
  
  if (result.choices[0]?.message?.tool_calls) {
    console.log("\n🔧 Tools used:");
    result.choices[0].message.tool_calls.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.function?.name || tool.type}`);
    });
  }
  
  console.log("\n✅ Search completed successfully!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  Deno.exit(1);
}

