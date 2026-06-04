# Trajct — Wireframe Library

> Low-fidelity, annotated screen wireframes with stable **Screen IDs (W-xxx)**. The FRDs reference these by ID in
> each feature's UX section. ASCII layout + annotations; intended to be redrawn in Figma at hi-fi. Grouped by product
> surface: **W-1xx Candidate · W-2xx Employer · W-3xx Platform/Internal · W-0xx Shared/auth.**

Legend: `[ Button ]` · `( field )` · `‹ icon ›` · `▸ link` · `│ │` panel edges · `★` primary CTA · annotations in *(italics)*.

---

## W-0xx — Shared / auth

### W-001 — Sign-up / Sign-in `→ FRD-P §4.70`
```
┌──────────────────────────────────────────────┐
│  trajct                                       │
│                                               │
│         Find out why you're getting           │
│              ghosted. ★                        │
│                                               │
│   [ Continue with Google ]  ‹SSO W-002›       │
│   [ Continue with Microsoft ]                 │
│   ──────────  or  ──────────                  │
│   ( email )                                   │
│   [ Continue with email ]                     │
│                                               │
│   ▸ I'm an employer  → W-201                  │
└──────────────────────────────────────────────┘
```
*Notes:* No password wall before the diagnosis (W-101) — auth is deferred to the paywall (W-103). Employer path forks early.

### W-002 — SSO / org login `→ FRD-P §4.71`
*Standard OAuth/SAML redirect; org users land on W-201 employer home. RBAC role resolved post-login.*

---

## W-1xx — Candidate

### W-101 — The Diagnosis (the hook, no wall) `→ FRD-C §4.1`
```
┌───────────────────────────────────────────────────────────┐
│  trajct                                       ‹help W-130› │
│  Paste your résumé + a job you're targeting                │
│  ┌─────────────────────────┐  ┌────────────────────────┐  │
│  │ ( drop résumé / paste )  │  │ ( paste job URL or JD ) │  │
│  └─────────────────────────┘  └────────────────────────┘  │
│                    [ Diagnose me ★ ]                       │
│  ───────────────── results (≤ few sec) ─────────────────  │
│   Fit score:  ▰▰▰▰▱▱▱▱▱▱  42 / 100   (C — fixable)        │
│   Why you're getting ghosted:                              │
│    1. ✗ Missing 4 of 6 must-have keywords *(worst)*        │
│    2. ✗ No quantified impact in top 3 bullets             │
│    3. ✗ Seniority signal reads junior for this role       │
│    4. ✗ Summary is generic, not role-specific             │
│    5. ✗ ATS-unfriendly formatting (2-column)              │
│   each row ▸ "see the evidence"                           │
│                                                           │
│        [ Fix all 5 — rewrite my résumé ★ ] → W-103        │
└───────────────────────────────────────────────────────────┘
```
*Notes:* Tone adapts (gentler banner for laid-off/fresher). Progress state if >2s. Honest empty-state if parse fails (offer manual entry). The "Fix all 5" CTA is the paywall trigger.

### W-102 — Rate-a-job by URL `→ FRD-C §4.5`
```
┌──────────────────────────────────────────────┐
│  Rate any job you found                       │
│  ( paste job URL or JD text )   [ Rate ★ ]    │
│  ── result ──                                 │
│  Stripe · Senior PM, Payments                 │
│  Fit: A (87)  ▰▰▰▰▰▰▰▰▱▱                       │
│  ✓ stack match  ✓ seniority  ⚠ location       │
│  [ Save to my pipeline ]  [ Tailor for this ] │
└──────────────────────────────────────────────┘
```

### W-103 — Paywall → the fix `→ FRD-C §4.2, FRD-P §4.73`
```
┌──────────────────────────────────────────────┐
│  Your fixed résumé is ready.                  │
│  Unlock the rewrite that fixes all 5 reasons. │
│   ○ Free trial (7 days)   ● Pro $29/mo        │
│   [ Start free trial ★ ]                      │
│   ▸ what's included   ▸ maybe later           │
└──────────────────────────────────────────────┘
```
*Notes:* Wall sits AFTER the aha, BEFORE the fix. Trial prominent for no-income (David). A/B: $29 vs $39.

### W-104 — Résumé workspace + chat editing `→ FRD-C §4.2, §4.4, §4.6`
```
┌───────────────── Résumé workspace ──────────────────────────┐
│  ‹versions: Base | Stripe ▾ |  +new›        [ Export ▾ ]    │
│ ┌──────────────────────────┐ ┌───────────────────────────┐ │
│ │  RÉSUMÉ (live preview)    │ │  Chat edits               │ │
│ │  ───────────────────────  │ │  You: tighten bullet 2    │ │
│ │  Experience               │ │  Trajct: ✓ done ‹undo›    │ │
│ │  • Led … (edited) ✎       │ │  ( type an instruction… ) │ │
│ │  • …                      │ │  modes: ·quick ·section   │ │
│ │                           │ │         ·full rebuild     │ │
│ └──────────────────────────┘ └───────────────────────────┘ │
│  Δ change-log shows what changed + why                      │
└─────────────────────────────────────────────────────────────┘
```
*Notes:* Edits visible + reversible (undo). Three modes selectable. Never auto-sends.

