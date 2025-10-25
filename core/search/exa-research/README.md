# Exa Research

Exa Research is an asynchronous research tool that explores the web, gathers sources, synthesizes findings, and returns results with citations. It can generate structured JSON matching a schema or detailed markdown reports.

## Setup

Make sure you have an `EXA_API_KEY` environment variable set in your `.env` file:

```
EXA_API_KEY=your_api_key_here
```

Get your API key from [Exa](https://exa.ai/)

## Usage

### Simple Research (Wait for Completion)

```javascript
import { researchAndWait } from './core/search/exa-research/exa-research.js';

// Start research and wait for completion
const result = await researchAndWait("What species of ant are similar to honeypot ants?");
console.log(result.output.content);
```

### Get Just the Content

```javascript
import { getResearchContent } from './core/search/exa-research/exa-research.js';

const content = await getResearchContent("Latest developments in quantum computing");
console.log(content);
```

### Structured Output with Schema

```javascript
import { getResearchParsed } from './core/search/exa-research/exa-research.js';

const schema = {
  type: "object",
  properties: {
    species: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          scientificName: { type: "string" },
          similarity: { type: "string" }
        }
      }
    }
  }
};

const data = await getResearchParsed(
  "What species of ant are similar to honeypot ants?",
  schema
);

console.log(data.species);
```

### Advanced: Create and Poll Manually

```javascript
import { createResearch, pollResearch } from './core/search/exa-research/exa-research.js';

// Create research task
const research = await createResearch("Compare React and Vue frameworks", {
  model: "exa-research-pro"
});

console.log("Research ID:", research.researchId);

// Poll for completion with progress updates
const result = await pollResearch(research.researchId, {
  onProgress: (status) => {
    console.log("Status:", status.status);
  },
  includeEvents: true // Get detailed event log
});

console.log(result.output.content);
```

### With Progress Callbacks

```javascript
import { researchAndWait } from './core/search/exa-research/exa-research.js';

const result = await researchAndWait("Latest AI breakthroughs", {
  model: "exa-research-pro",
  onProgress: (status) => {
    if (status.status === "created") {
      console.log("Research started:", status.researchId);
    } else if (status.status === "running") {
      console.log("Still working...");
    }
  }
});
```

### Cancel Research

```javascript
import { createResearch, cancelResearch } from './core/search/exa-research/exa-research.js';

const research = await createResearch("Long research task");

// Cancel it
await cancelResearch(research.researchId);
```

## CLI Testing

```bash
# Test Exa Research from command line
deno task search:exa "your research instructions here"

# Examples
deno task search:exa "What species of ant are similar to honeypot ants?"
deno task search:exa "Latest developments in quantum computing"
deno task search:exa "Compare the top 5 JavaScript frameworks"
```

## Available Functions

### `createResearch(instructions, options)`

Create a new research task (returns immediately with researchId).

**Parameters:**
- `instructions` (string): What you would like research on
- `options` (object): Optional parameters
  - `model` (string): "exa-research-fast", "exa-research" (default), or "exa-research-pro"
  - `outputSchema` (object): JSON Schema to enforce structured output

**Returns:** Promise<Object> with:
- `researchId` - ID for tracking
- `status` - "pending"
- `createdAt` - Timestamp
- `instructions` - Original instructions
- `model` - Model used

### `getResearch(researchId, options)`

Get the current status of a research task.

**Parameters:**
- `researchId` (string): The research ID
- `options` (object): Optional parameters
  - `includeEvents` (boolean): Include detailed event log

**Returns:** Promise<Object> - Current research status

### `pollResearch(researchId, options)`

Poll a research task until completion.

**Parameters:**
- `researchId` (string): The research ID
- `options` (object): Optional parameters
  - `pollInterval` (number): Milliseconds between polls (default: 2000)
  - `maxAttempts` (number): Maximum attempts (default: 150)
  - `onProgress` (function): Callback for status updates
  - `includeEvents` (boolean): Include detailed event log

**Returns:** Promise<Object> - Final completed research

### `researchAndWait(instructions, options)`

Create research and wait for completion (convenience function).

**Parameters:**
- `instructions` (string): Research instructions
- `options` (object): Combined options for create and poll
  - `model` (string): Research model
  - `outputSchema` (object): JSON Schema
  - `pollInterval` (number): Poll frequency
  - `maxAttempts` (number): Max polling attempts
  - `onProgress` (function): Progress callback
  - `includeEvents` (boolean): Include events

**Returns:** Promise<Object> - Completed research result

### `getResearchContent(instructions, options)`

Get just the content string from research.

**Returns:** Promise<string>

### `getResearchParsed(instructions, outputSchema, options)`

Get parsed structured output matching your schema.

**Returns:** Promise<Object>

### `cancelResearch(researchId)`

Cancel a running research task.

**Returns:** Promise<Object>

## Response Format

### Completed Research

```javascript
{
  researchId: "01jszdfs0052sg4jc552sg4jc5",
  status: "completed",
  model: "exa-research",
  instructions: "What species of ant are similar to honeypot ants?",
  createdAt: 1704067200000,
  finishedAt: 1704067245000,
  output: {
    content: "Research findings as markdown or JSON string...",
    parsed: { /* Structured data if outputSchema provided */ }
  },
  costDollars: {
    total: 0.0234,
    numSearches: 5,
    numPages: 12,
    reasoningTokens: 3456
  },
  events: [ /* Detailed log if requested */ ]
}
```

### Status Values

- `pending` - Task created, not started
- `running` - Research in progress
- `completed` - Successfully finished
- `failed` - Error occurred
- `canceled` - Task was canceled

## Models

### `exa-research-fast`
- Fastest and cheapest
- Good for simple queries
- Basic analysis

### `exa-research` (default)
- Balanced speed and quality
- Good for most use cases
- Reasonable cost

### `exa-research-pro`
- Most thorough analysis
- Strongest reasoning
- Higher cost
- Best for complex research

## Event Types

When using `includeEvents: true`, you'll see detailed logs:

- **research-definition** - Initial research setup
- **plan-definition** - Planning cycle started
- **plan-operation** - Planning actions (think, search, crawl)
- **plan-output** - Plan decisions (tasks or stop)
- **task-definition** - Task created
- **task-operation** - Task actions (think, search, crawl)
- **task-output** - Task completed
- **research-output** - Final research result

## Pricing

Pricing varies by model and usage:
- Model costs (reasoning tokens)
- Search costs (per query)
- Crawl costs (per page)

Exact pricing available at [Exa Pricing](https://exa.ai/pricing)

The `costDollars` field in completed research shows exact costs.

## Use Cases

### Research Reports
```javascript
const report = await getResearchContent(
  "Write a comprehensive analysis of the current state of renewable energy"
);
```

### Data Extraction
```javascript
const data = await getResearchParsed(
  "Find the top 10 SaaS companies by revenue",
  {
    type: "object",
    properties: {
      companies: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            revenue: { type: "string" },
            founded: { type: "number" }
          }
        }
      }
    }
  }
);
```

### Competitive Analysis
```javascript
const analysis = await researchAndWait(
  "Compare Stripe, Square, and PayPal payment processing features and pricing"
);
```

### Market Research
```javascript
const market = await getResearchParsed(
  "What are the latest trends in AI-powered code editors?",
  {
    type: "object",
    properties: {
      trends: { type: "array", items: { type: "string" } },
      keyPlayers: { type: "array", items: { type: "string" } },
      marketSize: { type: "string" }
    }
  }
);
```

## Best Practices

1. **Clear Instructions**: Be specific about what you want researched
2. **Output Format**: Define your desired output format in instructions
3. **Use Schemas**: For structured data, always provide an outputSchema
4. **Progress Tracking**: Use onProgress for long-running research
5. **Error Handling**: Always wrap in try/catch for network issues
6. **Cost Awareness**: Monitor costDollars to track spending

## Example: Full Workflow

```javascript
import { researchAndWait } from './core/search/exa-research/exa-research.js';

async function analyzeCompetitors(product) {
  const result = await researchAndWait(
    `Research competitors for ${product}. Include: company names, key features, pricing, and market position.`,
    {
      model: "exa-research-pro",
      outputSchema: {
        type: "object",
        properties: {
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                features: { type: "array", items: { type: "string" } },
                pricing: { type: "string" },
                marketPosition: { type: "string" }
              }
            }
          }
        }
      },
      onProgress: (status) => {
        console.log(`Research status: ${status.status}`);
      }
    }
  );
  
  console.log(`Cost: $${result.costDollars.total.toFixed(4)}`);
  return result.output.parsed;
}

// Usage
const competitors = await analyzeCompetitors("project management software");
console.log(competitors);
```

