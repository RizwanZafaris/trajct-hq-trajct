import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"] ?? "postgresql://trajct:trajct_dev_password@localhost:5432/trajct_dev",
  },
  verbose: true,
  strict: true,
});
