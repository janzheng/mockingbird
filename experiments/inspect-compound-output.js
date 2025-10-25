import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { searchWithCompound } from '../core/search/compound.js';

console.log("🔍 Inspect Full Groq Compound Output\n");
console.log("This experiment shows EVERYTHING that Groq Compound returns\n");
console.log("=".repeat(80));

// Get query from command line or use default
const query = Deno.args.join(' ') || "Find phage therapy papers published in October 2025";

console.log(`\n📝 QUERY: "${query}"\n`);
console.log("=".repeat(80));

try {
  const result = await searchWithCompound(query, {
    system: "You are a helpful research assistant.",
    temperature: 0.3,
    max_tokens: 2000,
    search_settings: {
      include_domains: [
        "pubmed.ncbi.nlm.nih.gov",
        "nature.com",
        "science.org",
        "mdpi.com",
        "*.edu"
      ]
    }
  });
  
  // ============================================================================
  // SECTION 1: FULL RAW JSON OUTPUT
  // ============================================================================
  console.log("\n📦 1. FULL RAW JSON OUTPUT");
  console.log("=".repeat(80));
  console.log("This is the complete, unprocessed response from Groq:\n");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n" + "=".repeat(80));
  
  // ============================================================================
  // SECTION 2: RESPONSE STRUCTURE BREAKDOWN
  // ============================================================================
  console.log("\n🗂️  2. RESPONSE STRUCTURE BREAKDOWN");
  console.log("=".repeat(80));
  console.log("\n📌 Top-level keys:");
  Object.keys(result).forEach(key => {
    console.log(`   - ${key}: ${typeof result[key]}`);
  });
  
  // ============================================================================
  // SECTION 3: MAIN RESPONSE CONTENT
  // ============================================================================
  console.log("\n\n💬 3. MAIN RESPONSE CONTENT");
  console.log("=".repeat(80));
  console.log("\nThis is what we typically show to users:\n");
  if (result.choices && result.choices[0]) {
    console.log(result.choices[0].message?.content || "[No content]");
  }
  console.log("\n" + "=".repeat(80));
  
  // ============================================================================
  // SECTION 4: MESSAGE DETAILS
  // ============================================================================
  console.log("\n📨 4. MESSAGE DETAILS");
  console.log("=".repeat(80));
  if (result.choices && result.choices[0]?.message) {
    const msg = result.choices[0].message;
    console.log("\nMessage object structure:");
    console.log(`   role: ${msg.role}`);
    console.log(`   content length: ${msg.content?.length || 0} characters`);
    console.log(`   refusal: ${msg.refusal || 'null'}`);
    console.log(`   tool_calls: ${msg.tool_calls ? `${msg.tool_calls.length} calls` : 'null'}`);
    console.log(`   function_call: ${msg.function_call ? 'present' : 'null'}`);
  }
  
  // ============================================================================
  // SECTION 5: TOOL CALLS (DETAILED)
  // ============================================================================
  console.log("\n\n🔧 5. TOOL CALLS (DETAILED)");
  console.log("=".repeat(80));
  
  // Check for executed_tools (Groq Compound specific)
  if (result.choices && result.choices[0]?.message?.executed_tools) {
    const executedTools = result.choices[0].message.executed_tools;
    console.log(`\n🎯 Groq Compound executed ${executedTools.length} tool(s):\n`);
    
    executedTools.forEach((tool, i) => {
      console.log(`\n[Tool ${i + 1}] ${tool.type || 'unknown'}`);
      console.log(`   Index: ${tool.index}`);
      
      if (tool.arguments) {
        console.log(`   Arguments:`);
        try {
          const args = JSON.parse(tool.arguments);
          console.log(`   ${JSON.stringify(args, null, 2).split('\n').join('\n   ')}`);
        } catch (e) {
          console.log(`   ${tool.arguments}`);
        }
      }
      
      if (tool.output) {
        const outputPreview = tool.output.substring(0, 500);
        console.log(`   Output (first 500 chars):`);
        console.log(`   ${outputPreview.substring(0, 100)}...`);
        console.log(`   [Full output is ${tool.output.length} characters]`);
      }
      
      if (tool.search_results?.results) {
        console.log(`   Search Results: ${tool.search_results.results.length} results`);
        tool.search_results.results.slice(0, 3).forEach((r, j) => {
          console.log(`      ${j + 1}. ${r.title?.substring(0, 60) || 'No title'}`);
          console.log(`         URL: ${r.url}`);
          console.log(`         Score: ${r.score}`);
        });
        if (tool.search_results.results.length > 3) {
          console.log(`      ... and ${tool.search_results.results.length - 3} more`);
        }
      }
      
      console.log("");
    });
  }
  // Also check for standard tool_calls format
  else if (result.choices && result.choices[0]?.message?.tool_calls) {
    const toolCalls = result.choices[0].message.tool_calls;
    console.log(`\nStandard tool_calls format: ${toolCalls.length} call(s):\n`);
    
    toolCalls.forEach((tool, i) => {
      console.log(`\n[Tool Call ${i + 1}]`);
      console.log(`   ID: ${tool.id}`);
      console.log(`   Type: ${tool.type}`);
      console.log(`   Function Name: ${tool.function?.name || '[Not specified]'}`);
      
      if (tool.function?.arguments) {
        console.log(`   Function Arguments:`);
        try {
          const args = JSON.parse(tool.function.arguments);
          console.log(JSON.stringify(args, null, 6));
        } catch (e) {
          console.log(`   ${tool.function.arguments}`);
        }
      }
      
      console.log("");
    });
  } else {
    console.log("\nNo tool calls or executed_tools found in response");
  }
  console.log("=".repeat(80));
  
  // ============================================================================
  // SECTION 6: USAGE STATISTICS
  // ============================================================================
  console.log("\n\n📊 6. USAGE STATISTICS");
  console.log("=".repeat(80));
  if (result.usage) {
    console.log("\nToken usage:");
    console.log(`   Prompt tokens: ${result.usage.prompt_tokens || 'N/A'}`);
    console.log(`   Completion tokens: ${result.usage.completion_tokens || 'N/A'}`);
    console.log(`   Total tokens: ${result.usage.total_tokens || 'N/A'}`);
    
    if (result.usage.prompt_tokens && result.usage.completion_tokens) {
      console.log(`\n   Cost estimate (GPT-OSS-120B rates):`);
      const inputCost = (result.usage.prompt_tokens / 1_000_000) * 0.15;
      const outputCost = (result.usage.completion_tokens / 1_000_000) * 0.60;
      const totalCost = inputCost + outputCost;
      console.log(`   - Input: $${inputCost.toFixed(6)}`);
      console.log(`   - Output: $${outputCost.toFixed(6)}`);
      console.log(`   - Total: $${totalCost.toFixed(6)}`);
    }
    
    // Show usage breakdown by model if available
    if (result.usage_breakdown?.models) {
      console.log(`\n   📋 Usage breakdown by model (${result.usage_breakdown.models.length} models used):`);
      result.usage_breakdown.models.forEach((model, i) => {
        console.log(`\n      Model ${i + 1}: ${model.model}`);
        console.log(`         Prompt: ${model.usage.prompt_tokens}, Completion: ${model.usage.completion_tokens}`);
        console.log(`         Total: ${model.usage.total_tokens} tokens`);
        console.log(`         Time: ${model.usage.total_time?.toFixed(3) || 'N/A'}s`);
      });
    }
  } else {
    console.log("\nNo usage information available");
  }
  console.log("=".repeat(80));
  
  // ============================================================================
  // SECTION 7: METADATA
  // ============================================================================
  console.log("\n\n🏷️  7. METADATA");
  console.log("=".repeat(80));
  console.log(`\nModel: ${result.model || 'N/A'}`);
  console.log(`System fingerprint: ${result.system_fingerprint || 'N/A'}`);
  console.log(`Created: ${result.created ? new Date(result.created * 1000).toISOString() : 'N/A'}`);
  console.log(`ID: ${result.id || 'N/A'}`);
  console.log(`Object type: ${result.object || 'N/A'}`);
  
  if (result.choices && result.choices[0]) {
    console.log(`\nChoice details:`);
    console.log(`   Index: ${result.choices[0].index}`);
    console.log(`   Finish reason: ${result.choices[0].finish_reason || 'N/A'}`);
    console.log(`   Logprobs: ${result.choices[0].logprobs || 'null'}`);
  }
  console.log("=".repeat(80));
  
  // ============================================================================
  // SECTION 8: WHAT'S MISSING OR UNEXPECTED
  // ============================================================================
  console.log("\n\n❓ 8. ANALYSIS");
  console.log("=".repeat(80));
  
  console.log("\n✅ What's present:");
  const present = [];
  if (result.choices?.[0]?.message?.content) present.push("Response content");
  if (result.choices?.[0]?.message?.tool_calls) present.push(`${result.choices[0].message.tool_calls.length} tool calls`);
  if (result.usage) present.push("Usage statistics");
  if (result.model) present.push("Model information");
  present.forEach(item => console.log(`   - ${item}`));
  
  console.log("\n⚠️  What's missing or null:");
  const missing = [];
  if (!result.choices?.[0]?.message?.tool_calls) missing.push("Tool calls");
  if (!result.usage) missing.push("Usage statistics");
  if (!result.system_fingerprint) missing.push("System fingerprint");
  if (missing.length === 0) {
    console.log("   - Nothing significant missing!");
  } else {
    missing.forEach(item => console.log(`   - ${item}`));
  }
  
  console.log("\n💡 Notes:");
  console.log("   - Tool calls show which web searches, code executions, etc. were performed");
  console.log("   - The response content is the final synthesized answer from the model");
  console.log("   - Tool call arguments show the actual search queries or parameters used");
  console.log("   - Not all features may be available depending on the API version");
  
  console.log("\n=".repeat(80));
  console.log("\n✅ Inspection complete!");
  console.log("\n💡 TIP: Run with a custom query:");
  console.log('   deno task ex:inspect-compound "your query here"');
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.stack) {
    console.error("\n📚 Stack trace:");
    console.error(error.stack);
  }
  if (error.response) {
    console.error("\n📡 Error response:");
    console.error(JSON.stringify(error.response, null, 2));
  }
  Deno.exit(1);
}

