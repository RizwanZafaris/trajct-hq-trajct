import { defineConfig } from "vitest/config";

const hasDb = !!process.env["DATABASE_URL"];

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Skip DB-backed tests (named *.db.test.ts) when no DATABASE_URL is set.
    exclude: ["**/._*", "**/node_modules/**", ...(hasDb ? [] : ["**/*.db.test.ts"])],
    testTimeout: 30000,
    // DB tests share one Postgres (the global decision-log hash chain especially) — run test
    // FILES sequentially so concurrent writers from other files don't contaminate a chain window.
    fileParallelism: false,
  },
});
