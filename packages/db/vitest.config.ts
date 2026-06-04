import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["**/._*", "**/node_modules/**", ...(process.env["DATABASE_URL"] ? [] : ["tests/**"])],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
    },
  },
});
