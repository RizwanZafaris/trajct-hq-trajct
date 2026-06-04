import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // DB tests need a real Postgres — skip if DATABASE_URL not set
    exclude: process.env["DATABASE_URL"] ? [] : ["tests/**"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
    },
  },
});
