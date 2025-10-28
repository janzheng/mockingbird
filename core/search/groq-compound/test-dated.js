import "jsr:@std/dotenv/load";
import {
  searchWithCompoundDated,
  searchCompoundDatedText,
  searchPapersWithDateRange,
  searchRecentPapers,
} from "./compound-dated.js";

console.log("=".repeat(80));
console.log("Testing Groq Compound with Date Filtering");
console.log("=".repeat(80));

// Test 1: Search for papers in a specific date range
console.log("\n📅 Test 1: Search papers from 2023-2024");
console.log("-".repeat(80));
try {
  const result1 = await searchPapersWithDateRange(
    "phage therapy clinical trials efficacy",
    "2023-01-01",
    "2024-12-31",
    { max_tokens: 1500 }
  );
  
  console.log("Response:");
  console.log(result1.choices[0].message.content);
  console.log("\nModel used:", result1.model);
  console.log("Tokens:", result1.usage);
} catch (error) {
  console.error("Error in test 1:", error.message);
}

// Test 2: Search papers from the last 6 months
console.log("\n\n📅 Test 2: Recent papers (last 6 months)");
console.log("-".repeat(80));
try {
  const result2 = await searchRecentPapers(
    "CRISPR gene editing therapeutic applications",
    6,
    "months",
    { max_tokens: 1500 }
  );
  
  console.log("Response:");
  console.log(result2.choices[0].message.content);
  console.log("\nTokens:", result2.usage);
} catch (error) {
  console.error("Error in test 2:", error.message);
}

// Test 3: Use simplified text function with date range
console.log("\n\n📅 Test 3: Simple text search with dates");
console.log("-".repeat(80));
try {
  const result3 = await searchCompoundDatedText(
    "Latest advances in bacteriophage resistance mechanisms",
    {
      startDate: "2024-01-01",
      endDate: "2024-10-26",
      temperature: 0.2,
      max_tokens: 1000,
    }
  );
  
  console.log("Response:");
  console.log(result3);
} catch (error) {
  console.error("Error in test 3:", error.message);
}

// Test 4: Search without date filter (should work like normal compound)
console.log("\n\n📅 Test 4: Search without date filtering");
console.log("-".repeat(80));
try {
  const result4 = await searchCompoundDatedText(
    "What is phage therapy?",
    { 
      temperature: 0.3,
      max_tokens: 500,
    }
  );
  
  console.log("Response:");
  console.log(result4);
} catch (error) {
  console.error("Error in test 4:", error.message);
}

// Test 5: Search with only start date (papers after a certain date)
console.log("\n\n📅 Test 5: Papers published after January 2024");
console.log("-".repeat(80));
try {
  const result5 = await searchCompoundDatedText(
    "antimicrobial resistance trends and solutions",
    {
      startDate: "2024-01-01",
      temperature: 0.2,
      max_tokens: 1000,
    }
  );
  
  console.log("Response:");
  console.log(result5);
} catch (error) {
  console.error("Error in test 5:", error.message);
}

// Test 6: Search papers from last year
console.log("\n\n📅 Test 6: Papers from the last year");
console.log("-".repeat(80));
try {
  const result6 = await searchRecentPapers(
    "microbiome influence on immune system",
    1,
    "years",
    { max_tokens: 1200 }
  );
  
  console.log("Response:");
  console.log(result6.choices[0].message.content);
  console.log("\nTokens:", result6.usage);
} catch (error) {
  console.error("Error in test 6:", error.message);
}

console.log("\n" + "=".repeat(80));
console.log("All tests completed!");
console.log("=".repeat(80));

