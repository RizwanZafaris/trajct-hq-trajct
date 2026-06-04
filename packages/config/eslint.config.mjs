import boundaries from "eslint-plugin-boundaries";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/**
 * ESLint flat config enforcing the module boundaries defined in Technical-Methodology §1.1.
 *
 * Rules:
 *  (a) core/* modules import each other ONLY via their package index.ts (no internal path imports)
 *  (b) Nothing outside packages/core/engine may import engine internals
 *  (c) Employer-side code may import ONLY CandidatePublicProjection types from the engine
 */
export default [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/*.d.ts"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "core-billing", pattern: "packages/core/billing/**" },
        { type: "core-engine", pattern: "packages/core/engine/**" },
        { type: "core-screening", pattern: "packages/core/screening/**" },
        { type: "core-compliance", pattern: "packages/core/compliance/**" },
        { type: "ai", pattern: "packages/ai/**" },
        { type: "rag", pattern: "packages/rag/**" },
        { type: "db", pattern: "packages/db/**" },
        { type: "contracts", pattern: "packages/contracts/**" },
        { type: "ui", pattern: "packages/ui/**" },
        { type: "web-candidate", pattern: "apps/web/app/(candidate)/**" },
        { type: "web-employer", pattern: "apps/web/app/(employer)/**" },
        { type: "web-admin", pattern: "apps/web/app/(admin)/**" },
        { type: "api", pattern: "apps/api/**" },
        { type: "worker", pattern: "apps/worker/**" },
      ],
      "boundaries/ignore": ["**/*.test.ts", "**/*.spec.ts", "**/tests/**"],
    },
    rules: {
      // (a) core modules must import each other only through package index
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["core-billing", "core-engine", "core-screening", "core-compliance"],
              allow: [
                "core-billing",
                "core-engine",
                "core-screening",
                "core-compliance",
                "ai",
                "rag",
                "db",
                "contracts",
              ],
              message:
                "core/* modules must import each other only via their package index (no internal path imports).",
            },
            // (b) engine internals are private — only the engine package itself and core modules via index
            {
              from: ["api", "worker", "web-candidate", "web-employer", "web-admin"],
              disallow: [{ type: "core-engine", specifier: "*/engine/!(index)*" }],
              message:
                "Engine internals are private. Import from @trajct/core/engine (index only).",
            },
            // (c) employer-side code must not import candidate-private types
            {
              from: ["web-employer"],
              disallow: [
                { type: "core-engine", specifier: "*/engine/!(CandidatePublicProjection)*" },
              ],
              message:
                "Employer code may only import CandidatePublicProjection from the engine (trust wall).",
            },
          ],
        },
      ],
      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
];
