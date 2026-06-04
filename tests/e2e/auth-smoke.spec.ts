/**
 * E2E smoke — Auth flow (signup → login → dashboard)
 * Runs on every main-branch deploy (main.yml).
 * TC-070.x class.
 */

import { test, expect } from "@playwright/test";

test("auth smoke: login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("h1")).toContainText("Sign in to Trajct");
});

test("auth smoke: healthz endpoint returns 200", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.status()).toBe(200);
  const body = await res.json() as { status: string };
  expect(body.status).toBe("ok");
});

// Full auth flow — implemented in Sprint 1 when API is live
test.skip("auth smoke: signup → login → candidate dashboard", async ({ page }) => {
  // TODO: wire in Sprint 1
});
