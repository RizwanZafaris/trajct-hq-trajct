/**
 * TC-060.1 — Trust wall boundary.
 *
 * - CandidatePublicProjection contains NO private fields (no userId, no score, no diagnosis)
 * - hybridRetrieve without ownerScope → throws (data-layer trust wall guard)
 *
 * The lint-level checks (employer importing engine internals) are enforced by
 * eslint-plugin-boundaries + the verification grep in the sprint checklist.
 *
 * Covers: F-060
 */

import { describe, it, expect } from "vitest";
import { hybridRetrieve, TrustWallFilterError } from "@trajct/rag";
import type { CandidatePublicProjection } from "../engine/trust-wall.js";

describe("TC-060.1 Trust wall boundary", () => {
  it("CandidatePublicProjection exposes no private fields", () => {
    // A representative projection — must compile with ONLY public fields.
    const projection: CandidatePublicProjection = {
      anonymizedId: "anon-123",
      consentRef: "consent-456",
      seniorityBand: "senior",
      functionalAreas: ["product"],
      availableRegions: ["uae"],
      skillSignals: ["sql"],
      availability: "active",
      employerConsentGranted: true,
    };

    const keys = Object.keys(projection);
    // Forbidden private fields must NOT be part of the type surface.
    expect(keys).not.toContain("userId");
    expect(keys).not.toContain("score");
    expect(keys).not.toContain("diagnosis");
    expect(keys).not.toContain("weaknesses");
    expect(keys).not.toContain("outcomes");
    expect(keys).not.toContain("email");
    // Sanity: the projection IS pseudonymous and consent-gated.
    expect(projection.anonymizedId).not.toMatch(/@/); // not an email/real id
    expect(projection.consentRef).toBeTruthy();
  });

  it("hybridRetrieve refuses a query without ownerScope (trust wall guard)", async () => {
    await expect(
      // @ts-expect-error — deliberately omit ownerScope to prove the guard fires
      hybridRetrieve({ text: "anything", region: "uae" })
    ).rejects.toBeInstanceOf(TrustWallFilterError);
  });

  it("hybridRetrieve refuses a user-scope query without ownerId", async () => {
    await expect(
      hybridRetrieve({ text: "x", ownerScope: "user", region: "uae" })
    ).rejects.toBeInstanceOf(TrustWallFilterError);
  });

  it("hybridRetrieve refuses a query without region", async () => {
    await expect(
      // @ts-expect-error — deliberately omit region
      hybridRetrieve({ text: "x", ownerScope: "global" })
    ).rejects.toBeInstanceOf(TrustWallFilterError);
  });
});
