import { readFile } from "https://esm.town/v/std/utils/index.ts";

// Environment-aware file reading function
export async function readFileContent(filePath) {
  // Check if we're in Val Town environment
  if (typeof Deno !== "undefined" && Deno.env.get("valtown")) {
    // Use Val Town's readFile
    return await readFile(filePath, import.meta.url);
  } else {
    // Use Deno's native readTextFile for local development
    return await Deno.readTextFile(filePath);
  }
}

// Generate unique ID
export function generateId() {
  try { 
    return crypto.randomUUID(); 
  } catch (_) { 
    return (Date.now().toString(36) + Math.random().toString(36).slice(2)); 
  }
}

// Get current timestamp
export function nowTs() { 
  return Date.now(); 
}

