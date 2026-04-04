/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MeetFlow API — Swagger / OpenAPI Integration
 *
 * Strategy: YAML-file approach (recommended for production).
 *   - Single source of truth lives in `swagger.yaml` at project root.
 *   - Served via swagger-ui-express at  GET /api-docs
 *   - Raw JSON spec served at           GET /api-docs/swagger.json
 *
 * Install dependencies (if not already installed):
 *   npm install swagger-ui-express yaml
 * ─────────────────────────────────────────────────────────────────────────────
 */

import swaggerUi from "swagger-ui-express";
import fs from "fs";
import { parse as parseYAML } from "yaml";
import path from "path";
import { fileURLToPath } from "url";

// ── Resolve __dirname for ESM ──────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SWAGGER_YAML_PATH = path.resolve(__dirname, "../swagger.yaml");

// ── Load & parse YAML once at startup ─────────────────────────────────────────
let swaggerSpec;

try {
  const rawYaml = fs.readFileSync(SWAGGER_YAML_PATH, "utf8");
  swaggerSpec = parseYAML(rawYaml);
} catch (err) {
  console.error("❌ Failed to load swagger.yaml:", err.message);
  // Graceful degradation — server still starts without docs
  swaggerSpec = null;
}

// ── Swagger UI options ─────────────────────────────────────────────────────────
const SWAGGER_UI_OPTIONS = {
  swaggerOptions: {
    persistAuthorization: true, // Keeps Bearer token across page refreshes
    displayOperationId: false, // Cleaner UI — hide operationId
    defaultModelsExpandDepth: 1, // Expand schemas one level by default
    defaultModelExpandDepth: 1,
    docExpansion: "list", // Collapsed by default — readable at a glance
    filter: true, // Enables the tag/endpoint search bar
    tryItOutEnabled: false, // Disable "Try it out" by default (security)
    tagsSorter: "alpha", // Sort tag groups alphabetically
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 2rem; }
  `,
  customSiteTitle: "MeetFlow API Docs",
};

// ── Main setup function — call this in app.lib.js ─────────────────────────────
/**
 * Mounts Swagger UI and the raw JSON spec endpoint onto the Express app.
 *
 * Routes exposed:
 *   GET /api-docs              — Interactive Swagger UI
 *   GET /api-docs/swagger.json — Raw OpenAPI 3.0 JSON (for tooling / codegen)
 *
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  if (!swaggerSpec) {
    console.warn("⚠️  Swagger UI skipped — swagger.yaml could not be loaded.");
    return;
  }

  // ── Interactive UI ──────────────────────────────────────────────────────────
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, SWAGGER_UI_OPTIONS),
  );

  // ── Raw JSON spec (useful for Postman import, code generators, CI checks) ──
  app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json(swaggerSpec);
  });

  console.log("📖 Swagger UI    → http://localhost:8000/api-docs");
  console.log("📄 OpenAPI JSON  → http://localhost:8000/api-docs/swagger.json");
};

export default setupSwagger;