### W-105 — Company-specific interview prep `→ FRD-C §4.7, §4.9`
```
┌──────────── Interview prep · Stripe ───────────────┐
│  What to expect:  3 rounds · system design + behav. │
│  Likely questions (researched):                     │
│   • "Walk me through a payments edge case…"  ▸ how  │
│   • "Tell me about a time you…" (STAR ▸ from F-010) │
│  What Stripe values: ▸ ownership ▸ rigor            │
│  ┌─ Tutor (chat) ───────────────────────────────┐  │
│  │ ask anything about this interview…            │  │
│  └───────────────────────────────────────────────┘  │
│  [ Start a mock interview → W-106 ]                 │
└─────────────────────────────────────────────────────┘
```

### W-106 — Mock interview (voice/video) `→ FRD-C §4.8`
*Live AI interviewer panel; record toggle (consented); post-session: transcript + feedback scorecard.*

### W-107 — Today / Home (monitoring + actions) `→ FRD-C §4.15, §4.18`
```
┌──────────── Today ───────────────────────────────┐
│  ‹nav: Today · Résumés · Network · Insights·  ›   │
│  Recommended for you (monitored targets):         │
│   A  Senior PM, Payments · Stripe · résumé ready  │
│   A  Lead PM, Risk · Visa · warm intro found ▸    │
│   B  Group PM · Adyen · 2-hop intro               │
│  Alerts: ‹2 new› — "a better-fit role appeared"   │
│  Your market value: ↑ 8% vs 6 mo ago ▸            │
└───────────────────────────────────────────────────┘
```
*Notes:* Alerts rare + explained. Snooze/tune per target.

### W-108 — Network / warm intros `→ FRD-C §4.13, §4.14`
```
┌──────────── Network → Stripe ──────────────────┐
│  Shortest warm paths:                           │
│   You → Ali (ex-colleague) → Sara @ Stripe ★    │
│      strength ▰▰▰▰▱   ▸ draft intro request     │
│   You → Omar → Lin @ Stripe   strength ▰▰▱▱▱    │
│  [ Import connections (consented) ]              │
│  Drafted message (your voice):  ( editable )     │
└─────────────────────────────────────────────────┘
```

### W-109 — Convert (follow-up + offer eval) `→ FRD-C §4.20, §4.22`
```
┌──── Application: Stripe — Senior PM ────────────┐
│  Status: Interviewing (R2)   ‹timeline›         │
│  Follow-up due → [ Draft follow-up ]            │
│  ── Offer? ──                                   │
│  Paste offer → [ Evaluate ]                     │
│   Base vs market: p60  ·  levers: equity, sign  │
│   Honest take: "strong; push equity 10–15%"     │
└─────────────────────────────────────────────────┘
```

### W-110 — Portfolio / work-samples `→ FRD-C §4.25`
*Builder to add/host work samples (case studies, code, designs) with shareable link — the substance a weak résumé hides.*

### W-111 — Onboarding / first-run `→ FRD-C §4.91`
*Stepper: welcome → import résumé/network → pick target companies → first diagnosis. Resumable; owner-exempt.*

### W-112 — Account / usage / billing `→ FRD-P §4.76, §4.93`
```
┌──── Account ────────────────────────────────────┐
│  Plan: Pro $29/mo   ‹manage / cancel›            │
│  Usage: résumé builds 12/40 ▰▰▰▱▱▱▱▱             │
│  ⚠ approaching limit warns early                 │
│  Data: [ Export my data ]  [ Delete my account ] │
└──────────────────────────────────────────────────┘
```

### W-130 — Help center `→ FRD-C §4.100, FRD-P §4.85`
*Searchable KB + contextual in-product help drawer.*

---

## W-2xx — Employer

### W-201 — Employer home / JD writer (free front door) `→ FRD-E §4.30`
```
┌──────────── Employer · Trajct ─────────────────────┐
│  Write a job description (free)                     │
│  ( role title )  ( level ▾ )  ( 3 must-haves )      │
│                 [ Generate JD ★ ]                   │
│  ── output ──                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │  Senior Backend Engineer …(editable JD)…       │ │
│  │  ▸ inclusivity check: 2 suggestions            │ │
│  │  ▸ suggested skills · salary range hint        │ │
│  └───────────────────────────────────────────────┘ │
│  [ Post / share ]   [ Upgrade to screen → W-203 ]  │
└─────────────────────────────────────────────────────┘
```

