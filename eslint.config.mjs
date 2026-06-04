import boundaries from "eslint-plugin-boundaries";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/**
 * Root ESLint flat config. The security-critical rule is the module-boundary / trust-wall
 * enforcement (CLAUDE.md §2, F-060): nothing outside the engine may import engine INTERNALS —
 * only its public index (which re-exports CandidatePublicProjection for employer code). ERROR.
 *
 * The engine is split into two element types: `core-engine-index` (the public surface,
 * packages/core/engine/index.ts) and `core-engine-internal` (every other engine file).
 * Importers outside the engine may reach the index but never an internal module.
 *
 * Stylistic / type-aware rules are off (covered by `pnpm typecheck`); the boundary check
 * needs no type info, so this stays fast and free of pre-existing apps/ noise.
 */
export default [
  {
    ignores: [
      "**/._*",  // macOS AppleDouble files (exFAT drive artifact) — not source
      "**/dist/**", "**/.next/**", "**/node_modules/**", "**/*.d.ts",
      "**/*.test.ts", "**/tests/**", "**/*.config.ts", "**/*.config.mjs",
      "**/migrations/**", "**/init/**", "docs/**", "infra/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsPlugin, boundaries },
    settings: {
      // Order matters: the exact index.ts is matched before the catch-all internal pattern.
      "boundaries/elements": [
        { type: "core-engine-index", mode: "full", pattern: "packages/core/engine/index.ts" },
        { type: "core-engine-internal", mode: "full", pattern: "packages/core/engine/**" },
        { type: "core-billing", pattern: "packages/core/billing/**" },
        { type: "core-screening", pattern: "packages/core/screening/**" },
        { type: "core-compliance", pattern: "packages/core/compliance/**" },
        { type: "ai", pattern: "packages/ai/**" },
        { type: "rag", pattern: "packages/rag/**" },
        { type: "db", pattern: "packages/db/**" },
        { type: "contracts", pattern: "packages/contracts/**" },
        { type: "ui", pattern: "packages/ui/**" },
        { type: "web-employer", pattern: "apps/web/app/(employer)/**" },
        { type: "web-other", pattern: "apps/web/**" },
        { type: "api", pattern: "apps/api/**" },
        { type: "worker", pattern: "apps/worker/**" },
      ],
      "boundaries/ignore": ["**/*.test.ts", "**/*.spec.ts", "**/tests/**"],
    },
    rules: {
      // THE invariant: no importer outside the engine may reach engine INTERNALS (trust wall).
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["api", "worker", "web-employer", "web-other"],
              disallow: ["core-engine-internal"],
              message: "Engine internals are private (F-060 trust wall). Import from @trajct/core/engine (its index only).",
            },
          ],
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
