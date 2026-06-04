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
  },
});
