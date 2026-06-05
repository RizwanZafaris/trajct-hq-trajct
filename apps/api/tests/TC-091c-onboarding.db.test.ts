/**
 * TC-091c (db) — onboarding stepper.
 * .1 reach first diagnosis in one session (activation) · .2 resume at the same step
 * .3 owner exempt · .4 skip optional step, still reach diagnosis
 * Covers FR-091c.1/.2/.3/.4, BR-091c.2/.3, AC-091c.1/.2/.3/.4.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { OnboardingService } from "../src/candidate/onboarding/onboarding.service.js";

const DB_URL = process.env["DATABASE_URL"]!;
const NEW1 = "091c091c-0000-0000-0000-000000000001";
const NEW2 = "091c091c-0000-0000-0000-000000000002";
const NEW3 = "091c091c-0000-0000-0000-000000000003";
const OWNER = "091c091c-0000-0000-0000-0000000000ce";
const ALL = [NEW1, NEW2, NEW3, OWNER];

describe("TC-091c onboarding", () => {
  let sql: ReturnType<typeof postgres>;
  const svc = new OnboardingService();

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    for (const u of [NEW1, NEW2, NEW3]) {
      await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${u}, ${u + "@test.dev"}, 'candidate', 'h') ON CONFLICT (id) DO UPDATE SET onboarded_at = NULL`;
    }
    // Owner is backfilled-exempt.
    await sql`INSERT INTO users (id, email, user_type, password_hash, onboarded_at) VALUES (${OWNER}, 'owner091c@test.dev', 'candidate', 'h', now()) ON CONFLICT (id) DO UPDATE SET onboarded_at = now()`;
  });
  afterAll(async () => {
    for (const u of ALL) {
      await sql`DELETE FROM onboarding_state WHERE user_id = ${u}`;
      await sql`DELETE FROM users WHERE id = ${u}`;
    }
    await sql.end();
  });

  it(".1 reaches first diagnosis (activation) in one session (AC-091c.1)", async () => {
    expect((await svc.getState(NEW1)).currentStep).toBe("welcome");
    await svc.advance(NEW1, { step: "welcome", skip: false });
    await svc.advance(NEW1, { step: "import", skip: false });
    await svc.advance(NEW1, { step: "targets", skip: false });
    const s = await svc.advance(NEW1, { step: "diagnosis", skip: false });
    expect(s.onboarded).toBe(true);             // BR-091c.2 activation stamped
    expect(s.progress).toBe(1);
    const [u] = await sql`SELECT onboarded_at FROM users WHERE id = ${NEW1}`;
    expect(u!["onboarded_at"]).toBeTruthy();
  });

  it(".2 resumes at the same step after leaving (AC-091c.2)", async () => {
    await svc.advance(NEW2, { step: "welcome", skip: false });
    const resumed = await svc.getState(NEW2);    // simulate returning later
    expect(resumed.currentStep).toBe("import");
    expect(resumed.onboarded).toBe(false);
    expect(resumed.completedSteps).toContain("welcome");
  });

  it(".3 owner is exempt — not forced through onboarding (AC-091c.3)", async () => {
    const s = await svc.getState(OWNER);
    expect(s.exempt).toBe(true);
    expect(s.onboarded).toBe(true);
    expect(s.currentStep).toBe("done");
  });

  it(".4 skipping the import step still reaches a first diagnosis (AC-091c.4)", async () => {
    await svc.advance(NEW3, { step: "welcome", skip: false });
    await svc.advance(NEW3, { step: "targets", skip: true });   // skipped import entirely
    const s = await svc.advance(NEW3, { step: "diagnosis", skip: false });
    expect(s.onboarded).toBe(true);
    expect(s.completedSteps).not.toContain("import");           // genuinely skipped
  });
});
