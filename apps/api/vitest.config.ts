import { defineConfig } from "vitest/config";

const hasDb = !!process.env["DATABASE_URL"];

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/._*", "**/node_modules/**", "**/dist/**", ...(hasDb ? [] : ["**/*.db.test.ts"])],
    testTimeout: 30000,
  },
});
