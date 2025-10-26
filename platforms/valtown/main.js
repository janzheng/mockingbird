import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { Hono } from 'https://deno.land/x/hono@v3.11.12/mod.ts';
import { setupRoutes } from './routes.js';

const app = new Hono();

// Setup all routes
setupRoutes(app);

// Unwrap Hono errors to see original error details
app.onError((err, c) => {
  throw err;
});

// Export app.fetch for Val Town, otherwise export app — this is only for hono apps
export default (typeof Deno !== "undefined" && Deno.env.get("valtown")) ? app.fetch : app;