### W-202 — Candidate pipeline (workflow) `→ FRD-E §4.38, §4.37`
```
┌──── Role: Senior Backend Eng ── pipeline ──────────┐
│  New(42)  Screening(8)  Interview(3)  Offer(1)      │
│  ┌ New ─────────┐ ┌ Screening ──┐ ┌ Interview ─┐    │
│  │ ▢ A. Khan  A │ │ ▢ R. Patel  │ │ ▢ M. Diaz   │   │
│  │ ▢ S. Lee   B │ │  score 84   │ │ scorecard ✎ │   │
│  │ [bulk ▾]     │ │  ‹hidden gem★›│ │            │   │
│  └──────────────┘ └─────────────┘ └─────────────┘   │
│  bulk: [ reject w/ reason ]  [ schedule → W-205 ]   │
└──────────────────────────────────────────────────────┘
```
*Notes:* Hidden-gem flag visible. Bulk reject requires a reason (defensible).

### W-203 — Screening setup + results `→ FRD-E §4.34, §4.35, §4.36`
```
┌──── Screen candidates (substance) ─────────────────┐
│  Assessment: ·skills test ·AI interview ·behavioral │
│  Consent + region: MENA/APAC ✓  ‹compliance›        │
│  [ Invite N candidates ]                            │
│  ── results ──                                      │
│   R. Patel   ability 84  ★hidden gem (résumé weak)  │
│     ▸ evidence  ▸ rationale  ☐ advance ☐ reject     │
│     *(human confirms — AI recommends only)*         │
│   why-rejected auto-reason attached to each ▾       │
└─────────────────────────────────────────────────────┘
```

### W-204 — Recruiting analytics `→ FRD-E §4.39`
*TTH / CPH / quality / funnel charts; per-role + per-recruiter.*

### W-205 — Interview scheduling `→ FRD-E §4.41`
*Calendar sync; candidate self-schedule links; multi-round coordination.*

### W-206 — Org settings / seats / SSO `→ FRD-P §4.71, §4.72`
*Invite recruiters; assign roles (admin/recruiter/HM/viewer); enterprise SSO config.*

---

## W-3xx — Platform / Internal

### W-301 — Admin console (ops) `→ FRD-P §4.78`
```
┌──── Admin ───────────────────────────────────────┐
│  ( search users / accounts )                      │
│  Account: maya@…  Plan: Pro  Usage: 12/40         │
│  [ impersonate (audited) ]  [ adjust entitlement ] │
│  flags · recent activity ‹audit W-303›            │
└────────────────────────────────────────────────────┘
```

### W-302 — Cost & quality dashboard (tech-ops) `→ FRD-P §4.79, §4.82`
```
┌──── Platform health ──────────────────────────────┐
│  COGS/action ↓   margin/account ✓   queue depth ▰▱ │
│  AI quality: groundedness 97% · fabrication 0.4%   │
│  spend-cap hits: 3  · P95 latency 1.8s             │
│  alerts ‹2›  feature flags ▸                       │
└────────────────────────────────────────────────────┘
```

### W-303 — Compliance console `→ FRD-P §4.80`
*Decision logs (rationale+consent), data export/delete request queue, bias-audit export, region controls.*

### W-304 — Finance / billing reporting `→ FRD-P §4.75`
*MRR, revenue, per-account margin, invoices, churn.*

---

## Wireframe → FRD coverage index
| Screen | Feature(s) | FRD |
|---|---|---|
| W-001/002 | F-070, F-071, F-072 | P §4.70–72 |
| W-101 | F-001 | C §4.1 |
| W-102 | F-005 | C §4.5 |
| W-103 | F-002, F-073 | C §4.2 / P §4.73 |
| W-104 | F-002, F-004, F-006 | C §4.2/4.4/4.6 |
| W-105/106 | F-007, F-008, F-009 | C §4.7–9 |
| W-107 | F-015, F-016, F-018 | C §4.15/16/18 |
| W-108 | F-013, F-014 | C §4.13/14 |
| W-109 | F-020, F-022 | C §4.20/22 |
| W-110 | F-025 | C §4.25 |
| W-111 | F-091c | C §4.91 |
| W-112 | F-076, F-093c | P §4.76 / C §4.93 |
| W-130 | F-100c, F-085 | C §4.100 / P §4.85 |
| W-201 | F-030, F-031 | E §4.30/31 |
| W-202 | F-037, F-038 | E §4.37/38 |
| W-203 | F-034, F-035, F-036 | E §4.34–36 |
| W-204 | F-039 | E §4.39 |
| W-205 | F-041 | E §4.41 |
| W-206 | F-071, F-072 | P §4.71/72 |
| W-301 | F-078, F-083 | P §4.78/83 |
| W-302 | F-079, F-082 | P §4.79/82 |
| W-303 | F-080 | P §4.80 |
| W-304 | F-075 | P §4.75 |

---
*Wireframe Library v0.1.0 — referenced by FRD-Candidate, FRD-Employer, FRD-Platform. Redraw at hi-fi in Figma.*
