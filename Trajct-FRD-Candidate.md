# Functional Requirement Document — Trajct **Candidate**

> Paired with Candidate PRD (PRD-2026-001-C). Simpaisa-FRD-template structure, framework refs removed, Trajct domain.
> References the Wireframe Library (W-xxx) and the Shared Engine Spec (00). FR/AC/BR/SR/TC IDs are stable and trace to PRD F-IDs.

---

## 0. Document control
| Field | Value |
|---|---|
| FRD title | FRD — Trajct Candidate |
| FRD ID | FRD-2026-001-C |
| Version | 0.1.0 (Draft) |
| Status | Draft |
| Owner (Product) | Candidate PM |
| Owner (Engineering) | Candidate Tech Lead |
| Approver | HoP (tactical) / CPO (strategic) |
| Reviewers | Eng Lead, QA Lead, CISO delegate, Compliance PM |
| Source PRD | PRD-2026-001-C |
| Wireframes | Trajct Wireframe Library (W-1xx) |
| Depends on | Shared Engine (00); Platform FRD (auth/billing/notifications) |

### 0.1 Revision history
| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-06-03 | Rizwan Zafar | Initial candidate FRD; all features |

### 0.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| PM | Product owner | Pending |
| Tech Lead | Engineering owner | Pending |
| QA Lead | QA owner | Pending |
| CISO delegate | Security | Pending |
| Compliance PM | Regulatory | Pending |

---

## 1. Purpose & scope
### 1.1 Purpose
Specify, to an unambiguous level, every functional requirement of the Trajct **candidate** product: each feature's
rules, acceptance criteria, inputs/outputs, errors, states, NFRs, security, and test cases.

### 1.2 PRD boundary — what this FRD does NOT cover
- Business case, pricing rationale, personas, GTM → Candidate PRD.
- The shared AI engine internals (loop, persona synthesis, AI layer, discovery, trust wall) → Shared Engine Spec (00).
- Auth, billing, usage-metering, notification-delivery infrastructure → Platform FRD.

### 1.3 Scope — IN
All candidate-side features F-001…F-027 + candidate-facing cross-cutting (F-090c, F-091c, F-093c, F-096c, F-098c, F-099c, F-100c, F-101c).

### 1.4 Scope — OUT
Auto-apply; live-interview assistance; employer features; engine internals; platform back-office.

### 1.5 Assumptions & dependencies
| # | Assumption / dependency | If invalid, impact |
|---|---|---|
| A-1 | Engine F-052 (per-company persona) available for tailoring/prep | Diagnosis/prep degrade to generic |
| A-2 | Engine F-057 (AI layer) + metering available | No cost-governed generation |
| A-3 | Platform F-073 (payments) live for the paywall | No conversion |
| A-4 | Platform F-084 (notification infra) live for alerts | Monitoring can't notify |
| D-1 | Trust wall (F-060) enforced | Candidate-private data could leak |

### 1.6 Glossary
| Term | Definition |
|---|---|
| Diagnosis | The honest "why you're getting ghosted" output (fit score + reasons) |
| Fix | The per-company tailored résumé that resolves the diagnosed reasons |
| Build | One résumé/tailoring generation (a billable usage unit) |

---

## 2. Context & architecture
### 2.1 System context
```
Candidate ──▶ Trajct Candidate App ──▶ Shared Engine (persona, AI layer, discovery, loop)
                     │                          │
                     ├──▶ Platform (auth, billing, usage, notifications)
                     └──▶ Trust wall ──╳── (candidate-private data never crosses to Employer)
```
### 2.2 Actors & roles
| Actor | Type | Primary interactions |
|---|---|---|
| Candidate | External user | Diagnose, tailor, prep, monitor, convert, log outcomes |
| Trajct Engine | Internal system | Score, generate, research, learn |
| Platform | Internal system | Auth, bill, meter, notify |

### 2.3 Data flow summary
A candidate submits a résumé + target role. The app extracts/normalizes both, requests a fit score and reasons from
the engine (grounded in the company persona), and returns the diagnosis (transient until saved). On paywall conversion,
a tailored build is generated, metered, and stored. Outcomes the candidate logs are written with cite-markers and fed
to the engine. Candidate-private data never crosses the trust boundary to employers.

---

## 3. Feature catalog (master list)
| F-ID | Feature | Priority | Release | Wireframe |
|---|---|---|---|---|
| F-001 | Honest diagnostic | P0 | v1.0 | W-101 |
| F-002 | Per-company tailored résumé | P0 | v1.0 | W-103/104 |
| F-003 | Career profile builder | P0 | v1.0 | W-111 |
| F-004 | Chat-driven résumé editing | P0 | v1.0 | W-104 |
| F-005 | Rate-a-job by URL/JD | P0 | v1.0 | W-102 |
| F-006 | Résumé editor (templates/parse/export) | P1 | v1.1 | W-104 |
| F-007 | Company-specific interview prep | P0 | v1.0 | W-105 |
| F-008 | Mock interviews (voice/video) | P1 | v1.1 | W-106 |
| F-009 | Live interview tutor | P1 | v1.1 | W-105 |
| F-010 | STAR story bank → JD | P1 | v1.1 | W-105 |
| F-011 | LinkedIn profile optimization | P1 | v1.1 | — |
| F-012 | LinkedIn post generation + scheduling | P1 | v1.1 | — |
| F-013 | Outreach drafting + networking tracking | P1 | v1.1 | W-108 |
| F-014 | Warm-intro / people graph | P1 | v1.1 | W-108 |
| F-015 | Passive monitoring + alerts | P0 | v1.0 | W-107 |
| F-016 | Salary / market-value tracking | P1 | v1.1 | W-107 |
| F-017 | Skill-gap + learning path | P2 | v1.1 | — |
| F-018 | Application tracker + analytics | P1 | v1.1 | W-107 |
| F-019 | Proof-point library | P1 | v1.1 | — |
| F-020 | Follow-up cadence | P1 | v1.1 | W-109 |
| F-021 | Application form-assist (HITL) | P1 | v1.1 | — |
| F-022 | Offer evaluation | P1 | v1.1 | W-109 |
| F-023 | Relocation / visa signals | P2 | v1.1 | — |
| F-024 | Gap-framing / skill-translation | P2 | v1.1 | — |
| F-025 | Portfolio / work-samples | P1 | v1.1 | W-110 |
| F-026 | Candidate interview scheduling | P1 | v1.1 | — |
| F-027 | Career coach surface | P2 | v1.1 | — |
| F-090c | Candidate notifications | P0 | v1.0 | W-107 |
| F-091c | Onboarding / first-run | P0 | v1.0 | W-111 |
| F-093c | Data portability / delete | P0 | v1.0 | W-112 |
| F-096c | Job search & filtering | P1 | v1.1 | W-107 |
| F-098c | Localization | P1 | v1.1 | — |
| F-099c | Invite / referral loop | P2 | v1.1 | — |
| F-100c | Help center | P1 | v1.1 | W-130 |
| F-101c | Employer↔candidate messaging | P1 | vNext | — |

---

## 4. Feature specifications

### 4.1 Feature F-001 — Honest diagnostic
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.1 · **Wireframe:** W-101

**4.1.1 Description.** On submission of a résumé + target role, the system returns an overall fit/ATS score (0–100,
banded A–F) and a ranked list of the specific, evidenced reasons the candidate is unlikely to get a callback, grounded
in the per-company persona (Engine F-052). The diagnosis is free and shown before any signup wall.

**4.1.2 Triggers**
- Candidate submits résumé + target role/JD on W-101.
- Candidate re-runs the diagnosis after edits.

**4.1.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-001.1 | The system shall accept a résumé as one of: PDF, DOCX, TXT (≤5 MB) or pasted text (≤50,000 chars), and a target as a job URL or pasted JD (≤20,000 chars). | Must |
| FR-001.2 | The system shall validate that the uploaded résumé file is actually a résumé document (text-bearing, ≥150 extracted words, contains ≥2 of: contact block, experience, education, skills) and **reject non-résumé content** (e.g. images/selfies, blank files, unrelated documents) with code `NOT_A_RESUME`. | Must |
| FR-001.3 | The system shall return a fit score (integer 0–100) and an A–F band within 8 s p95 / 15 s p99 of a valid submission. | Must |
| FR-001.4 | The system shall return 3–7 ranked reasons, each with: a specific issue string, a concrete fix string, an `evidence_ref` (resolvable), and a `severity` (high/med/low). | Must |
| FR-001.5 | The system shall present the diagnosis without requiring authentication or payment; auth/paywall apply only at the "fix" action. | Must |
| FR-001.6 | The system shall adapt result *tone* by declared/inferred context (gentler, action-plan framing for `laid_off`/`fresher`) **without changing the underlying reasons or score**. | Should |
| FR-001.7 | The system shall, on any parse/validation failure, return a specific error and offer a manual-entry path; it shall **never** fabricate a score or reasons. | Must |
| FR-001.8 | The system shall attach a cite reference (Engine F-050) to every reason for outcome attribution. | Must |
| FR-001.9 | The system shall rate-limit the diagnose endpoint to **10 requests / hour / IP (unauthenticated)** and **30 / hour / authenticated user**, returning `429 RATE_LIMITED` with `Retry-After` (seconds). | Must |
| FR-001.10 | The system shall scan every uploaded file for malware before processing and reject infected files with `FILE_REJECTED_SECURITY`. | Must |
| FR-001.11 | The system shall hold an unsaved diagnosis transiently (TTL 24 h) keyed by `diag_token`, and expire it thereafter. | Must |
| FR-001.12 | The system shall detect the résumé language and, if unsupported, return results in English with a clear "limited-support" notice rather than failing. | Should |

**4.1.4 User stories & acceptance criteria**
*Story F-001-S1: As a candidate, I want the honest reasons I'm being ignored so I can fix them.*
- AC-001.1.1 — Given a valid 2-page PDF résumé + a Stripe PM job URL, when I diagnose, then within 8 s I see an integer score, an A–F band, and 3–7 reasons each with issue+fix+evidence+severity.
- AC-001.1.2 — Given I upload a **JPG/PNG selfie** as the "résumé", when I submit, then I receive `422 NOT_A_RESUME` with message "That looks like an image, not a résumé — upload a PDF/DOCX or paste your text," **no score is shown**, and I'm offered manual entry.
- AC-001.1.3 — Given I upload a **corrupt/unreadable PDF** (truncated bytes), when I submit, then I receive `422 PARSE_FAILED` with "We couldn't read that file — try re-exporting it or paste your text," and no score.
- AC-001.1.4 — Given I upload a **password-protected PDF**, when I submit, then I receive `422 FILE_LOCKED` with "This PDF is password-protected; remove the password or paste your text."
- AC-001.1.5 — Given I upload a **6 MB file**, when I submit, then I receive `400 FILE_TOO_LARGE` ("Max 5 MB") before any processing.
- AC-001.1.6 — Given I paste **80 words** of text, when I submit, then I receive `422 RESUME_TOO_SHORT` ("Need at least ~150 words to diagnose").
- AC-001.1.7 — Given I am flagged `laid_off`, when I see results, then the framing is action-plan toned while the reasons and score are identical to the neutral framing.
- AC-001.1.8 — Given I submit the diagnose endpoint an **11th time within an hour unauthenticated**, when I submit, then I receive `429 RATE_LIMITED` with `Retry-After`.
- AC-001.1.9 — Given the engine times out (>15 s), when I submit, then I receive `503 ENGINE_UNAVAILABLE` ("Try again in a moment") and **no fake score**.
- AC-001.1.10 — Given the résumé is in **French** and French is unsupported, when I diagnose, then I get English results with a "limited-support for French" notice (not a failure).

**4.1.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-001.1 | File size ≤ 5 MB | Upload (pre-process) | Reject `400 FILE_TOO_LARGE` |
| BR-001.2 | File type ∈ {pdf, docx, txt} OR pasted text | Upload | Reject `415 UNSUPPORTED_FORMAT` |
| BR-001.3 | Content must be a résumé (≥150 words, ≥2 résumé sections) | Post-extract | Reject `422 NOT_A_RESUME` |
| BR-001.4 | PDF must not be encrypted/locked | Extract | Reject `422 FILE_LOCKED` |
| BR-001.5 | File must pass malware scan | Pre-process | Reject `422 FILE_REJECTED_SECURITY` |
| BR-001.6 | A reason without a resolvable `evidence_ref` is not shown | Pre-render | Drop the reason; if <3 remain, return honest "few issues found" result |
| BR-001.7 | Diagnosis transient, TTL 24 h until saved | Service | Expire `diag_token` |
| BR-001.8 | Rate limit: 10/h/IP (anon), 30/h/user | Gateway | `429 RATE_LIMITED` + `Retry-After` |
| BR-001.9 | Score is integer 0–100; band mapping A≥85, B 70–84, C 55–69, D 40–54, F<40 | Scoring | Clamp + map |

**4.1.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| resume_file | file | Y* | pdf/docx/txt, ≤5 MB | resume.pdf | Multipart upload |
| resume_text | string | Y* | ≤50,000 chars, ≥150 words | "John Doe…" | Paste (*one of file/text required) |
| target | string | Y | URL (`https://…`) or JD text ≤20,000 chars | https://stripe.com/jobs/123 | Paste |
| context | enum | N | `employed`\|`laid_off`\|`fresher`\|`switcher`\|`returner`\|`unknown` | laid_off | Declared/inferred |
| locale | string | N | BCP-47 (e.g. `en`, `ar`) | en | Header/inferred |

**4.1.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| score | int | Y | 0–100 |
| band | enum | Y | A/B/C/D/F |
| reasons[] | array | Y | `{issue:string, fix:string, evidence_ref:string, severity:high|med|low}` (3–7 items) |
| confidence | enum | Y | high/med/low (low if JD unparsed) |
| diag_token | uuid | Y | transient handle for the fix step (TTL 24 h) |
| locale_notice | string | N | present if results downgraded to English |

**Error responses**
| HTTP | Code | When | Message (user-facing) | Retryable |
|---|---|---|---|---|
| 400 | FILE_TOO_LARGE | >5 MB | "Max file size is 5 MB." | No |
| 400 | MISSING_INPUT | no résumé or no target | "Add your résumé and a target role." | No |
| 415 | UNSUPPORTED_FORMAT | not pdf/docx/txt | "Use PDF, DOCX, TXT, or paste your text." | No |
| 422 | NOT_A_RESUME | content isn't a résumé (e.g. image/selfie, blank, unrelated) | "That looks like an image, not a résumé." | No (manual path) |
| 422 | PARSE_FAILED | corrupt/unreadable file | "We couldn't read that file — re-export or paste text." | No (manual path) |
| 422 | FILE_LOCKED | encrypted PDF | "This PDF is password-protected." | No |
| 422 | RESUME_TOO_SHORT | <150 words | "Need at least ~150 words to diagnose." | No |
| 422 | FILE_REJECTED_SECURITY | malware scan fail | "This file was blocked for security." | No |
| 429 | RATE_LIMITED | over rate limit | "Too many requests — try again shortly." (+`Retry-After`) | Yes (after Retry-After) |
| 503 | ENGINE_UNAVAILABLE | engine down/timeout | "Try again in a moment." | Yes (backoff) |

**4.1.8 State model**
```
[*] → Received → Validating → Extracting → Scoring → Diagnosed → (Saved | Expired)
Received→Validating: size/type/malware checks (≤500ms)
Validating→Extracting: passes BR-001.1..5
Validating→[*]: validation fail → error response (no state persisted)
Extracting→Scoring: résumé+target extracted (NOT_A_RESUME/PARSE_FAILED branch to error)
Scoring→Diagnosed: engine returns ≤8s p95
Diagnosed→Saved: candidate saves/authenticates
Diagnosed→Expired: 24h TTL elapses
```

**4.1.9 Sequence (happy path)**
```
Cand→App: POST /diagnose (resume_file|text, target, context?)
App→App: validate(size,type,malware) → extract(resume,JD) → assert is_resume
App→Engine: score(resume_struct, persona[target])
Engine→App: {score, reasons[+evidence_ref +cite], confidence}
App→Store: put(diag_token, result, ttl=24h)
App→Cand: 200 {score, band, reasons[], confidence, diag_token}
Cand→App: "fix all" → W-103 (auth+paywall) → F-002
```

**4.1.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Image/selfie uploaded as résumé | `422 NOT_A_RESUME`; offer manual entry; no score |
| Corrupt/truncated PDF | `422 PARSE_FAILED`; "re-export or paste"; no score |
| Password-protected PDF | `422 FILE_LOCKED`; ask to remove password |
| Scanned-image PDF (no text layer) | Attempt OCR; if <150 words extracted → `422 RESUME_TOO_SHORT` |
| Blank / whitespace-only file | `422 RESUME_TOO_SHORT` |
| File >5 MB | `400 FILE_TOO_LARGE` before processing |
| Malware-positive file | `422 FILE_REJECTED_SECURITY`; quarantine; alert security |
| Résumé OK, JD URL unfetchable | Diagnose vs role title only; `confidence=low`; note it |
| Both unparseable | `422`; manual-entry path; no score |
| Over rate limit | `429` + `Retry-After`; never queue silently |
| Engine timeout (>15s) | `503`; "try again"; never a fake score |
| Extremely strong résumé | Return honest "few issues — here's the edge"; never empty flattery |
| Non-English résumé, unsupported | English results + `locale_notice`; not a failure |
| Same résumé re-submitted unchanged | Return cached result within TTL (idempotent on content hash) |
| HTML/script injected in pasted text | Sanitize; never execute; treat as text |
| Extremely long pasted text (>50k) | `400`/truncate-with-notice per BR-001.1 |

**4.1.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-001.1 | Latency | Score+reasons ≤8 s p95, ≤15 s p99 | Synthetic probes /60s |
| NFR-001.2 | Quality | Groundedness ≥95%; fabrication <1% | Eval harness (engine) |
| NFR-001.3 | Availability | 99.9% monthly for the diagnose endpoint | Uptime monitor |
| NFR-001.4 | Throughput | Sustain 50 diagnoses/sec at peak | Load test @125% |
| NFR-001.5 | Robustness | 100% of malformed inputs return a typed error (never a 500/blank) | Fuzz test |

**4.1.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-001.1 | Résumé content encrypted at rest (AES-256) + in transit (TLS 1.3) |
| SR-001.2 | Transient diagnosis never exposed to any employer endpoint (trust wall F-060) |
| SR-001.3 | PII never logged in plaintext; résumé text masked in logs |
| SR-001.4 | Every uploaded file malware-scanned before processing; infected files quarantined |
| SR-001.5 | Uploaded files stored with random keys; no user-controlled path/filename in storage |
| SR-001.6 | Pasted input sanitized against XSS/script injection |

**4.1.13 Compliance & regulatory traceability**
| Regulation/control | FR/SR IDs |
|---|---|
| Data minimization (GDPR/PDPB-class) | SR-001.1, BR-001.7 |
| Honest-AI / no fabrication | FR-001.7, NFR-001.2 |
| File-upload security (OWASP) | FR-001.10, SR-001.4/.5 |

**4.1.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| diagnosis_completed_total | Counter | band | — |
| diagnosis_latency_ms | Histogram | — | p95>8s 5m = P2 |
| diagnosis_error_total | Counter | code | NOT_A_RESUME spike = UX issue |
| diagnosis_parse_fail_rate | Gauge | — | >10% 10m = P2 |
| diagnosis_fabrication_flag_rate | Gauge | — | >1% = P1 |
| diagnosis_ratelimit_total | Counter | auth/anon | spike = abuse |
| diagnosis_malware_block_total | Counter | — | any = security review |
Logs must include: `trace_id`, `user_id|anon_id`, `diag_token`, `input_type`, `result_code` (never raw résumé text).

**4.1.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-001.1 | Happy path | Valid 2-page PDF + Stripe PM URL | 200; score(int) + A–F + 3–7 reasons w/ evidence, ≤8s | FR-001.3/.4, AC-001.1.1 | Integration |
| TC-001.2 | **Image instead of résumé** | Upload `selfie.jpg` | `422 NOT_A_RESUME`; no score; manual-entry offered | FR-001.2, AC-001.1.2 | Integration |
| TC-001.3 | **Corrupt file** | Truncated/garbled `.pdf` | `422 PARSE_FAILED`; no score | FR-001.7, AC-001.1.3 | Integration |
| TC-001.4 | Password-protected PDF | Encrypted PDF | `422 FILE_LOCKED` | BR-001.4, AC-001.1.4 | Unit |
| TC-001.5 | Oversize file | 6 MB PDF | `400 FILE_TOO_LARGE` pre-process | BR-001.1, AC-001.1.5 | Unit |
| TC-001.6 | Too-short paste | 80-word paste | `422 RESUME_TOO_SHORT` | BR-001.3, AC-001.1.6 | Unit |
| TC-001.7 | Wrong file type | `.exe` / `.csv` | `415 UNSUPPORTED_FORMAT` | BR-001.2 | Unit |
| TC-001.8 | Malware file | EICAR test file | `422 FILE_REJECTED_SECURITY`; quarantined; security alert | FR-001.10, SR-001.4 | Integration |
| TC-001.9 | **Rate limit** | 11th anon request in 1h | `429 RATE_LIMITED` + `Retry-After` | FR-001.9, AC-001.1.8 | Integration |
| TC-001.10 | Engine down | Engine returns timeout | `503 ENGINE_UNAVAILABLE`; no fake score | FR-001.7, AC-001.1.9 | E2E |
| TC-001.11 | Tone adaptation | context=laid_off | Action-plan tone; identical reasons/score vs neutral | FR-001.6, AC-001.1.7 | Unit |
| TC-001.12 | No-auth diagnosis | Anon user | Diagnosis returned without login; fix gated | FR-001.5, AC-001.1.4(prev) | E2E |
| TC-001.13 | JD URL unfetchable | Valid résumé + dead URL | Diagnose vs title; `confidence=low` + note | edge table | Integration |
| TC-001.14 | Scanned-image PDF | PDF with no text layer | OCR attempt; if <150 words → `RESUME_TOO_SHORT` | edge table | Integration |
| TC-001.15 | XSS in pasted text | `<script>` in paste | Sanitized; treated as text; no execution | SR-001.6 | Security |
| TC-001.16 | Unsupported language | French résumé | English results + `locale_notice` | FR-001.12, AC-001.1.10 | Integration |
| TC-001.17 | Strong résumé | Excellent résumé | Honest "few issues + edge"; never empty/flattery | edge table | Unit |
| TC-001.18 | Idempotent re-submit | Same content hash within TTL | Cached result returned | edge table | Integration |
| TC-001.19 | Trust-wall | Attempt to read diag via employer endpoint | Denied; not exposed | SR-001.2 | Security |
| TC-001.20 | Fuzz/malformed | Random bytes, empty multipart, huge headers | Typed error, never 500/blank | NFR-001.5 | Fuzz |

**4.1.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-001.1 | Diagnostic-led vs résumé-led framing (A/B) | PM | Open |

---

### 4.2 Feature F-002 — Per-company tailored résumé (the fix)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8 · **Wireframe:** W-103/104

**4.2.1 Description.** Generates a résumé tailored to the target company/role that resolves the reasons surfaced by the
diagnostic (F-001), grounded in the company persona (Engine F-052) and the user's master profile (F-003), in the
user's calibrated voice (F-055). This is the paid "fix" — a billable build, metered and spend-capped.

**4.2.2 Triggers**
- Candidate selects "Fix all 5" after a diagnosis (W-103) following auth + paywall conversion.
- Candidate selects "Tailor for this" from a rated job (W-102) or workspace (W-104).

**4.2.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-002.1 | The system shall generate a tailored résumé that explicitly resolves each diagnosed reason, within 60 s p95 / 90 s p99. | Must |
| FR-002.2 | The system shall verify the user holds a valid entitlement before generating; otherwise return `402 PAYMENT_REQUIRED`. | Must |
| FR-002.3 | The system shall meter each successful build as 1 usage unit and decrement the plan quota (Platform F-076). | Must |
| FR-002.4 | The system shall enforce the per-account halting spend cap (Platform F-077); on ceiling, return `423 COST_CEILING_HIT` and **not** generate. | Must |
| FR-002.5 | The system shall ground all content in the company persona + the user's master profile; **no experience, skill, title, date, or metric may appear that is not traceable to the user profile**. | Must |
| FR-002.6 | The system shall produce content in the user's calibrated voice (F-055) when ≥1 writing sample exists; else a default professional voice, and offer calibration. | Should |
| FR-002.7 | The system shall store each build as an immutable, versioned artifact linked to the application/job, with the cite-set used. | Must |
| FR-002.8 | The system shall run a post-generation fabrication scan; any ungrounded claim is removed and flagged, and the build is regenerated up to 2 times before returning `409 GENERATION_QUALITY` if it cannot ground. | Must |
| FR-002.9 | The system shall rate-limit builds to plan quota and a hard ceiling of 5 builds/minute/user (anti-runaway). | Must |

**4.2.4 User stories & acceptance criteria**
*Story F-002-S1: As a converted candidate, I want the rewritten résumé that fixes my diagnosed problems.*
- AC-002.1.1 — Given a valid entitlement + a diagnosis with 5 reasons, when I request the fix, then within 60 s I receive a tailored résumé that addresses each of the 5 reasons, saved as a new version linked to the job.
- AC-002.1.2 — Given **no voice samples**, when generating, then a default professional voice is used and I'm offered voice calibration (F-055).
- AC-002.1.3 — Given my account has **hit its cost ceiling**, when I request a build, then I receive `423 COST_CEILING_HIT` with a clear message and **no résumé is generated or charged**.
- AC-002.1.4 — Given I have **0 quota remaining** but am under the cost ceiling, when I request a build, then I receive `409 QUOTA_EXCEEDED` with an upsell, not a hard error.
- AC-002.1.5 — Given the model tries to **add a job I never had**, when the fabrication scan runs, then that content is removed; if it can't be grounded after 2 retries, I receive `409 GENERATION_QUALITY` and am not charged.
- AC-002.1.6 — Given I have **no entitlement** (free user), when I request the fix, then `402 PAYMENT_REQUIRED` and I'm routed to the paywall (W-103).
- AC-002.1.7 — Given a **very thin profile** (1 job, no detail), when I request a fix, then the system asks me to add detail rather than inventing it, and does not consume a build unit.

**4.2.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-002.1 | No content may appear that is not traceable to the user profile (anti-fabrication) | Post-gen scan | Remove + flag; regen ≤2; else `409 GENERATION_QUALITY` |
| BR-002.2 | Valid entitlement required | Pre-gen | `402 PAYMENT_REQUIRED` |
| BR-002.3 | Quota > 0 required (else upsell) | Pre-gen | `409 QUOTA_EXCEEDED` |
| BR-002.4 | Under cost ceiling required | Pre-gen | `423 COST_CEILING_HIT` (no gen, no charge) |
| BR-002.5 | Build counts as 1 usage unit only on success | Post-gen | Decrement on 200 only |
| BR-002.6 | ≤5 builds/min/user | Gateway | `429 RATE_LIMITED` |
| BR-002.7 | Build artifact is immutable + versioned | Store | Append-only |

**4.2.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| diag_token | uuid | Y* | valid, unexpired (F-001) | 550e…-… | F-001 (*one of diag_token/job_id) |
| job_id | uuid | Y* | saved job | job_123 | Pipeline |
| profile_id | uuid | Y | user's master profile | prof_1 | F-003 |
| voice_id | uuid | N | calibration | voice_1 | F-055 |

**4.2.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| resume_version_id | uuid | Y | the new immutable version |
| content | object | Y | structured résumé |
| reasons_resolved[] | array | Y | mapping diagnosed reason → change made |
| cites[] | array | Y | evidence used (for outcome credit) |
| voice_used | enum | Y | calibrated / default |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 402 | PAYMENT_REQUIRED | no entitlement | "Start a plan to unlock the fix." | No |
| 409 | QUOTA_EXCEEDED | quota = 0 | "You've used your builds this period — upgrade." | No (upsell) |
| 409 | GENERATION_QUALITY | can't ground after retries | "We couldn't produce a grounded result — add profile detail." | No |
| 423 | COST_CEILING_HIT | account cost ceiling | "Temporarily paused — contact support." | No |
| 429 | RATE_LIMITED | >5/min | "Slow down a moment." (+Retry-After) | Yes |
| 503 | ENGINE_UNAVAILABLE | engine down | "Try again shortly." | Yes |

**4.2.8 State model**
```
[*] → Requested → EntitlementCheck → QuotaCheck → CostCheck → Generating → FabricationScan → (Saved | Rejected)
EntitlementCheck→[*]: 402 if none
QuotaCheck→[*]: 409 if 0
CostCheck→[*]: 423 if over ceiling
Generating→FabricationScan: model returns
FabricationScan→Generating: ungrounded found → regen (≤2)
FabricationScan→Rejected: still ungrounded after 2 → 409 GENERATION_QUALITY (no charge)
FabricationScan→Saved: clean → meter 1 unit → store version
```

**4.2.9 Sequence (happy path)**
```
Cand→App: POST /fix (diag_token|job_id, profile_id, voice_id?)
App→Platform: assert entitlement + quota + under-cap
App→Engine: generate(persona[target], profile, diagnosed_reasons, voice)
Engine→App: {content, cites}
App→App: fabrication_scan(content, profile) → clean
App→Platform: meter(1 unit)
App→Store: put(resume_version, immutable)
App→Cand: 200 {resume_version_id, content, reasons_resolved[], cites[]}
```

**4.2.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Free user (no entitlement) | `402`; route to paywall; no gen |
| Quota exhausted, under cost | `409 QUOTA_EXCEEDED`; upsell |
| Cost ceiling hit | `423`; no gen, no charge; ops alert |
| Model fabricates a job/metric | Removed by scan; regen ≤2; else `409 GENERATION_QUALITY`; not charged |
| Thin profile | Ask for detail; do not consume a unit; do not invent |
| Diagnosis vs profile conflict | Prefer truth; flag the conflict to the user |
| diag_token expired | `410 DIAG_EXPIRED`; re-run diagnosis |
| Engine timeout mid-gen | `503`; not charged; safe retry |
| Concurrent duplicate request (double-click) | Idempotent on (profile_id, target, content-hash); return same version |
| Voice samples present but low quality | Use them; flag low-confidence voice match |

**4.2.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-002.1 | Latency | Build ≤60 s p95, ≤90 s p99 | Probes |
| NFR-002.2 | Quality | Groundedness ≥95%; fabrication <1% post-scan ~0 | Eval harness |
| NFR-002.3 | Correctness | 100% of builds decrement quota exactly once (no double-charge) | Billing reconciliation |
| NFR-002.4 | Robustness | A failed/halted build never charges the user | Test + audit |

**4.2.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-002.1 | Build artifacts tenant-isolated; signed-URL access; candidate-private (trust wall) |
| SR-002.2 | Generated content never exposed to employer endpoints |
| SR-002.3 | No PII in logs; profile masked |

**4.2.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no fabrication | FR-002.5, FR-002.8, BR-002.1 |
| Billing integrity | FR-002.3, NFR-002.3/.4 |

**4.2.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| build_total | Counter | result | — |
| build_latency_ms | Histogram | — | p95>60s = P2 |
| build_fabrication_removed_rate | Gauge | — | >5% = P1 |
| build_quality_reject_rate | Gauge | — | >3% = P2 |
| build_cap_halt_total | Counter | — | spike = cost issue |
| build_double_charge_total | Counter | — | any>0 = P1 (billing bug) |

**4.2.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-002.1 | Happy path | Entitled user, 5-reason diagnosis | 200; résumé resolving all 5; new version; 1 unit metered | FR-002.1/.3, AC-002.1.1 | Integration |
| TC-002.2 | **Fabrication guard** | Force model to add a fake job | Fake content removed; grounded result or `409 GENERATION_QUALITY`; **not charged** | FR-002.8, AC-002.1.5 | Integration |
| TC-002.3 | **Cost-ceiling halt** | Account at ceiling | `423 COST_CEILING_HIT`; no gen; no charge | FR-002.4, AC-002.1.3 | Integration |
| TC-002.4 | Quota exhausted | quota=0, under cap | `409 QUOTA_EXCEEDED` + upsell | BR-002.3, AC-002.1.4 | Integration |
| TC-002.5 | No entitlement | Free user | `402 PAYMENT_REQUIRED` → paywall | FR-002.2, AC-002.1.6 | E2E |
| TC-002.6 | Thin profile | 1-job profile | Asks for detail; no unit consumed; no invention | edge table, AC-002.1.7 | Integration |
| TC-002.7 | No voice samples | voice absent | Default voice; calibration offered | FR-002.6, AC-002.1.2 | Unit |
| TC-002.8 | Expired diag_token | stale token | `410 DIAG_EXPIRED` | edge table | Unit |
| TC-002.9 | Double-click | duplicate concurrent request | Idempotent; one version; one charge | edge table, NFR-002.3 | Integration |
| TC-002.10 | Engine timeout | engine down mid-gen | `503`; not charged; safe retry | edge table | E2E |
| TC-002.11 | Rate limit | 6 builds in 1 min | `429 RATE_LIMITED` | BR-002.6 | Integration |
| TC-002.12 | Trust-wall | employer endpoint reads build | denied | SR-002.2 | Security |
| TC-002.13 | Billing integrity | failed build | quota NOT decremented; no charge | NFR-002.4 | Integration |

---

### 4.3 Feature F-003 — Career profile builder
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.1 · **Wireframe:** W-111

**4.3.1 Description.** Ingests the user's career documents (CV, past JDs, portfolio links), classifies and extracts
them into a single structured master profile (experience, skills, keywords, education, stories) that is the substrate
for every downstream candidate feature; surfaces prioritized profile-improvement recommendations.

**4.3.2 Triggers**
- New user during onboarding (W-111) uploads/pastes career documents.
- Existing user adds a document or edits the profile.

**4.3.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-003.1 | The system shall accept up to 10 documents per user (PDF/DOCX/TXT ≤5 MB each) plus pasted text and portfolio URLs. | Must |
| FR-003.2 | The system shall extract structured entities (name, contact, roles, dates, skills, education) via NER and classify each document by type. | Must |
| FR-003.3 | The system shall merge all sources into ONE master profile, de-duplicating overlapping roles/skills. | Must |
| FR-003.4 | The system shall make every profile field user-editable and persist edits as a new profile version. | Must |
| FR-003.5 | The system shall generate prioritized improvement recommendations (missing quantification, gaps, weak summary), using heuristics where possible to avoid LLM cost. | Should |
| FR-003.6 | The system shall validate uploads as career documents and reject non-career content (e.g. an image, an invoice) with `NOT_A_CAREER_DOC`. | Must |
| FR-003.7 | The system shall flag and reconcile conflicting facts across documents (e.g. two different end-dates for one role) by asking the user, not guessing. | Must |

**4.3.4 User stories & acceptance criteria**
*Story F-003-S1: As a new candidate, I want my documents turned into one editable profile that powers everything.*
- AC-003.1.1 — Given I upload a CV (PDF), when processed, then a structured profile (experience/skills/keywords/education) is created and fully editable.
- AC-003.1.2 — Given I upload **two CVs with overlapping roles**, when merged, then duplicate roles are de-duplicated into one, not listed twice.
- AC-003.1.3 — Given an upload that **isn't a career doc** (e.g. a photo), when processed, then `422 NOT_A_CAREER_DOC` and it's excluded; other valid docs still process.
- AC-003.1.4 — Given **conflicting end-dates** for the same role across two docs, when merging, then I'm asked to confirm which is correct (no silent guess).
- AC-003.1.5 — Given a profile with no quantified achievements, when built, then recommendations list "add metrics to your top roles."
- AC-003.1.6 — Given a **corrupt document**, when processed, then `422 PARSE_FAILED` for that doc; valid docs still process; partial profile is created.

**4.3.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-003.1 | ≤10 docs/user; ≤5 MB each; pdf/docx/txt | Upload | Reject `400`/`415` per item |
| BR-003.2 | Doc must be career-related (CV/JD/portfolio) | Post-extract | `422 NOT_A_CAREER_DOC` (item-level) |
| BR-003.3 | One master profile per user; merges are de-duplicated | Merge | Enforce uniqueness on (role, company, dates) |
| BR-003.4 | Conflicting facts require user resolution | Merge | Surface conflict; do not auto-pick |
| BR-003.5 | Profile edits are versioned (append-only history) | Save | New version |

**4.3.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| documents[] | file[] | Y* | ≤10, pdf/docx/txt ≤5 MB | cv.pdf | Upload (*one source required) |
| pasted_text | string | N | ≤50k chars | "…" | Paste |
| portfolio_urls[] | string[] | N | valid https, ≤5 | https://… | User |

**4.3.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| profile_id | uuid | Y | master profile |
| experience[] | array | Y | {role, company, start, end, bullets[]} |
| skills[] | array | Y | normalized |
| keywords[] | array | Y | extracted |
| education[] | array | Y | — |
| recommendations[] | array | Y | prioritized improvements |
| conflicts[] | array | N | unresolved facts needing user input |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 400 | TOO_MANY_DOCS | >10 docs | "Up to 10 documents." | No |
| 415 | UNSUPPORTED_FORMAT | bad type | "PDF/DOCX/TXT only." | No |
| 422 | NOT_A_CAREER_DOC | non-career content (item) | "This file isn't a career document." | No |
| 422 | PARSE_FAILED | corrupt (item) | "We couldn't read this file." | No |
| 503 | ENGINE_UNAVAILABLE | NER/AI down | "Try again shortly." | Yes |

**4.3.8 State model**
```
[*] → Ingesting → Extracting → Merging → (Conflicts? → AwaitingUser → ) Built → (Edited→Versioned)
Extracting: per-doc; item errors don't fail the batch
Merging→AwaitingUser: conflicts found
AwaitingUser→Built: user resolves
```

**4.3.9 Sequence (happy path)**
```
Cand→App: POST /profile (documents[], urls[])
App→App: per-doc validate + classify + NER
App→App: merge + dedupe → detect conflicts
App→Cand: 200 {profile, recommendations, conflicts?}
Cand→App: resolve conflicts / edit → new version
```

**4.3.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| One bad doc in a batch of good docs | Item-level error; others still process; partial profile |
| Image/non-career file | `422 NOT_A_CAREER_DOC` (item); excluded |
| Two CVs, overlapping roles | De-duplicate into one role |
| Conflicting dates/titles | Surface conflict; ask user; never guess |
| Scanned-image CV | OCR; if too little text → recommend manual entry |
| Empty/whitespace doc | Skip with item notice |
| >10 docs | `400 TOO_MANY_DOCS` |
| Portfolio URL dead | Note unreachable; don't fail profile |
| All docs fail | Offer full manual entry; no profile fabricated |

**4.3.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-003.1 | Latency | Parse+build ≤30 s p95 for ≤3 docs | Probes |
| NFR-003.2 | Accuracy | NER field accuracy ≥90% on a golden set | Eval |
| NFR-003.3 | Robustness | Item failure never fails the whole batch | Test |

**4.3.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-003.1 | Documents encrypted at rest + transit; tenant-isolated |
| SR-003.2 | Malware scan on every uploaded doc |
| SR-003.3 | Candidate-private (trust wall); not exposed to employers |

**4.3.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Data minimization | SR-003.1 |
| File-upload security | SR-003.2 |
| Honest-AI (no invented facts) | FR-003.7, BR-003.4 |

**4.3.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| profile_built_total | Counter | — | — |
| profile_parse_fail_rate | Gauge | — | >15% = P2 |
| profile_conflict_rate | Gauge | — | — |
| profile_not_career_doc_total | Counter | — | spike = UX confusion |

**4.3.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-003.1 | Extract entities | Valid CV PDF | Structured profile w/ experience/skills/keywords/education | FR-003.2, AC-003.1.1 | Integration |
| TC-003.2 | **De-dup merge** | Two CVs, overlapping role | One de-duplicated role | FR-003.3, AC-003.1.2 | Integration |
| TC-003.3 | **Non-career upload** | A photo as a doc | `422 NOT_A_CAREER_DOC`; others still process | FR-003.6, AC-003.1.3 | Integration |
| TC-003.4 | **Conflict resolution** | Two docs, different end-dates | Conflict surfaced; user asked; no guess | FR-003.7, AC-003.1.4 | Integration |
| TC-003.5 | **Corrupt doc in batch** | 1 corrupt + 2 valid | Item `PARSE_FAILED`; partial profile from valid | edge table, AC-003.1.6 | Integration |
| TC-003.6 | Recommendations | Profile lacking metrics | "Add metrics" recommendation | FR-003.5, AC-003.1.5 | Unit |
| TC-003.7 | Too many docs | 11 docs | `400 TOO_MANY_DOCS` | BR-003.1 | Unit |
| TC-003.8 | All docs fail | All corrupt | Full manual-entry path; no fabricated profile | edge table | Integration |
| TC-003.9 | Malware doc | EICAR file | Blocked; quarantined | SR-003.2 | Security |
| TC-003.10 | Scanned-image CV | No text layer | OCR; recommend manual if sparse | edge table | Integration |
| TC-003.11 | Trust-wall | employer reads profile | denied | SR-003.3 | Security |

---

### 4.4 Feature F-004 — Chat-driven résumé editing
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.1 · **Wireframe:** W-104

**4.4.1 Description.** The user types a natural-language instruction in a chat panel and the résumé updates
automatically — no manual editing. Three modes: `quick_tweak` (surgical, single Opus-class call, ~$0.05), `rebuild_section`,
and `full_rebuild`. Every change is visible, reversible, and explained; nothing is auto-sent.

**4.4.2 Triggers**
- User sends a chat instruction in the workspace (W-104).
- User clicks undo/redo, or switches modes.

**4.4.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-004.1 | The system shall classify each instruction into a mode (`quick_tweak`/`rebuild_section`/`full_rebuild`) and apply it to the current résumé version. | Must |
| FR-004.2 | The system shall apply a `quick_tweak` within 5 s p95 and render a visible diff of exactly what changed. | Must |
| FR-004.3 | The system shall rebuild only the named section on `rebuild_section`, leaving all other sections byte-identical. | Must |
| FR-004.4 | The system shall make every edit reversible via undo/redo (≥20-step history) and show a "what changed + why" note. | Must |
| FR-004.5 | The system shall never auto-send, auto-apply, or auto-submit the résumé anywhere. | Must |
| FR-004.6 | The system shall preserve all factual content (no fabricated experience introduced by an edit); the fabrication scan (F-002.8) runs on every rebuild. | Must |
| FR-004.7 | The system shall reject an edit applied to a stale version (optimistic concurrency) with `409 EDIT_CONFLICT` and offer to re-base. | Must |
| FR-004.8 | The system shall meter `rebuild_section`/`full_rebuild` as usage units (quick_tweak per fair-use), respecting the spend cap (F-077). | Must |
| FR-004.9 | The system shall refuse instructions that request fabrication ("add a Google job I never had") and explain why. | Must |

**4.4.4 User stories & acceptance criteria**
*Story F-004-S1: As a candidate, I want to edit my résumé by typing what I want changed.*
- AC-004.1.1 — Given "tighten bullet 2 in my current role," when I send it, then only that bullet changes, a diff is shown, and undo restores the prior text.
- AC-004.1.2 — Given "rebuild my experience section," when sent, then that section regenerates while summary/education/skills remain byte-identical; undo restores it.
- AC-004.1.3 — Given "add a Director role at Meta I never held," when sent, then the system **refuses** and explains it won't fabricate experience.
- AC-004.1.4 — Given two tabs editing the same résumé, when I save an edit on a **stale version**, then I get `409 EDIT_CONFLICT` and an option to re-base on the latest.
- AC-004.1.5 — Given an ambiguous instruction ("make it better"), when sent, then the system asks a clarifying question rather than guessing destructively.
- AC-004.1.6 — Given my account is **over the cost ceiling**, when I request a full_rebuild, then `423 COST_CEILING_HIT`, no edit applied.
- AC-004.1.7 — Given I undo 5 times then redo 3, then the résumé reflects exactly that history (no corruption).

**4.4.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-004.1 | Edits are version-based (optimistic concurrency on version_id) | Apply | `409 EDIT_CONFLICT` |
| BR-004.2 | No edit may introduce ungrounded content | Post-edit scan | Remove + flag; refuse fabrication requests |
| BR-004.3 | quick_tweak ≤ a small fair-use rate (60/hour/user); rebuilds metered | Gateway | `429 RATE_LIMITED` |
| BR-004.4 | Undo history depth ≥20 | Service | Trim oldest beyond cap |
| BR-004.5 | Instruction ≤2,000 chars | Input | Reject `400 INSTRUCTION_TOO_LONG` |

**4.4.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| version_id | uuid | Y | current résumé version | ver_9 | Workspace |
| instruction | string | Y | ≤2,000 chars | "tighten bullet 2" | User |
| mode | enum | N | auto/quick_tweak/rebuild_section/full_rebuild | auto | User |
| section | string | N | required for rebuild_section | "experience" | User |

**4.4.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| new_version_id | uuid | Y | resulting version |
| diff | object | Y | added/removed/changed spans |
| change_note | string | Y | "what changed + why" |
| mode_applied | enum | Y | resolved mode |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 400 | INSTRUCTION_TOO_LONG | >2,000 chars | "Keep instructions under 2,000 characters." | No |
| 400 | INSTRUCTION_UNCLEAR | unparseable intent | (asks a clarifying question) | No |
| 409 | EDIT_CONFLICT | stale version | "This résumé changed — re-base?" | Yes (after re-base) |
| 409 | FABRICATION_REFUSED | asks to invent content | "I won't add experience you don't have." | No |
| 423 | COST_CEILING_HIT | over cap | "Temporarily paused." | No |
| 429 | RATE_LIMITED | >60 tweaks/hr | "Slow down a moment." | Yes |
| 503 | ENGINE_UNAVAILABLE | AI down | "Try again shortly." | Yes |

**4.4.8 State model**
```
 résumé version chain: v1 → v2 → … (append-only)
edit: Current(vN) → Editing → Scanned → (vN+1 | Rejected)
Editing→Scanned: model returns
Scanned→Rejected: fabrication found / refused / conflict
Scanned→vN+1: clean; undo/redo navigate the chain
```

**4.4.9 Sequence (happy path)**
```
Cand→App: POST /edit (version_id, "tighten bullet 2")
App→App: classify mode = quick_tweak
App→Engine: tweak(current, instruction)
Engine→App: {content'}
App→App: fabrication_scan(content', profile) → clean
App→Store: append new_version
App→Cand: 200 {new_version_id, diff, change_note}
```

**4.4.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Fabrication request | `409 FABRICATION_REFUSED`; explain |
| Stale version (two tabs) | `409 EDIT_CONFLICT`; offer re-base |
| Ambiguous instruction | `400 INSTRUCTION_UNCLEAR`; ask to clarify; no destructive change |
| rebuild_section without section | Ask which section |
| Over cost ceiling | `423`; no edit |
| Undo past history start | No-op; "nothing to undo" |
| Redo after a new edit | Redo stack cleared (standard editor semantics) |
| Concurrent identical edits | Idempotent on (version_id, instruction-hash) |
| Engine timeout mid-edit | `503`; current version unchanged; safe retry |
| Injection in instruction | Sanitize; treat as text |

**4.4.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-004.1 | Latency | quick_tweak ≤5 s p95; rebuild_section ≤20 s; full_rebuild ≤60 s | Probes |
| NFR-004.2 | Integrity | rebuild_section leaves other sections byte-identical 100% | Diff test |
| NFR-004.3 | Quality | No fabrication introduced by an edit (post-scan ~0) | Eval |
| NFR-004.4 | Reliability | Undo/redo never corrupts the version chain | Property test |

**4.4.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-004.1 | Versions tenant-isolated; candidate-private (trust wall) |
| SR-004.2 | Instruction input sanitized (XSS/prompt-injection hardening) |

**4.4.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no fabrication | FR-004.6, FR-004.9, BR-004.2 |

**4.4.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| edit_total | Counter | mode | — |
| edit_latency_ms | Histogram | mode | quick p95>5s = P2 |
| edit_conflict_total | Counter | — | spike = concurrency UX issue |
| edit_fabrication_refused_total | Counter | — | — |

**4.4.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-004.1 | **Quick tweak + undo** | "tighten bullet 2" | only that bullet changes; diff shown; undo restores | FR-004.2/.4, AC-004.1.1 | Integration |
| TC-004.2 | **Section rebuild isolation** | "rebuild experience" | experience changes; other sections byte-identical | FR-004.3, AC-004.1.2, NFR-004.2 | Integration |
| TC-004.3 | **Fabrication refusal** | "add a Meta Director role I never had" | `409 FABRICATION_REFUSED`; no change | FR-004.9, AC-004.1.3 | Integration |
| TC-004.4 | **Edit conflict** | edit on a stale version | `409 EDIT_CONFLICT`; re-base offered | FR-004.7, AC-004.1.4 | Integration |
| TC-004.5 | Ambiguous instruction | "make it better" | clarifying question; no destructive change | edge table, AC-004.1.5 | Unit |
| TC-004.6 | Cost ceiling | over cap + full_rebuild | `423 COST_CEILING_HIT` | FR-004.8, AC-004.1.6 | Integration |
| TC-004.7 | Undo/redo integrity | undo 5, redo 3 | exact history; no corruption | NFR-004.4, AC-004.1.7 | Property |
| TC-004.8 | Instruction too long | 2,001 chars | `400 INSTRUCTION_TOO_LONG` | BR-004.5 | Unit |
| TC-004.9 | Rate limit | 61 tweaks/hr | `429 RATE_LIMITED` | BR-004.3 | Integration |
| TC-004.10 | Injection | `<script>` in instruction | sanitized; no execution | SR-004.2 | Security |
| TC-004.11 | No auto-send | any edit | nothing is submitted anywhere | FR-004.5 | Unit |
| TC-004.12 | Engine timeout | engine down | `503`; version unchanged | edge table | E2E |

**4.4.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-004.1 | quick_tweak fair-use limit — 60/hr right, or quota-based? | PM | Open |

---

### 4.5 Feature F-005 — Rate-a-job by URL/JD
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.1 · **Wireframe:** W-102

**4.5.1 Description.** The candidate pastes any job URL or JD text (a job found anywhere, not just discovered ones);
the system extracts the JD and returns an instant 6-dimension fit rating with an overall band, savable into the
candidate's pipeline. Ephemeral until saved.

**4.5.2 Triggers**
- Candidate pastes a job URL or JD on W-102.
- Candidate saves a rated job or selects "tailor for this."

**4.5.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-005.1 | The system shall extract a JD from a supported job URL or pasted text (≤20,000 chars) via the engine extractor. | Must |
| FR-005.2 | The system shall return a 6-dimension fit rating (role alignment, stack coverage, evidence, seniority, logistics, learning curve) + an overall A–F band within 6 s p95. | Must |
| FR-005.3 | The system shall hold the rating ephemerally (rate_token, TTL 24 h) until the candidate saves it. | Must |
| FR-005.4 | The system shall allow "save to pipeline" (→F-018) and "tailor for this" (→F-002) from a rating. | Must |
| FR-005.5 | The system shall validate the URL/text is a job posting and reject non-job content with `NOT_A_JOB_POSTING`. | Must |
| FR-005.6 | The system shall rate-limit to 20 ratings/hour/user, `429` with Retry-After. | Must |
| FR-005.7 | The system shall show a per-dimension explanation for the rating (explainability). | Must |

**4.5.4 User stories & acceptance criteria**
*Story F-005-S1: As a candidate, I want to rate any job I find so I know if it's worth pursuing.*
- AC-005.1.1 — Given a valid job URL, when I rate, then within 6 s I see a 6-dimension rating + overall band + per-dimension reasons, savable.
- AC-005.1.2 — Given an **unfetchable URL** (404/blocked), when I rate, then an honest error + a "paste the JD instead" fallback.
- AC-005.1.3 — Given I paste a **non-job page** (e.g. a news article), when I rate, then `422 NOT_A_JOB_POSTING`.
- AC-005.1.4 — Given a rating, when I "save to pipeline," then it appears in my tracker (F-018).
- AC-005.1.5 — Given a **JS-rendered career page** the simple fetch can't read, when I rate, then the system falls back to a render-capable fetch or asks me to paste the JD — never returns a blank rating.
- AC-005.1.6 — Given I rate the **21st job in an hour**, then `429 RATE_LIMITED`.

**4.5.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-005.1 | Input must resolve to a job posting | Post-extract | `422 NOT_A_JOB_POSTING` |
| BR-005.2 | Rating ephemeral (TTL 24 h) until saved | Service | Expire rate_token |
| BR-005.3 | 20 ratings/hour/user | Gateway | `429 RATE_LIMITED` |
| BR-005.4 | URL must be http(s) and ≤2,048 chars | Input | `400 BAD_URL` |

**4.5.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| job_url | string | Y* | https, ≤2,048 chars | https://stripe.com/jobs/1 | Paste (*one of url/text) |
| jd_text | string | Y* | ≤20,000 chars | "We are hiring…" | Paste |

**4.5.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| rate_token | uuid | Y | ephemeral handle |
| overall_band | enum | Y | A–F |
| dimensions[] | array | Y | {name, score, explanation} ×6 |
| company | string | N | parsed |
| role | string | N | parsed |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 400 | BAD_URL | malformed URL | "Enter a valid job link." | No |
| 422 | EXTRACT_FAILED | URL unfetchable | "Couldn't open that link — paste the JD." | No (paste path) |
| 422 | NOT_A_JOB_POSTING | not a job | "That doesn't look like a job posting." | No |
| 429 | RATE_LIMITED | >20/hr | "Too many — try again shortly." (+Retry-After) | Yes |
| 503 | ENGINE_UNAVAILABLE | engine down | "Try again shortly." | Yes |

**4.5.8 State model**
```
[*] → Submitted → Extracting → Rating → Rated → (Saved | Expired)
Extracting→[*]: 422 on extract/not-a-job
Rated→Saved: candidate saves (→F-018)
Rated→Expired: 24h TTL
```

**4.5.9 Sequence (happy path)**
```
Cand→App: POST /rate (job_url|jd_text)
App→Engine: extract_jd(url|text) → assert is_job
App→Engine: score_6dim(jd, profile)
Engine→App: {dimensions[+explanations], overall}
App→Store: put(rate_token, ttl=24h)
App→Cand: 200 {rate_token, overall_band, dimensions[]}
```

**4.5.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Unfetchable / 404 URL | `422 EXTRACT_FAILED`; paste-JD fallback |
| JS-rendered page (no static JD) | Render-capable fallback fetch; else ask to paste; never blank |
| Non-job content | `422 NOT_A_JOB_POSTING` |
| Login-walled JD | Can't fetch → ask to paste |
| Paste with HTML/markup | Strip; extract JD text |
| Over rate limit | `429` + Retry-After |
| Duplicate rate of same URL | Idempotent within TTL (content hash) |
| Extremely long JD (>20k) | Truncate-with-notice |
| Engine down | `503`; no fake rating |

**4.5.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-005.1 | Latency | Rating ≤6 s p95 | Probes |
| NFR-005.2 | Quality | Each dimension has a non-empty, grounded explanation | Eval |
| NFR-005.3 | Robustness | Never returns a blank/zero rating on a real job | Test |

**4.5.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-005.1 | URL fetch via a hardened fetcher (SSRF protection; no internal addresses) |
| SR-005.2 | Rating candidate-private (trust wall) |

**4.5.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| SSRF / fetch security | SR-005.1 |
| Honest-AI (explainable, no blank) | FR-005.7, NFR-005.3 |

**4.5.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| rate_total | Counter | result | — |
| rate_latency_ms | Histogram | — | p95>6s = P2 |
| rate_extract_fail_rate | Gauge | source | >25% = P2 |
| rate_not_job_total | Counter | — | spike = UX confusion |

**4.5.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-005.1 | **URL rate happy path** | Valid Stripe job URL | 6-dim rating + band + explanations ≤6 s; savable | FR-005.2/.7, AC-005.1.1 | Integration |
| TC-005.2 | **Unfetchable URL → paste** | dead/blocked URL | `422 EXTRACT_FAILED`; paste fallback | FR-005.1, AC-005.1.2 | Integration |
| TC-005.3 | **Non-job page** | news-article URL | `422 NOT_A_JOB_POSTING` | FR-005.5, AC-005.1.3 | Integration |
| TC-005.4 | Save to pipeline | rate then save | appears in tracker | FR-005.4, AC-005.1.4 | Integration |
| TC-005.5 | **JS-rendered page** | client-rendered career page | render-fetch fallback or paste prompt; never blank | edge table, AC-005.1.5 | Integration |
| TC-005.6 | Rate limit | 21 ratings/hr | `429 RATE_LIMITED` | BR-005.3, AC-005.1.6 | Integration |
| TC-005.7 | **SSRF attempt** | URL = `http://169.254.169.254/…` | blocked by hardened fetcher | SR-005.1 | Security |
| TC-005.8 | Bad URL | "not a url" | `400 BAD_URL` | BR-005.4 | Unit |
| TC-005.9 | Idempotent re-rate | same URL within TTL | cached rating | edge table | Integration |
| TC-005.10 | Login-walled JD | auth-required page | paste prompt | edge table | Integration |
| TC-005.11 | Engine down | engine timeout | `503`; no fake rating | edge table | E2E |

**4.5.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-005.1 | Which render-capable fetch fallback for JS pages? | Eng | Open |

---

### 4.6 Feature F-006 — Résumé editor (templates / parse / export)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-104

**4.6.1 Description.** A résumé editor that imports/parses existing résumés, offers professional + ATS-friendly
templates, manages a base résumé plus multiple tailored versions, and exports to PDF/DOCX/HTML on a
JSON-Resume-compatible schema for portability.

**4.6.2 Triggers**
- Open workspace (W-104); import a file; switch template; export; create/delete a version.

**4.6.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-006.1 | The system shall import and parse PDF/DOCX résumés (≤5 MB) into the editor's structured model. | Must |
| FR-006.2 | The system shall offer ≥6 templates (Classic, Modern, Minimal, ATS-Friendly, Creative, Timeline), each validated ATS-readable. | Must |
| FR-006.3 | The system shall maintain one base résumé and up to 50 tailored versions per user, each independently editable. | Must |
| FR-006.4 | The system shall export any version to PDF, DOCX, and HTML with layout fidelity matching the on-screen preview. | Must |
| FR-006.5 | The system shall persist résumé data in a JSON-Resume-compatible schema (for F-093c portability). | Should |
| FR-006.6 | The system shall preserve 100% of content when switching templates (no data loss; re-flow only). | Must |
| FR-006.7 | The system shall require confirmation before deleting a version linked to an active application. | Must |

**4.6.4 User stories & acceptance criteria**
- AC-006.1.1 — Given a version, when I export to PDF/DOCX/HTML, then the file matches the preview exactly.
- AC-006.1.2 — Given I switch templates, then all content is preserved and re-flowed (nothing dropped).
- AC-006.1.3 — Given I import a PDF, then a structured, editable résumé is created.
- AC-006.1.4 — Given a **corrupt PDF import**, then `422 PARSE_FAILED` + manual-entry fallback.
- AC-006.1.5 — Given a template that lacks a section my data has, when I switch, then that content renders in a sensible default block — never dropped.
- AC-006.1.6 — Given I try to delete a version **linked to an active application**, then I must confirm first.
- AC-006.1.7 — Given I attempt a **51st version**, then `409 VERSION_LIMIT` with guidance to archive old versions.

**4.6.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-006.1 | Import ≤5 MB, pdf/docx | Upload | `400`/`415` |
| BR-006.2 | ≤50 versions/user | Create | `409 VERSION_LIMIT` |
| BR-006.3 | Template switch must preserve all content | Switch | Render unmapped content in default block |
| BR-006.4 | Deleting an application-linked version needs confirm | Delete | Block until confirmed |
| BR-006.5 | Export rendered file ≤10 MB | Export | `413 EXPORT_TOO_LARGE` |

**4.6.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| file | file | N | pdf/docx ≤5 MB (import) | r.pdf | Upload |
| version_id | uuid | N | for export/edit | ver_3 | Workspace |
| template_id | enum | N | one of 6 | modern | User |
| export_format | enum | N | pdf/docx/html | pdf | User |

**4.6.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| version_id | uuid | Y | created/affected |
| rendered_file_url | string | N | signed URL (export) |
| json_resume | object | N | portable export |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 415 | UNSUPPORTED_FORMAT | not pdf/docx | "Use PDF or DOCX." | No |
| 422 | PARSE_FAILED | corrupt import | "Couldn't read that — paste your text." | No |
| 409 | VERSION_LIMIT | >50 versions | "Archive a version first." | No |
| 413 | EXPORT_TOO_LARGE | >10 MB render | "Export too large." | No |
| 500 | RENDER_FAILED | render engine error | "Export failed — retry." | Yes |

**4.6.8 State model**
```
Version: Draft → Saved → (Exported | Archived | Deleted*)
*Deleted requires confirm if app-linked
```

**4.6.9 Sequence (happy path)**
```
Cand→App: export(version_id, format=pdf)
App→Renderer: render(version, template)
Renderer→App: file
App→Store: put(file, signed-url, ttl)
App→Cand: 200 {rendered_file_url}
```

**4.6.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Corrupt PDF import | `422 PARSE_FAILED`; manual entry |
| Template missing a data section | Render in default block; never drop |
| Delete app-linked version | Require confirmation |
| >50 versions | `409 VERSION_LIMIT` |
| Huge résumé (many pages) → big export | `413` if >10 MB |
| Render engine crash | `500 RENDER_FAILED`; retry; keep version intact |
| Unicode/RTL content | Preserve in all exports (F-098c) |

**4.6.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-006.1 | Latency | Export render ≤10 s p95 | Probes |
| NFR-006.2 | Fidelity | Export matches preview (visual diff ≤2%) | Snapshot test |
| NFR-006.3 | Integrity | Template switch preserves 100% content | Diff test |

**4.6.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-006.1 | Rendered files tenant-isolated; signed-URL access; short TTL |
| SR-006.2 | No server-side template injection from user content |

**4.6.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Data portability (GDPR/PDPB) | FR-006.5 |

**4.6.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| export_total | Counter | format | — |
| export_render_fail_rate | Gauge | — | >2% = P2 |
| template_switch_total | Counter | template | — |

**4.6.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-006.1 | **Export fidelity** | version → PDF/DOCX/HTML | matches preview (visual diff ≤2%) | FR-006.4, AC-006.1.1, NFR-006.2 | Snapshot |
| TC-006.2 | **Template-switch preservation** | switch modern→classic | all content preserved | FR-006.6, AC-006.1.2 | Integration |
| TC-006.3 | **Corrupt import** | corrupt PDF | `422 PARSE_FAILED` + manual | AC-006.1.4 | Integration |
| TC-006.4 | Template missing section | data has "publications" | rendered in default block | BR-006.3, AC-006.1.5 | Integration |
| TC-006.5 | Delete app-linked version | linked version | confirm required | FR-006.7, AC-006.1.6 | Unit |
| TC-006.6 | Version limit | create 51st | `409 VERSION_LIMIT` | BR-006.2, AC-006.1.7 | Unit |
| TC-006.7 | Export too large | huge résumé | `413 EXPORT_TOO_LARGE` | BR-006.5 | Unit |
| TC-006.8 | RTL/Unicode export | Arabic content | preserved in PDF | edge table | Integration |
| TC-006.9 | Render crash | renderer error | `500`; retry; version intact | edge table | E2E |
| TC-006.10 | Template injection | malicious content in field | sanitized; no injection | SR-006.2 | Security |

**4.6.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-006.1 | Which render engine (Pandoc vs headless browser) for fidelity? | Eng | Open |

---

### 4.7 Feature F-007 — Company-specific interview prep
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.1 · **Wireframe:** W-105

**4.7.1 Description.** Produces an evidence-grounded interview brief for a target company — likely questions,
format/stages, what the company values, and suggested answer frameworks — grounded in the per-company persona
(Engine F-052), with each non-trivial claim cited. Honest about uncertainty; never claims insider/confidential content.

**4.7.2 Triggers**
- Candidate opens prep for an application/target (W-105).
- Re-runs after the company persona refreshes (F-054).

**4.7.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-007.1 | The system shall produce a company-grounded brief (likely questions, format/stages, values, answer frameworks) within 30 s p95. | Must |
| FR-007.2 | The system shall attach a resolvable research citation to each non-trivial claim. | Must |
| FR-007.3 | The system shall map suggested answers to the user's STAR stories (F-010) by id where available. | Should |
| FR-007.4 | The system shall explicitly label sections as "general guidance" when company research is thin, rather than fabricating specifics. | Must |
| FR-007.5 | The system shall never assert non-public/confidential or insider interview content. | Must |
| FR-007.6 | The system shall meter brief generation per fair-use (10/hour/user) and respect the spend cap. | Must |
| FR-007.7 | The system shall present conflicting sources as a noted uncertainty, not a single fabricated answer. | Must |

**4.7.4 User stories & acceptance criteria**
- AC-007.1.1 — Given a researched company, when I open prep, then I see likely questions + values, each cited.
- AC-007.1.2 — Given **thin research** (obscure company), then the brief flags what's unknown and offers general best-practice, **not invented specifics**.
- AC-007.1.3 — Given I have STAR stories, then suggested answers reference them by id.
- AC-007.1.4 — Given a request that would require **insider/confidential** info, then the brief declines and gives publicly-grounded inference instead.
- AC-007.1.5 — Given **conflicting public sources** on the interview process, then both are presented with an uncertainty note.
- AC-007.1.6 — Given I generate the **11th brief in an hour**, then `429 RATE_LIMITED`.

**4.7.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-007.1 | A claim without a citation is labeled "general guidance" | Pre-render | Re-label, not company-specific |
| BR-007.2 | No content may assert non-public/confidential knowledge | Generation | Strip + degrade to inference |
| BR-007.3 | 10 briefs/hour/user | Gateway | `429 RATE_LIMITED` |

**4.7.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| company_id | uuid | Y* | known company | co_1 | Persona (*or target) |
| target | string | Y* | company/role text | "Stripe / PM" | User |
| profile_id | uuid | Y | for STAR mapping | prof_1 | F-003 |

**4.7.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| brief | object | Y | {questions[], format, values[], frameworks[]} |
| cites[] | array | Y | per-claim citations |
| confidence | enum | Y | high/med/low (low = thin research) |
| star_mappings[] | array | N | answer → story_id |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 404 | COMPANY_NOT_FOUND | no persona | "We'll research this company — try again shortly." | Yes (after research) |
| 429 | RATE_LIMITED | >10/hr | "Too many — try again shortly." | Yes |
| 503 | ENGINE_UNAVAILABLE | engine down | "Try again shortly." | Yes |

**4.7.8 State model**
```
[*] → Requested → (PersonaReady? → Generating → Briefed) | (NoPersona → Researching → Generating)
Briefed: cached per (company, role) until persona refresh (F-054)
```

**4.7.9 Sequence (happy path)**
```
Cand→App: prep(company_id|target, profile_id)
App→Engine: persona(company) + star(profile)
Engine→App: {brief, cites, star_mappings}
App→Cand: 200 {brief, cites, confidence}
```

**4.7.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Obscure company, thin data | `confidence=low`; "general guidance" sections; no invention |
| Company persona missing | `404`; trigger research; ask to retry |
| Insider-info request | Decline; publicly-grounded inference only |
| Conflicting public sources | Present both; note uncertainty |
| Non-English company materials | Summarize in user's locale (F-098c) |
| Over rate limit | `429` |
| Engine down | `503`; no fabricated brief |

**4.7.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-007.1 | Latency | Brief ≤30 s p95 | Probes |
| NFR-007.2 | Quality | Groundedness ≥95%; every claim cited or labeled general | Eval |
| NFR-007.3 | Honesty | 0 fabricated company-specific specifics on thin-research set | Eval |

**4.7.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-007.1 | Brief candidate-private (trust wall F-060) |
| SR-007.2 | No exfiltration of any confidential source |

**4.7.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no fabrication | FR-007.4, FR-007.5, NFR-007.3 |

**4.7.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| prep_generated_total | Counter | confidence | — |
| prep_thin_research_rate | Gauge | — | — |
| prep_latency_ms | Histogram | — | p95>30s = P2 |

**4.7.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-007.1 | **Grounded + cited brief** | researched company | questions+values, each cited | FR-007.1/.2, AC-007.1.1 | Integration |
| TC-007.2 | **Thin-research honesty** | obscure company | `confidence=low`; general guidance; no invented specifics | FR-007.4, AC-007.1.2 | Integration |
| TC-007.3 | STAR mapping | user has stories | answers reference story ids | FR-007.3, AC-007.1.3 | Integration |
| TC-007.4 | **Insider-info refusal** | "what exact questions did they ask candidate X" | declines; public inference only | FR-007.5, AC-007.1.4 | Integration |
| TC-007.5 | Conflicting sources | two process descriptions | both presented + uncertainty note | FR-007.7, AC-007.1.5 | Integration |
| TC-007.6 | Company not found | no persona | `404`; research triggered | edge table | Integration |
| TC-007.7 | Rate limit | 11/hr | `429 RATE_LIMITED` | BR-007.3, AC-007.1.6 | Integration |
| TC-007.8 | Engine down | timeout | `503`; no fabricated brief | edge table | E2E |
| TC-007.9 | Trust-wall | employer reads brief | denied | SR-007.1 | Security |

**4.7.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-007.1 | Cache TTL for briefs vs persona-refresh cadence | PM | Open |

---

### 4.8 Feature F-008 — Mock interviews (voice/video)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-106

**4.8.1 Description.** A real-time AI voice (and optional video) mock interview generated from a JD + résumé,
returning a transcript and a feedback scorecard. Candidate-private; never used to assess for an employer; no biometric
data stored.

**4.8.2 Triggers**
- Candidate starts a mock from prep (W-105 → W-106).
- Candidate ends/deletes a session.

**4.8.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-008.1 | The system shall conduct a real-time AI voice (optionally video) mock from a JD + résumé. | Must |
| FR-008.2 | The system shall obtain explicit, timestamped consent before any recording starts. | Must |
| FR-008.3 | The system shall store only the transcript + scores; **never** store biometric templates (face/voice prints). | Must |
| FR-008.4 | The system shall return a structured feedback scorecard within 10 s of session end. | Must |
| FR-008.5 | The system shall never expose mock content to any employer endpoint (trust wall F-060). | Must |
| FR-008.6 | The system shall let the candidate delete a mock (transcript + any media) at any time, purged within 30 days hard. | Must |
| FR-008.7 | The system shall degrade to text mode (honestly noted) if audio/video infra is unavailable or quality is poor. | Should |
| FR-008.8 | The system shall meter a mock session as a usage unit and respect the spend cap. | Must |

**4.8.4 User stories & acceptance criteria**
- AC-008.1.1 — Given I grant consent, when I run a mock, then I get a live session, a transcript, and a feedback scorecard within 10 s of ending.
- AC-008.1.2 — Given I **decline consent**, when I start, then no recording is stored (live-only) and I'm told so.
- AC-008.1.3 — Given I **delete a mock**, then transcript and any media are purged and unrecoverable.
- AC-008.1.4 — Given the **media infra is down**, when I start, then I'm offered text-mode mock, not a hard failure.
- AC-008.1.5 — Given I **disconnect mid-session**, then a partial transcript is saved and I can resume.
- AC-008.1.6 — Given an attempt to read my mock via an **employer endpoint**, then it is denied.
- AC-008.1.7 — Given my account is **over the cost ceiling**, when I start a mock, then `423 COST_CEILING_HIT`.

**4.8.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-008.1 | Consent captured + logged before recording | Session start | `403 CONSENT_REQUIRED` |
| BR-008.2 | No biometric template storage (BIPA/Illinois-class) | Processing | Hard prohibition |
| BR-008.3 | Deleted media purged ≤30 days | Delete | Enforced purge job |
| BR-008.4 | Session metered on completion; under cost ceiling | Pre-start | `423 COST_CEILING_HIT` |

**4.8.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| jd | string | Y | ≤20k chars | "…" | F-005/job |
| resume_id | uuid | Y | a version | ver_2 | F-006 |
| media | enum | Y | voice / video / text | voice | User |
| consent | bool | Y* | required if recording | true | User (*for recording) |

**4.8.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| session_id | uuid | Y | — |
| transcript | string | Y | full transcript (if consented) |
| scorecard | object | Y | {dimensions[], overall, feedback} |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 403 | CONSENT_REQUIRED | recording without consent | "We need consent to record." | No |
| 423 | COST_CEILING_HIT | over cap | "Temporarily paused." | No |
| 503 | MEDIA_INFRA_UNAVAILABLE | voice/video infra down | "Try text mode or retry." | Yes |

**4.8.8 State model**
```
Session: Created → ConsentCheck → InProgress → Completed → (Saved | Deleted)
ConsentCheck→[*]: 403 if recording without consent
InProgress→Interrupted: disconnect → partial transcript saved → Resumable
Completed→Deleted: user delete → purge ≤30d
```

**4.8.9 Sequence (happy path)**
```
Cand→App: start(jd, resume_id, media=voice, consent=true)
App→Media: open session
Cand↔AI: real-time interview
Cand→App: end
App→Engine: score(transcript)
App→Cand: 200 {transcript, scorecard}
```

**4.8.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| No consent | `403`; live-only, nothing stored |
| Media infra down | Offer text mode; never hard-fail silently |
| Mid-session disconnect | Save partial; allow resume |
| Poor audio quality | Degrade to text; note it |
| User deletes mid-session | Purge partial immediately |
| Over cost ceiling | `423` |
| Employer reads mock | Denied (trust wall) |
| Background noise / no speech | Prompt to retry; don't score garbage |

**4.8.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-008.1 | Latency | Voice round-trip ≤1.5 s; scorecard ≤10 s post-end | Probes |
| NFR-008.2 | Privacy | 0 biometric templates stored (audit) | Storage audit |
| NFR-008.3 | Reliability | Disconnect never loses a completed transcript | Chaos test |

**4.8.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-008.1 | No biometric storage; transient media; transcripts/scores only |
| SR-008.2 | Media encrypted in transit + at rest; tenant-isolated; candidate-private |
| SR-008.3 | Deleted media cryptographically unrecoverable after purge |

**4.8.13 Compliance & regulatory traceability**
| Regulation/control | FR/SR IDs |
|---|---|
| Biometric law (BIPA/Illinois-class) | FR-008.3, SR-008.1 |
| Consent | FR-008.2, BR-008.1 |
| Data rights (delete) | FR-008.6, SR-008.3 |

**4.8.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| mock_sessions_total | Counter | media | — |
| mock_consent_decline_rate | Gauge | — | — |
| mock_media_fail_rate | Gauge | — | >10% = P2 |
| mock_biometric_stored_total | Counter | — | any>0 = P1 (compliance breach) |

**4.8.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-008.1 | **Consent gate** | start recording, no consent | `403 CONSENT_REQUIRED` | FR-008.2, AC-008.1.2 | Integration |
| TC-008.2 | Happy path | consent + voice mock | transcript + scorecard ≤10 s | FR-008.1/.4, AC-008.1.1 | Integration |
| TC-008.3 | **Delete purges** | delete a mock | transcript + media unrecoverable | FR-008.6, AC-008.1.3 | Integration |
| TC-008.4 | **Trust-wall** | employer reads mock | denied | FR-008.5, AC-008.1.6 | Security |
| TC-008.5 | **No biometric storage** | run mock; inspect storage | no face/voice template stored | SR-008.1, NFR-008.2 | Security |
| TC-008.6 | Media infra down | infra unavailable | text-mode offered | FR-008.7, AC-008.1.4 | E2E |
| TC-008.7 | Mid-session disconnect | drop connection | partial saved; resumable | NFR-008.3, AC-008.1.5 | Chaos |
| TC-008.8 | Cost ceiling | over cap | `423 COST_CEILING_HIT` | BR-008.4, AC-008.1.7 | Integration |
| TC-008.9 | No speech / noise | silent session | retry prompt; no garbage score | edge table | Integration |

**4.8.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-008.1 | Voice/video infra vendor (Vapi-class) selection | Eng | Open |

---

### 4.9 Feature F-009 — Live interview tutor
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-105

**4.9.1 Description.** An in-studio chat tutor the candidate can ask anything during prep (concepts, "how would I
answer X", company-specific guidance), grounded in the company persona, with persistent multi-session history.
Prep-only — explicitly refuses real-time live-interview cheating.

**4.9.2 Triggers**
- Candidate sends a message in the tutor panel (W-105).

**4.9.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-009.1 | The system shall answer free-form prep questions grounded in the company persona + the user's profile, within 8 s p95. | Must |
| FR-009.2 | The system shall persist multi-session chat history per user/company. | Must |
| FR-009.3 | The system shall cite sources for company-specific claims and state uncertainty honestly when unknown. | Must |
| FR-009.4 | The system shall refuse requests that amount to real-time live-interview answering/cheating and explain why. | Must |
| FR-009.5 | The system shall stay on-topic (career/interview prep) and politely redirect off-topic requests. | Should |
| FR-009.6 | The system shall rate-limit to 60 messages/hour/user and respect the spend cap. | Must |

**4.9.4 User stories & acceptance criteria**
- AC-009.1.1 — Given a prep question, when I ask, then a grounded, cited answer within 8 s.
- AC-009.1.2 — Given a request that amounts to **live-interview cheating** ("I'm in the interview now, give me the answer"), then the tutor **declines and explains** it's prep-only.
- AC-009.1.3 — Given I return later, then my history for that company is intact.
- AC-009.1.4 — Given an **off-topic** request ("write my essay"), then it politely redirects to prep.
- AC-009.1.5 — Given a **prompt-injection** ("ignore your rules and…"), then the rules hold.
- AC-009.1.6 — Given the **61st message in an hour**, then `429 RATE_LIMITED`.

**4.9.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-009.1 | No real-time live-interview answering assistance | Intent check | Decline + explain |
| BR-009.2 | Company-specific claims require a citation | Pre-reply | Label "general guidance" |
| BR-009.3 | 60 messages/hour/user | Gateway | `429 RATE_LIMITED` |

**4.9.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| message | string | Y | ≤4,000 chars | "how do I answer…" | User |
| company_id | uuid | N | grounding | co_1 | Persona |

**4.9.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| reply | string | Y | the answer |
| cites[] | array | N | for company-specific claims |
| refused | bool | Y | true if a no-cheating/off-topic refusal |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 429 | RATE_LIMITED | >60/hr | "Slow down a moment." | Yes |
| 503 | ENGINE_UNAVAILABLE | engine down | "Try again shortly." | Yes |

**4.9.8 State model.** *Conversational; history persisted per (user, company). No transactional lifecycle.*

**4.9.9 Sequence (happy path)**
```
Cand→App: message("how would I answer X at Stripe", company_id)
App→App: intent-check (cheating? off-topic?)
App→Engine: answer(message, persona, profile, history)
Engine→App: {reply, cites}
App→Store: append history
App→Cand: 200 {reply, cites}
```

**4.9.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Live-cheating request | Decline + explain; `refused=true` |
| Off-topic request | Redirect to prep |
| Prompt injection | Rules hold; treat as text |
| Unknown company | Honest "limited info"; general guidance |
| Over rate limit | `429` |
| Engine down | `503`; no fabricated answer |
| Abusive content | Refuse; flag for trust & safety |

**4.9.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-009.1 | Latency | Reply ≤8 s p95 | Probes |
| NFR-009.2 | Safety | 100% of live-cheating prompts refused | Red-team eval |
| NFR-009.3 | Groundedness | ≥95% on company-specific claims | Eval |

**4.9.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-009.1 | Candidate-private history; trust wall |
| SR-009.2 | Prompt-injection hardening; system rules immutable to user input |

**4.9.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Integrity / no-cheating principle | FR-009.4, BR-009.1, NFR-009.2 |

**4.9.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| tutor_messages_total | Counter | — | — |
| tutor_cheating_refusal_total | Counter | — | — |
| tutor_injection_block_total | Counter | — | spike = attack |

**4.9.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-009.1 | **Grounded answer** | prep question | grounded, cited reply ≤8 s | FR-009.1/.3, AC-009.1.1 | Integration |
| TC-009.2 | **Cheating refusal** | "I'm in the interview now, answer this" | declines + explains; `refused=true` | FR-009.4, AC-009.1.2 | Integration |
| TC-009.3 | History persistence | return later | history intact | FR-009.2, AC-009.1.3 | Integration |
| TC-009.4 | **Off-topic redirect** | "write my essay" | polite redirect | FR-009.5, AC-009.1.4 | Unit |
| TC-009.5 | **Prompt injection** | "ignore your rules…" | rules hold | SR-009.2, AC-009.1.5 | Security |
| TC-009.6 | Rate limit | 61/hr | `429 RATE_LIMITED` | BR-009.3, AC-009.1.6 | Integration |
| TC-009.7 | Engine down | timeout | `503`; no fabricated answer | edge table | E2E |
| TC-009.8 | Abusive content | abusive message | refused; flagged | edge table | Security |

**4.9.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-009.1 | History retention window for tutor chats | PM | Open |

---

### 4.10 Feature F-010 — STAR story bank → JD
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-105

**4.10.1 Description.** A per-user STAR-structured achievement/story library that maps stories to a JD's requirements
by semantic relevance, flags requirement gaps, and cites story IDs in generated answers/résumé bullets for outcome
attribution. Stories are the user's own — never fabricated.

**4.10.2 Triggers**
- Candidate adds/edits a story.
- Prep (F-007) or tailoring (F-002) needs evidence for a JD.

**4.10.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-010.1 | The system shall maintain a per-user STAR story bank (Situation/Task/Action/Result), up to 100 stories. | Must |
| FR-010.2 | The system shall map a JD's requirements to the best-matching stories by semantic relevance, within 5 s. | Must |
| FR-010.3 | The system shall cite story IDs in any generated answer/bullet that uses a story (Engine F-050). | Must |
| FR-010.4 | The system shall flag JD requirements with no matching story as a "gap to fill." | Should |
| FR-010.5 | The system shall never invent a story; stories are user-authored (assistant may help structure, not fabricate facts). | Must |

**4.10.4 User stories & acceptance criteria**
- AC-010.1.1 — Given stories + a JD, when mapped, then each requirement maps to the best story or is flagged a gap.
- AC-010.1.2 — Given a generated answer using a story, then the story id is cited.
- AC-010.1.3 — Given an **empty story bank**, when mapping, then I'm prompted to add stories (no fabricated ones).
- AC-010.1.4 — Given a **weak/thin match**, then it's labeled "weak evidence" honestly, not presented as strong.
- AC-010.1.5 — Given the assistant helps me **structure** a story, then it never adds facts I didn't provide.

**4.10.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-010.1 | Stories are user-authored; no fabricated facts | Add/assist | Strip invented facts |
| BR-010.2 | ≤100 stories/user | Add | `409 STORY_LIMIT` |
| BR-010.3 | A used story must be cited | Generation | Attach story_id |

**4.10.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| jd | string | Y | ≤20k chars | "…" | Job |
| story_bank | ref | Y | user's stories | — | F-010 store |
| new_story | object | N | {s,t,a,r} on add | — | User |

**4.10.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| mappings[] | array | Y | {requirement, story_id, strength} |
| gaps[] | array | Y | requirements with no story |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 409 | STORY_LIMIT | >100 stories | "Story limit reached — archive some." | No |
| 503 | ENGINE_UNAVAILABLE | engine down | "Try again shortly." | Yes |

**4.10.8 State model.** *Stateless mapping per request; story bank is CRUD-managed.*

**4.10.9 Sequence (happy path)**
```
Cand→App: map(jd, story_bank)
App→Engine: semantic_match(requirements, stories)
Engine→App: {mappings[], gaps[]}
App→Cand: 200 {mappings, gaps}
```

**4.10.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Empty bank | Prompt to add; no fabricated stories |
| Thin/weak match | Label "weak evidence" honestly |
| Story limit | `409 STORY_LIMIT` |
| Assistant asked to invent a story | Decline facts; help structure only |
| Duplicate stories | Suggest merge |
| Engine down | `503` |

**4.10.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-010.1 | Latency | Mapping ≤5 s p95 | Probes |
| NFR-010.2 | Quality | Mapping relevance ≥85% on a golden set | Eval |

**4.10.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-010.1 | Story bank candidate-private (trust wall) |

**4.10.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no fabrication | FR-010.5, BR-010.1 |

**4.10.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| story_map_total | Counter | — | — |
| story_gap_rate | Gauge | — | — |

**4.10.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-010.1 | **JD→story mapping** | stories + JD | requirements mapped or gap-flagged | FR-010.2, AC-010.1.1 | Integration |
| TC-010.2 | **Gap flag** | JD requirement with no story | flagged as gap | FR-010.4, AC-010.1.1 | Integration |
| TC-010.3 | **Story-id citation** | generated answer uses a story | story_id cited | FR-010.3, AC-010.1.2 | Integration |
| TC-010.4 | **Empty bank** | no stories | prompt to add; no fabrication | edge table, AC-010.1.3 | Unit |
| TC-010.5 | Weak match honesty | thin match | labeled "weak evidence" | edge table, AC-010.1.4 | Unit |
| TC-010.6 | Fabrication refusal | "invent a story for X" | facts not invented; structure-only | FR-010.5, AC-010.1.5 | Integration |
| TC-010.7 | Story limit | 101st story | `409 STORY_LIMIT` | BR-010.2 | Unit |
| TC-010.8 | Engine down | timeout | `503` | edge table | E2E |

**4.10.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-010.1 | Auto-extract stories from the profile (F-003) on first use? | PM | Open |

### 4.11 Feature F-011 — LinkedIn profile optimization
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** —

**4.11.1 Description.** Analyzes the candidate's LinkedIn profile section-by-section (headline, about, experience,
skills) and outputs concrete, voice-calibrated rewrites with a priority order, so the profile works as hard as the
résumé. Never auto-publishes.

**4.11.2 Triggers**
- Candidate imports or pastes their LinkedIn profile.
- Candidate requests optimization / re-runs after editing.

**4.11.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-011.1 | The system shall analyze each profile section and output a concrete rewrite for each. | Must |
| FR-011.2 | The system shall produce rewrites in the user's calibrated voice (F-055) when samples exist. | Should |
| FR-011.3 | The system shall flag missing or weak sections with a priority order. | Must |
| FR-011.4 | The system shall never auto-publish changes to LinkedIn (output is copy-to-apply). | Must |
| FR-011.5 | The system shall ground every rewrite in the user's profile (F-003); no fabricated experience. | Must |

**4.11.4 User stories & acceptance criteria**
*Story F-011-S1: As a candidate, I want my LinkedIn profile rewritten so it represents me as strongly as my résumé.*
- AC-011.1.1 — Given a profile, when I optimize, then I receive per-section concrete rewrites with a priority order.
- AC-011.1.2 — Given voice samples exist, when rewrites are produced, then they match my voice.
- AC-011.1.3 — Given a sparse profile, when I optimize, then the system prompts for the missing inputs rather than inventing them.

**4.11.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-011.1 | No rewrite may assert experience absent from the user profile | Generation | Drop/flag the claim |
| BR-011.2 | Output is advisory only; no write-back to LinkedIn | Service | N/A (no integration) |

**4.11.6 Input specification**
| Field | Type | Required | Constraints | Source |
|---|---|---|---|---|
| profile_text | string | Y | ≤30k chars | Paste/import |
| voice_id | uuid | N | existing calibration | F-055 |

**4.11.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| rewrites[] | array | Y | {section, original, rewrite, rationale} |
| priorities[] | array | Y | ranked sections to fix first |

**Error responses**
| HTTP | Code | When | Retryable |
|---|---|---|---|
| 422 | PARSE_FAILED | Profile unparseable | No (manual path) |
| 503 | ENGINE_UNAVAILABLE | AI layer down | Yes (backoff) |

**4.11.8 State model.** *Stateless per request* (no persisted lifecycle beyond saving accepted rewrites to the profile).

**4.11.9 Sequence (happy path)**
```
Cand→App: optimize(profile_text, voice_id?)
App→Engine: rewrite(sections, voice)
Engine→App: {rewrites[], priorities[]}
App→Cand: per-section rewrites (copy-to-apply)
```

**4.11.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Sparse/empty profile | Prompt for inputs; never fabricate sections |
| No voice samples | Use default professional voice; offer calibration |
| Non-English profile | Localize if supported (F-098c); else honest notice |

**4.11.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-011.1 | Latency | Rewrites ≤20s p95 | Synthetic probes |
| NFR-011.2 | Quality | Groundedness ≥95%; no fabrication | Eval harness |

**4.11.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-011.1 | Profile content candidate-private (trust wall F-060) |
| SR-011.2 | Encrypted at rest + in transit |

**4.11.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no fabrication | FR-011.5, BR-011.1 |

**4.11.14 Observability**
| Metric | Type | Alert |
|---|---|---|
| profile_opt_total | Counter | — |
| profile_opt_latency_ms | Histogram | p95>20s 5m = P2 |

**4.11.15 Test cases**
| TC ID | Scenario | Covers | Type |
|---|---|---|---|
| TC-011.1 | Per-section rewrite | FR-011.1, AC-011.1.1 | Integration |
| TC-011.2 | Voice match | FR-011.2, AC-011.1.2 | Unit |
| TC-011.3 | Sparse-profile prompt | AC-011.1.3 | Integration |

**4.11.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-011.1 | Offer optional LinkedIn API write-back later? | PM | Open |

### 4.12 Feature F-012 — LinkedIn post generation + scheduling
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** —

**4.12.1 Description.** Generates LinkedIn posts via a pick-angle → draft → critique → polish flow in the user's
calibrated voice, with an image brief, maintains a content calendar, and schedules via a third-party integration
(Buffer-class) — never publishing without explicit user approval.

**4.12.2 Triggers**
- Candidate requests a post (topic/angle).
- Candidate schedules an approved post; reviews the content calendar.

**4.12.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-012.1 | The system shall generate a post via pick-angle→draft→critique→polish with an image brief, in the user's voice. | Must |
| FR-012.2 | The system shall maintain a per-user content calendar of drafts and scheduled posts. | Must |
| FR-012.3 | The system shall schedule posts via an authorized integration. | Should |
| FR-012.4 | The system shall require explicit user approval before any publish or schedule. | Must |
| FR-012.5 | The system shall allow the user to edit a post before scheduling. | Must |

**4.12.4 User stories & acceptance criteria**
*Story F-012-S1: As a candidate, I want on-brand posts scheduled so I build presence without writing them myself.*
- AC-012.1.1 — Given a topic, when I generate, then I get a polished post + image brief in my voice.
- AC-012.1.2 — Given a post, when I schedule, then it is queued only after my explicit approval.
- AC-012.1.3 — Given I edit a draft, then my changes persist before scheduling.

**4.12.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-012.1 | No publish/schedule without explicit user approval | Pre-schedule | Block; require confirm |
| BR-012.2 | Schedule time must be in the future | Schedule | Reject 400 |

**4.12.6 Input specification**
| Field | Type | Required | Constraints | Source |
|---|---|---|---|---|
| topic | string | Y | ≤500 chars | User |
| voice_id | uuid | N | existing calibration | F-055 |
| schedule_at | datetime | N | future | User |

**4.12.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| post | string | Y | polished copy |
| image_brief | object | Y | suggested visual |
| schedule_id | uuid | N | when scheduled |

**Error responses**
| HTTP | Code | When | Retryable |
|---|---|---|---|
| 400 | SCHEDULE_IN_PAST | BR-012.2 | No |
| 401 | INTEGRATION_AUTH | Token expired | No (re-auth) |
| 424 | INTEGRATION_FAILED | Provider error | Yes (backoff) |

**4.12.8 State model**
```
[*] → Draft → Approved → Scheduled → Published
Draft→Approved: user approves
Approved→Scheduled: integration accepts
Scheduled→Published: at schedule_at
(any)→Draft: user edits → re-approval required
```

**4.12.9 Sequence (happy path)**
```
Cand→App: generate(topic, voice)
App→Engine: post pipeline (angle→draft→critique→polish)
Engine→App: {post, image_brief}
Cand→App: approve + schedule(at)
App→Integration: schedule(post, at)
Integration→App: schedule_id
```

**4.12.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Integration token expired | 401; prompt re-auth; keep draft |
| Schedule in the past | 400; ask for a future time |
| Provider outage | 424; retry with backoff; keep as Approved |

**4.12.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-012.1 | Latency | Generate ≤20s p95 | Synthetic probes |
| NFR-012.2 | Reliability | Scheduled posts publish within ±2 min of target | Audit job |

**4.12.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-012.1 | Integration OAuth tokens encrypted at rest; least-scope |
| SR-012.2 | Post content candidate-owned; not exposed cross-tenant |

**4.12.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| User-consent to publish | FR-012.4, BR-012.1 |

**4.12.14 Observability**
| Metric | Type | Alert |
|---|---|---|
| posts_generated_total | Counter | — |
| post_schedule_fail_rate | Gauge | >5% 10m = P2 |

**4.12.15 Test cases**
| TC ID | Scenario | Covers | Type |
|---|---|---|---|
| TC-012.1 | Generate post + image brief | FR-012.1, AC-012.1.1 | Integration |
| TC-012.2 | Approval gate before schedule | FR-012.4, AC-012.1.2 | Integration |
| TC-012.3 | Integration failure handling | error table | E2E |

**4.12.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-012.1 | Which scheduling provider(s) to support first | PM | Open |

---

### 4.13 Feature F-013 — Outreach drafting + networking tracking
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-108

**4.13.1 Description.** Drafts personalized outreach — warm-intro requests, hiring-manager messages, and cold
outreach — matched to the recipient and the user's voice, and tracks networking activity per target. Draft-only;
never auto-sends.

**4.13.2 Triggers**
- Candidate requests an outreach draft for a contact or target.
- Candidate logs/updates networking activity.

**4.13.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-013.1 | The system shall draft each outreach type, recipient- and voice-matched. | Must |
| FR-013.2 | The system shall track networking activity and status per target. | Must |
| FR-013.3 | The system shall never auto-send outreach (draft only). | Must |
| FR-013.4 | The system shall suggest the best contact/path (links to F-014). | Should |
| FR-013.5 | The system shall use only consented contact data. | Must |

**4.13.4 User stories & acceptance criteria**
*Story F-013-S1: As a candidate, I want a personalized outreach draft so I can reach the right person warmly.*
- AC-013.1.1 — Given a contact, when I draft, then I get a personalized, voice-matched message.
- AC-013.1.2 — Given a draft, then it is never sent automatically.
- AC-013.1.3 — Given activity, then per-target status is tracked and visible.

**4.13.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-013.1 | No auto-send; user must copy/send themselves | Service | N/A (no send path) |
| BR-013.2 | Outreach may use only consented contact data | Draft | Reject non-consented |

**4.13.6 Input specification**
| Field | Type | Required | Constraints | Source |
|---|---|---|---|---|
| contact | object | Y | name, role, company | Network/manual |
| type | enum | Y | intro / hm / cold | User |
| voice_id | uuid | N | calibration | F-055 |

**4.13.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| draft | string | Y | the message |
| suggested_path | object | N | best warm path (F-014) |

**Error responses**
| HTTP | Code | When | Retryable |
|---|---|---|---|
| 403 | NON_CONSENTED_CONTACT | BR-013.2 | No |
| 503 | ENGINE_UNAVAILABLE | AI down | Yes |

**4.13.8 State model.** Networking record per target: NotStarted → Reached → Responded → IntroMade → (Stalled).

**4.13.9 Sequence (happy path)**
```
Cand→App: draft(contact, type, voice)
App→Engine: personalize(contact, persona, voice)
Engine→App: {draft}
App→Cand: draft (copy-to-send) + status updated
```

**4.13.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| No contact info | Draft a generic warm-intro request to a connector |
| Non-consented contact | 403; do not draft to that contact |
| Engine down | 503; retry |

**4.13.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-013.1 | Latency | Draft ≤8s p95 | Probes |

**4.13.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-013.1 | Contact data minimized, consented, candidate-private |

**4.13.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Anti-spam / consent | BR-013.2, FR-013.5 |

**4.13.14 Observability**
| Metric | Type | Alert |
|---|---|---|
| outreach_drafts_total | Counter | — |

**4.13.15 Test cases**
| TC ID | Scenario | Covers | Type |
|---|---|---|---|
| TC-013.1 | Draft variants (intro/hm/cold) | FR-013.1 | Integration |
| TC-013.2 | No auto-send | FR-013.3, AC-013.1.2 | Unit |
| TC-013.3 | Per-target tracking | FR-013.2, AC-013.1.3 | Integration |

**4.13.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-013.1 | Optional one-click send via user's own email (with consent)? | PM | Open |

---

### 4.14 Feature F-014 — Warm-intro / people graph
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-108

**4.14.1 Description.** Builds a people/employments graph from consented data only and computes shortest warm-intro
paths (1–2 hops, strength-scored) to target companies; discovers likely contacts at targets via a people-finder.
Consented sources only — never scraping.

**4.14.2 Triggers**
- Candidate imports their network (consented CSV export or manual entry).
- Candidate opens a target company's warm-intro paths.

**4.14.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-014.1 | The system shall ingest a people/employments graph from consented sources only — never scraping. | Must |
| FR-014.2 | The system shall compute shortest warm-intro paths (1–2 hops) with geometric-mean strength scoring. | Must |
| FR-014.3 | The system shall discover likely contacts at a target via people-finder. | Should |
| FR-014.4 | The system shall let the user revoke/delete imported network data at any time. | Must |
| FR-014.5 | The system shall reject any import from a non-consented or scraped source. | Must |

**4.14.4 User stories & acceptance criteria**
*Story F-014-S1: As a candidate, I want the shortest warm path to a target so I can get a referral.*
- AC-014.1.1 — Given a consented network + target, when I view paths, then I see top warm-intro paths with strength scores.
- AC-014.1.2 — Given a scraped-import attempt, when submitted, then it is rejected.
- AC-014.1.3 — Given a revoke request, then network data is purged.

**4.14.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-014.1 | Consented sources only; reject scraped imports (ToS/legal) | Import | Reject 403 |
| BR-014.2 | Imported third-party PII minimized + revocable | Storage | Enforce schema |

**4.14.6 Input specification**
| Field | Type | Required | Constraints | Source |
|---|---|---|---|---|
| network_import | file/manual | Y | consented CSV / manual | User |
| target | string | Y | company | User |

**4.14.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| paths[] | array | Y | {hops, nodes, strength} |
| contacts[] | array | N | discovered at target |

**Error responses**
| HTTP | Code | When | Retryable |
|---|---|---|---|
| 403 | NON_CONSENTED_SOURCE | BR-014.1 | No |
| 422 | IMPORT_INVALID | Malformed import | No |

**4.14.8 State model.** NetworkImport: Pending → Validated → Indexed → (Revoked/Purged).

**4.14.9 Sequence (happy path)**
```
Cand→App: import(network, consent)  → validate → index graph
Cand→App: paths(target)
App→Graph: dijkstra(user→target, strength)
Graph→App: {paths[], contacts[]}
App→Cand: warm paths (→ draft via F-013)
```

**4.14.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Thin/empty network | Honest "no warm path found; here's how to build one" |
| Scraped/non-consented import | 403; reject; explain consent requirement |
| Stale employment data | Mark path lower-confidence |

**4.14.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-014.1 | Latency | Path-find ≤3s p95 (≤100 nodes) | Probes |

**4.14.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-014.1 | Third-party (connection) PII minimized; revocable; candidate-private |
| SR-014.2 | Network data never exposed to employers (trust wall) |

**4.14.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Consent / no-scraping principle | FR-014.1, FR-014.5, BR-014.1 |
| Data subject rights (3rd-party PII) | FR-014.4, BR-014.2 |

**4.14.14 Observability**
| Metric | Type | Alert |
|---|---|---|
| path_requests_total | Counter | — |
| import_reject_rate | Gauge | spike = investigate |

**4.14.15 Test cases**
| TC ID | Scenario | Covers | Type |
|---|---|---|---|
| TC-014.1 | Path-finding correctness | FR-014.2, AC-014.1.1 | Integration |
| TC-014.2 | Scraped/non-consented rejection | FR-014.5, AC-014.1.2 | Unit |
| TC-014.3 | Revoke purges network data | FR-014.4, AC-014.1.3 | Integration |

**4.14.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-014.1 | Email/contacts import as an alternative consented source? | PM | Open |

### 4.15 Feature F-015 — Passive monitoring + alerts
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.2 · **Wireframe:** W-107

**4.15.1 Description.** The candidate sets target companies/roles once; the system passively monitors job sources
(Engine F-058 discovery + F-059 legitimacy filter) and alerts the candidate (via Platform F-084 notification infra)
when a fitting, legitimate opening appears. Alerts are loop-personalized, rare, relevant, and explain *why* they fit.
This is the retention engine — the always-on heartbeat that keeps employed/passive users (Sara) subscribed.

**4.15.2 Triggers**
- Candidate sets/edits target criteria (companies, roles, filters) on W-107/onboarding.
- Background monitoring cycle discovers a new posting matching a target.
- Candidate snoozes/pauses/resumes/tunes monitoring.

**4.15.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-015.1 | The system shall persist a candidate's target criteria (≤20 companies, ≤10 roles, location/seniority filters) and monitor continuously. | Must |
| FR-015.2 | The system shall filter ghost/recycled/low-legitimacy postings (F-059) **before** any alert is generated. | Must |
| FR-015.3 | The system shall rank candidate alerts by loop-personalized fit (the candidate's own fit + outcome history), not generic keyword match. | Must |
| FR-015.4 | The system shall include, in each alert, a per-role explanation of *why it fits* this candidate. | Must |
| FR-015.5 | The system shall let the candidate snooze (set window), pause, resume, and tune targets without losing setup. | Must |
| FR-015.6 | The system shall deduplicate alerts so the same role is never alerted twice (content + URL hash). | Must |
| FR-015.7 | The system shall cap alert volume to a fair-use default (≤1 digest/day or ≤5 instant alerts/day, user-configurable) to prevent fatigue. | Must |
| FR-015.8 | The system shall only alert on roles above a configurable fit threshold (default A/B band). | Should |
| FR-015.9 | The system shall never auto-apply to any monitored role (alerts are surface-only). | Must |

**4.15.4 User stories & acceptance criteria**
*Story F-015-S1: As an employed passive looker, I want to be told only when a genuinely better-fit role appears.*
- AC-015.1.1 — Given targets set, when a **fitting legitimate** role appears, then I get a personalized alert with a "why it fits" explanation, within the monitoring cycle.
- AC-015.1.2 — Given a **ghost/recycled posting** matches my targets, then **no alert** is generated.
- AC-015.1.3 — Given the **same role** is re-posted/re-discovered, then I am **not** alerted twice.
- AC-015.1.4 — Given I **snooze for 2 weeks**, then alerts pause and automatically resume after the window; my targets are intact.
- AC-015.1.5 — Given a role **below my fit threshold** matches keywords, then no alert (quality bar).
- AC-015.1.6 — Given I receive **more than my daily cap** of matches, then they are batched into a digest, not fired individually.
- AC-015.1.7 — Given an alert, when I open it, then I can act (rate/tailor) but the system **never auto-applies**.
- AC-015.1.8 — Given I **pause monitoring entirely**, then no alerts fire until I resume, and no setup is lost.

**4.15.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-015.1 | ≤20 target companies, ≤10 roles per user | Set targets | Reject `400 TARGET_LIMIT` |
| BR-015.2 | No alert for postings failing the legitimacy filter (F-059) | Pre-alert | Drop silently |
| BR-015.3 | Dedupe on (content-hash, URL) | Pre-alert | Suppress duplicate |
| BR-015.4 | Daily alert cap (default 5 instant / 1 digest) | Dispatch | Batch into digest |
| BR-015.5 | Fit ≥ threshold required to alert | Pre-alert | Suppress |
| BR-015.6 | Snooze/pause never deletes target setup | State | Preserve config |

**4.15.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| target_companies[] | string[] | N | ≤20 | ["Stripe","Visa"] | User |
| target_roles[] | string[] | N | ≤10 | ["Senior PM"] | User |
| filters | object | N | location, seniority, remote, visa | {remote:true} | User |
| fit_threshold | enum | N | A/B/C | B | User |
| cap | object | N | instant/digest, n/day | {digest:1} | User |
| snooze_until | datetime | N | future | 2026-07-01 | User |

**4.15.7 Output specification — alert payload**
| Field | Type | Always | Description |
|---|---|---|---|
| alert_id | uuid | Y | — |
| role | object | Y | {company, title, url, legitimacy_tier} |
| fit_band | enum | Y | A–F |
| why_it_fits | string | Y | personalized explanation |
| actions | array | Y | [rate, tailor, dismiss] |

**Error responses (config endpoint)**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 400 | TARGET_LIMIT | >20 companies / >10 roles | "Up to 20 companies and 10 roles." | No |
| 400 | INVALID_FILTER | bad filter | "Check your filters." | No |

**4.15.8 State model**
```
Monitor: Active → (Snoozed → auto-resume) | Paused → resume
Alert: Discovered → LegitimacyCheck → FitRank → DedupeCheck → CapCheck → (Dispatched | Suppressed | Batched)
LegitimacyCheck→Suppressed: F-059 fail
FitRank→Suppressed: below threshold
DedupeCheck→Suppressed: duplicate
CapCheck→Batched: over daily cap → digest
```

**4.15.9 Sequence (happy path)**
```
[cron] Discovery(F-058) finds posting matching target
→ F-059 legitimacy filter (pass)
→ fit-rank vs candidate (personalized, ≥threshold)
→ dedupe (new)
→ cap-check (under)
→ Platform F-084 dispatch alert {why_it_fits}
Cand→App: open alert → [rate F-005 | tailor F-002]  (never auto-apply)
```

**4.15.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Ghost posting matches targets | No alert (legitimacy filter) |
| Same role re-discovered | Deduped; no second alert |
| 20+ matches in a day | Batched into a digest |
| Below-threshold keyword match | Suppressed (quality bar) |
| Snooze window elapses | Auto-resume |
| Target company has zero openings | No alert; no error |
| Discovery source down | Degrade gracefully; resume on recovery; no false "no jobs" claim |
| User sets conflicting filters (remote + on-site) | Validate; ask to resolve |
| Notification channel fails | Retry via Platform F-084; fall back to in-app |
| User over target limit | `400 TARGET_LIMIT` |

**4.15.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-015.1 | Relevance | Alert relevance (engaged/sent) ≥40%→55% (MC-5) | Analytics |
| NFR-015.2 | Freshness | New fitting role alerted within the monitoring cycle (≤24 h) | Probe |
| NFR-015.3 | Precision | 0 alerts for legitimacy-failed postings | Audit |
| NFR-015.4 | Anti-fatigue | Daily cap never exceeded | Test |

**4.15.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-015.1 | Target criteria + alert history candidate-private (trust wall) |
| SR-015.2 | Alert links validated (no open-redirect) |

**4.15.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| No auto-apply principle | FR-015.9 |
| Anti-spam / consent (notifications) | FR-015.7, F-090c |

**4.15.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| monitor_alerts_sent_total | Counter | channel | — |
| monitor_alert_relevance | Gauge | — | <40% = P2 (fatigue risk) |
| monitor_ghost_suppressed_total | Counter | — | — |
| monitor_dedupe_suppressed_total | Counter | — | — |
| monitor_cycle_lag_seconds | Histogram | — | >24h = P2 |

**4.15.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-015.1 | **Fit alert** | fitting legitimate role appears | personalized alert w/ "why it fits" | FR-015.3/.4, AC-015.1.1 | Integration |
| TC-015.2 | **Ghost filtered** | ghost posting matches | no alert | FR-015.2, AC-015.1.2 | Integration |
| TC-015.3 | **Dedupe** | same role re-discovered | no second alert | FR-015.6, AC-015.1.3 | Integration |
| TC-015.4 | **Snooze** | snooze 2 weeks | pauses; auto-resumes; targets intact | FR-015.5, AC-015.1.4 | Integration |
| TC-015.5 | Below-threshold | low-fit keyword match | suppressed | FR-015.8, AC-015.1.5 | Unit |
| TC-015.6 | **Alert cap / digest** | 20 matches in a day | batched into digest | FR-015.7, AC-015.1.6 | Integration |
| TC-015.7 | **No auto-apply** | open an alert | actions present; nothing auto-applied | FR-015.9, AC-015.1.7 | E2E |
| TC-015.8 | Pause entirely | pause monitoring | no alerts; setup preserved | FR-015.5, AC-015.1.8 | Integration |
| TC-015.9 | Target limit | 21 companies | `400 TARGET_LIMIT` | BR-015.1 | Unit |
| TC-015.10 | Discovery source down | source outage | graceful; resumes; no false claim | edge table | E2E |
| TC-015.11 | Open-redirect link | malicious alert URL | blocked | SR-015.2 | Security |
| TC-015.12 | Trust-wall | employer reads targets | denied | SR-015.1 | Security |

**4.15.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-015.1 | Default cadence (digest vs instant) that maximizes relevance without fatigue | PM | A/B |

---

### 4.16 Feature F-016 — Salary / market-value tracking
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-107

**4.16.1 Description.** Tracks compensation bands per role/location (Engine F-053 / a comp-data partner) for the
candidate's profile and target roles, and notifies them when their market value shifts meaningfully — a retention
hook for passive users and an input to offer evaluation (F-022).

**4.16.2 Triggers**
- Candidate sets/updates their role + location for tracking.
- Periodic comp-band refresh detects a meaningful shift.

**4.16.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-016.1 | The system shall retrieve comp bands (p25/p50/p75/p90) per role + location from a comp-data source (cached ≤30 days). | Must |
| FR-016.2 | The system shall compute the candidate's estimated market value vs their current/target comp. | Must |
| FR-016.3 | The system shall notify the candidate when market value shifts ≥ a configurable threshold (default ≥5%). | Should |
| FR-016.4 | The system shall present comp data as a range with a confidence/source note — never a single fabricated number. | Must |
| FR-016.5 | The system shall feed comp bands to offer evaluation (F-022). | Should |

**4.16.4 User stories & acceptance criteria**
- AC-016.1.1 — Given my role + location, when tracked, then I see a comp band (p25–p90) with a source/confidence note.
- AC-016.1.2 — Given my market value shifts **≥5%**, then I'm notified.
- AC-016.1.3 — Given **no comp data** for a niche role/location, then an honest "limited data" message — not a fabricated number.
- AC-016.1.4 — Given stale cache (>30 days), then it refreshes before display.

**4.16.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-016.1 | Comp shown as a range + source; never a single invented figure | Render | Suppress; show "limited data" |
| BR-016.2 | Cache TTL ≤30 days | Fetch | Refresh on expiry |
| BR-016.3 | Notify only on ≥ threshold shift | Dispatch | Suppress below threshold |

**4.16.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| role | string | Y | normalized title | "Senior PM" | Profile |
| location | string | Y | city/country | "Dubai" | Profile |
| current_comp | number | N | for delta | 180000 | User |
| threshold | number | N | default 5% | 0.05 | User |

**4.16.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| band | object | Y | {p25, p50, p75, p90, currency} |
| source | string | Y | provider + date |
| confidence | enum | Y | high/med/low |
| vs_current | number | N | delta % |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 404 | NO_COMP_DATA | niche role/location | "Limited comp data for this role." | No |
| 503 | COMP_SOURCE_UNAVAILABLE | partner down | "Try again shortly." | Yes |

**4.16.8 State model.** *Cached value per (role, location); refresh job on TTL expiry; notification on threshold breach.*

**4.16.9 Sequence (happy path)**
```
Cand→App: track(role, location, current_comp)
App→CompSource/cache: bands(role, location)
App→App: compute vs_current, confidence
App→Cand: 200 {band, source, confidence, vs_current}
[cron] refresh → if shift≥threshold → notify (F-084)
```

**4.16.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| No data for role/location | `404 NO_COMP_DATA`; honest message; no invented figure |
| Comp source down | `503`; serve cached if fresh; else honest wait |
| Stale cache | Refresh before display |
| Extreme outlier data | Flag low confidence; widen range |
| Currency mismatch | Normalize to user's currency; note conversion |

**4.16.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-016.1 | Latency | Band lookup ≤3 s p95 (cache hit ≤200 ms) | Probes |
| NFR-016.2 | Honesty | 0 fabricated single-figure comps | Audit |

**4.16.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-016.1 | Comp + salary data candidate-private (trust wall) |

**4.16.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI (no invented figures) | FR-016.4, BR-016.1 |

**4.16.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| comp_lookup_total | Counter | hit/miss | — |
| comp_no_data_rate | Gauge | — | high = coverage gap |
| comp_shift_notify_total | Counter | — | — |

**4.16.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-016.1 | **Shift notification** | value shifts ≥5% | notified | FR-016.3, AC-016.1.2 | Integration |
| TC-016.2 | Band display | role+location | p25–p90 + source + confidence | FR-016.1/.4, AC-016.1.1 | Integration |
| TC-016.3 | **No comp data** | niche role | `404 NO_COMP_DATA`; no invented figure | FR-016.4, AC-016.1.3 | Integration |
| TC-016.4 | Stale cache | >30 days | refresh before display | BR-016.2, AC-016.1.4 | Unit |
| TC-016.5 | Source down | partner outage | `503`; cached if fresh | edge table | E2E |
| TC-016.6 | Trust-wall | employer reads comp | denied | SR-016.1 | Security |

**4.16.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-016.1 | Comp-data partner selection | PM + Finance | Open |

### 4.17 Feature F-017 — Skill-gap + learning path
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** —

**4.17.1 Description.** Compares the candidate's master profile (F-003) to one or more target roles, flags missing
capabilities by importance, and produces a prioritized learning path with recommended resources. Honest about what's
a genuine gap vs. a presentation issue.

**4.17.2 Triggers**
- Candidate requests a skill-gap analysis for a target role.
- Re-runs after profile or target changes.

**4.17.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-017.1 | The system shall compare the profile to the target role's required capabilities and flag missing/weak ones by importance. | Must |
| FR-017.2 | The system shall produce a prioritized learning path (ordered, with effort estimates). | Must |
| FR-017.3 | The system shall distinguish a true skill gap from a presentation gap (the skill exists but isn't shown) and route the latter to résumé/profile fixes. | Should |
| FR-017.4 | The system shall recommend concrete resources (courses/certs) where available, clearly labeled as suggestions. | Should |
| FR-017.5 | The system shall not overstate certainty; gaps are evidence-based, with confidence. | Must |

**4.17.4 User stories & acceptance criteria**
- AC-017.1.1 — Given a target role, when analyzed, then I see ranked missing capabilities + a prioritized learning path.
- AC-017.1.2 — Given a skill I **have but didn't surface**, then it's flagged as a presentation gap (fix the résumé), not a learning gap.
- AC-017.1.3 — Given **no clear target role**, then I'm asked to specify one rather than getting a generic list.
- AC-017.1.4 — Given a niche role with little data, then an honest low-confidence result.

**4.17.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-017.1 | A gap must be evidence-based (from profile vs role) | Generation | Drop unsupported gaps |
| BR-017.2 | Presentation gaps routed to F-002/F-011, not learning | Classify | Re-route |

**4.17.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| profile_id | uuid | Y | master profile | prof_1 | F-003 |
| target_role | string | Y | role + level | "Staff PM" | User |

**4.17.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| gaps[] | array | Y | {capability, importance, confidence, type:learning|presentation} |
| learning_path[] | array | Y | ordered steps + effort |
| resources[] | array | N | suggested courses/certs |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 400 | MISSING_TARGET | no role | "Pick a target role to compare against." | No |
| 503 | ENGINE_UNAVAILABLE | AI down | "Try again shortly." | Yes |

**4.17.8 State model.** *Stateless analysis per request; learning path can be saved to the profile.*

**4.17.9 Sequence (happy path)**
```
Cand→App: analyze(profile_id, target_role)
App→Engine: compare(profile, role_requirements)
Engine→App: {gaps[], path[], resources[]}
App→Cand: 200 (gaps classified learning vs presentation)
```

**4.17.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| No target role | `400 MISSING_TARGET` |
| Skill present but unsurfaced | Flag as presentation gap; route to fix |
| Niche role, thin data | Low-confidence; honest |
| Profile already strong | "Few gaps — here's the edge"; not empty |
| Engine down | `503` |

**4.17.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-017.1 | Latency | Analysis ≤15 s p95 | Probes |
| NFR-017.2 | Honesty | Gaps evidence-based; confidence shown | Eval |

**4.17.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-017.1 | Candidate-private (trust wall) |

**4.17.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI (no overstated gaps) | FR-017.5, BR-017.1 |

**4.17.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| skillgap_total | Counter | — | — |
| skillgap_presentation_route_rate | Gauge | — | — |

**4.17.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-017.1 | **Gap output** | profile + target | ranked gaps + learning path | FR-017.1/.2, AC-017.1.1 | Integration |
| TC-017.2 | **Presentation gap** | skill present, unsurfaced | flagged presentation; routed to fix | FR-017.3, AC-017.1.2 | Integration |
| TC-017.3 | Missing target | no role | `400 MISSING_TARGET` | BR-017, AC-017.1.3 | Unit |
| TC-017.4 | Niche role | thin data | low-confidence honest result | AC-017.1.4 | Integration |
| TC-017.5 | Engine down | timeout | `503` | edge table | E2E |

**4.17.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-017.1 | Learning-resource provider/partner | PM | Open |

---

### 4.18 Feature F-018 — Application tracker + analytics
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-107

**4.18.1 Description.** Maintains a per-application record (company, role, dates, status, full history) with explainable
per-application fit scoring and personal funnel analytics, so the candidate can manage their search and see what's working.

**4.18.2 Triggers**
- Candidate adds an application (manually, from a rating, or from a sent application).
- Candidate updates status; views analytics.

**4.18.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-018.1 | The system shall maintain a per-application record: company, role, dates, status, and a full status history. | Must |
| FR-018.2 | The system shall attach an explainable fit score to each application. | Must |
| FR-018.3 | The system shall provide personal funnel analytics (applied → interview → offer rates) over a selectable date range. | Should |
| FR-018.4 | The system shall enforce a valid status state machine (no skipping illegal transitions). | Must |
| FR-018.5 | The system shall let the candidate filter/sort applications by company/role/status/date. | Should |

**4.18.4 User stories & acceptance criteria**
- AC-018.1.1 — Given an application, when I advance its status, then the history records it with a timestamp.
- AC-018.1.2 — Given several applications, when I open analytics, then I see my funnel rates over the chosen range.
- AC-018.1.3 — Given an **illegal status transition** (e.g. Offer → Applied), then it's rejected.
- AC-018.1.4 — Given I filter by "Interviewing," then only those applications show.

**4.18.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-018.1 | Status transitions follow the defined state machine | Update | `409 ILLEGAL_TRANSITION` |
| BR-018.2 | Application linked to a job/version where applicable | Create | Allow standalone too |

**4.18.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| company | string | Y | — | "Stripe" | User/job |
| role | string | Y | — | "Senior PM" | User/job |
| status | enum | Y | Saved/Applied/Interviewing/Offer/Rejected/Withdrawn | Applied | User |

**4.18.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| application_id | uuid | Y | — |
| status | enum | Y | current |
| history[] | array | Y | timestamped transitions |
| fit | object | N | score + explanation |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 409 | ILLEGAL_TRANSITION | bad status change | "That status change isn't allowed." | No |

**4.18.8 State model**
```
Application: Saved → Applied → Interviewing → (Offer | Rejected) ; any → Withdrawn
Illegal transitions rejected (e.g. Offer→Applied)
```

**4.18.9 Sequence (happy path)**
```
Cand→App: update_status(application_id, "Interviewing")
App→App: validate transition
App→Store: append history
App→Cand: 200 {status, history}
```

**4.18.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Illegal transition | `409 ILLEGAL_TRANSITION` |
| Duplicate application (same company/role) | Warn; allow with confirm |
| Analytics with no data | Empty-state, not an error |
| Bulk import | Validate each; partial success |

**4.18.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-018.1 | Latency | Tracker loads ≤1 s p95 | Probes |
| NFR-018.2 | Integrity | History is append-only, never lost | Test |

**4.18.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-018.1 | Application data candidate-private (trust wall) |

**4.18.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Data rights (export/delete) | links to F-093c |

**4.18.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| applications_total | Counter | status | — |
| tracker_load_ms | Histogram | — | p95>1s = P3 |

**4.18.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-018.1 | **Status lifecycle** | advance through states | history recorded each step | FR-018.1, AC-018.1.1 | Integration |
| TC-018.2 | Funnel analytics | several apps | correct rates over range | FR-018.3, AC-018.1.2 | Integration |
| TC-018.3 | **Illegal transition** | Offer→Applied | `409 ILLEGAL_TRANSITION` | FR-018.4, AC-018.1.3 | Unit |
| TC-018.4 | Filter | filter Interviewing | only those shown | FR-018.5, AC-018.1.4 | Unit |
| TC-018.5 | Empty analytics | no apps | empty-state | edge table | Unit |
| TC-018.6 | Trust-wall | employer reads tracker | denied | SR-018.1 | Security |

**4.18.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-018.1 | Auto-detect status from email (opt-in) later? | PM | Open |

---

### 4.19 Feature F-019 — Proof-point library
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** —

**4.19.1 Description.** A per-user library of quantified achievements ("launched X, grew Y by Z%") extracted from the
profile and articles/links, reusable across résumés, outreach, and interview answers — cited for outcome attribution.
User-owned facts only; never fabricated.

**4.19.2 Triggers**
- Candidate adds/edits a proof point, or the system extracts candidates from the profile/links.
- Generation (F-002/F-013/F-010) requests proof points.

**4.19.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-019.1 | The system shall maintain a per-user proof-point library (≤200), each with a metric, context, and source. | Must |
| FR-019.2 | The system shall extract candidate proof points from the profile/links for the user to confirm — never auto-asserting unverified metrics. | Should |
| FR-019.3 | The system shall make proof points reusable in résumé bullets, outreach, and interview answers, cited by id. | Must |
| FR-019.4 | The system shall never fabricate a metric; user confirms any extracted figure. | Must |

**4.19.4 User stories & acceptance criteria**
- AC-019.1.1 — Given proof points, when I tailor a résumé, then relevant ones are reused and cited.
- AC-019.1.2 — Given the system **extracts a metric from a link**, then I must confirm it before it's used.
- AC-019.1.3 — Given an attempt to **invent a metric**, then it's refused.
- AC-019.1.4 — Given the 201st proof point, then `409 PROOF_LIMIT`.

**4.19.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-019.1 | No fabricated metric; user-confirmed only | Add/extract | Require confirmation |
| BR-019.2 | ≤200 proof points/user | Add | `409 PROOF_LIMIT` |

**4.19.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| metric | string | Y | the quantified claim | "grew MAU 40%" | User |
| context | string | Y | where/when | "at Acme, 2024" | User |
| source | string | N | link/proof | url | User |

**4.19.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| proof_id | uuid | Y | — |
| confirmed | bool | Y | user-verified |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 409 | PROOF_LIMIT | >200 | "Proof-point limit reached." | No |

**4.19.8 State model.** ProofPoint: Suggested → (Confirmed | Rejected) → Reusable.

**4.19.9 Sequence (happy path)**
```
Cand→App: add(metric, context, source)
App→Store: save (confirmed=true)
[gen] F-002 requests proof points → returns confirmed ones, cited
```

**4.19.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Extracted metric | Require user confirm before use |
| Invent-a-metric request | Refused |
| Over limit | `409 PROOF_LIMIT` |
| Duplicate proof point | Suggest merge |

**4.19.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-019.1 | Honesty | 0 unconfirmed metrics used in output | Audit |

**4.19.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-019.1 | Candidate-private (trust wall) |

**4.19.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no fabrication | FR-019.4, BR-019.1 |

**4.19.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| proofpoint_total | Counter | — | — |
| proofpoint_reuse_total | Counter | feature | — |

**4.19.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-019.1 | **Reuse in tailoring** | tailor with proof points | relevant ones cited | FR-019.3, AC-019.1.1 | Integration |
| TC-019.2 | **Extract requires confirm** | metric from a link | user must confirm | FR-019.2, AC-019.1.2 | Integration |
| TC-019.3 | **Invent refusal** | "make up a metric" | refused | FR-019.4, AC-019.1.3 | Integration |
| TC-019.4 | Proof limit | 201st | `409 PROOF_LIMIT` | BR-019.2 | Unit |
| TC-019.5 | Trust-wall | employer reads | denied | SR-019.1 | Security |

**4.19.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-019.1 | Auto-extract proof points on profile build? | PM | Open |

---

### 4.20 Feature F-020 — Follow-up cadence
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-109

**4.20.1 Description.** Generates follow-up message drafts on a sensible cadence for live applications (post-apply,
post-interview, check-in), in the user's voice — draft-only, never auto-sent.

**4.20.2 Triggers**
- An application reaches a stage where a follow-up is appropriate; or the candidate requests one.

**4.20.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-020.1 | The system shall propose follow-up drafts on a stage-appropriate cadence (e.g. +3 days post-apply, +1 day post-interview). | Must |
| FR-020.2 | The system shall never auto-send a follow-up (draft + remind only). | Must |
| FR-020.3 | The system shall draft in the user's voice (F-055) and reference the specific application context. | Should |
| FR-020.4 | The system shall not over-prompt (max 1 follow-up suggestion per application per 3 days). | Should |

**4.20.4 User stories & acceptance criteria**
- AC-020.1.1 — Given a live application 3 days post-apply, when due, then a follow-up draft is offered (not sent).
- AC-020.1.2 — Given a draft, then it is **never sent automatically**.
- AC-020.1.3 — Given I dismiss a follow-up, then I'm not re-prompted for that stage.
- AC-020.1.4 — Given an application is **Rejected/Withdrawn**, then no follow-ups are suggested.

**4.20.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-020.1 | No auto-send | Service | N/A (no send path) |
| BR-020.2 | ≤1 suggestion/application/3 days | Dispatch | Suppress |
| BR-020.3 | No follow-ups on closed applications | Trigger | Suppress |

**4.20.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| application_id | uuid | Y | live application | app_1 | F-018 |
| stage | enum | Y | post_apply/post_interview | post_apply | System |

**4.20.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| draft | string | Y | follow-up copy |
| send_via | enum | Y | copy/email-link (user sends) |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 409 | TOO_SOON | within 3 days | "You followed up recently." | No |

**4.20.8 State model.** Per application stage: NoFollowup → Suggested → (Drafted | Dismissed).

**4.20.9 Sequence (happy path)**
```
[cron] application 3d post-apply → suggest
Cand→App: generate follow-up(application_id, stage)
App→Engine: draft(context, voice)
App→Cand: 200 {draft}  (user copies/sends themselves)
```

**4.20.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Application closed | No suggestion |
| Suggested too recently | `409 TOO_SOON` |
| Dismissed | No re-prompt for that stage |
| Engine down | `503`; retry |

**4.20.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-020.1 | Latency | Draft ≤8 s p95 | Probes |

**4.20.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-020.1 | Candidate-private; no auto-send |

**4.20.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| No auto-send / anti-spam | FR-020.2 |

**4.20.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| followup_suggested_total | Counter | stage | — |
| followup_dismiss_rate | Gauge | — | high = over-prompting |

**4.20.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-020.1 | **Cadence draft** | 3d post-apply | follow-up draft offered | FR-020.1, AC-020.1.1 | Integration |
| TC-020.2 | **No auto-send** | a draft | never sent | FR-020.2, AC-020.1.2 | Unit |
| TC-020.3 | Dismiss | dismiss stage | no re-prompt | BR-020, AC-020.1.3 | Integration |
| TC-020.4 | Closed application | Rejected app | no follow-up | BR-020.3, AC-020.1.4 | Unit |
| TC-020.5 | Too soon | within 3 days | `409 TOO_SOON` | BR-020.2 | Unit |

**4.20.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-020.1 | Optional one-click send via user's email (consented)? | PM | Open |

---

### 4.21 Feature F-021 — Application form-assist (HITL)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** —

**4.21.1 Description.** Scans a known application form (e.g. Greenhouse/Lever) and drafts answers cited from the user's
evidence (profile, proof points, stories) — with a mandatory human-approval gate before any field is filled or
submitted. This is *assist*, not auto-apply.

**4.21.2 Triggers**
- Candidate is on a supported application form and requests assist.

**4.21.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-021.1 | The system shall scan a supported form and classify each field/question. | Must |
| FR-021.2 | The system shall draft answers cited from the user's evidence (profile/proof/stories). | Must |
| FR-021.3 | The system shall require explicit human approval per field before it is filled; nothing is submitted automatically. | Must |
| FR-021.4 | The system shall save reusable answers to custom questions for future forms. | Should |
| FR-021.5 | The system shall never submit the form on the user's behalf (no auto-apply). | Must |
| FR-021.6 | The system shall refuse to fabricate answers; if evidence is missing, it asks the user. | Must |

**4.21.4 User stories & acceptance criteria**
- AC-021.1.1 — Given a supported form, when I assist, then each field gets a cited draft answer I must approve.
- AC-021.1.2 — Given I approve fields, then they're filled; **the form is never submitted automatically**.
- AC-021.1.3 — Given a question with **no supporting evidence**, then I'm asked rather than given a fabricated answer.
- AC-021.1.4 — Given a custom question I've answered before, then the saved answer is reused.

**4.21.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-021.1 | Human-in-the-loop mandatory per field | Fill | Block until approved |
| BR-021.2 | Never submit the form | Service | No submit path |
| BR-021.3 | No fabricated answers | Draft | Ask user |

**4.21.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| form_url | string | Y | supported ATS form | greenhouse… | User |
| profile_id | uuid | Y | evidence | prof_1 | F-003 |

**4.21.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| fields[] | array | Y | {question, draft, cite, requires_approval:true} |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 422 | UNSUPPORTED_FORM | unknown ATS | "This form isn't supported yet." | No |

**4.21.8 State model.** Field: Drafted → AwaitingApproval → (Filled | Skipped). Form: never auto-submitted.

**4.21.9 Sequence (happy path)**
```
Cand→App: assist(form_url, profile_id)
App→App: scan + classify fields
App→Engine: draft per field (cited)
App→Cand: drafts (each requires approval)
Cand→App: approve → fill (no submit)
```

**4.21.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Unsupported form | `422 UNSUPPORTED_FORM` |
| No evidence for a question | Ask user; don't fabricate |
| User skips a field | Left blank; no auto-fill |
| Attempt auto-submit | Blocked (principle) |
| Form changes mid-fill | Re-scan; preserve approved answers |

**4.21.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-021.1 | Latency | Field drafts ≤15 s p95 | Probes |
| NFR-021.2 | Safety | 0 auto-submissions | Audit |

**4.21.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-021.1 | Candidate-private; no credential storage for third-party forms |

**4.21.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Human-in-the-loop / no auto-apply | FR-021.3, FR-021.5, BR-021.1/.2 |
| Honest-AI | FR-021.6 |

**4.21.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| formassist_total | Counter | ats | — |
| formassist_autosubmit_total | Counter | — | any>0 = P1 (principle breach) |

**4.21.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-021.1 | **Approve gate** | assist a form | each field requires approval | FR-021.3, AC-021.1.1 | Integration |
| TC-021.2 | **No auto-submit** | approve all | filled, not submitted | FR-021.5, AC-021.1.2 | E2E |
| TC-021.3 | **No evidence** | unanswerable question | asks user; no fabrication | FR-021.6, AC-021.1.3 | Integration |
| TC-021.4 | Reuse saved answer | repeat custom question | saved answer reused | FR-021.4, AC-021.1.4 | Integration |
| TC-021.5 | Unsupported form | unknown ATS | `422 UNSUPPORTED_FORM` | BR-021 | Unit |

**4.21.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-021.1 | Which ATS forms to support first (Greenhouse/Lever/Ashby)? | PM | Open |

---

### 4.22 Feature F-022 — Offer evaluation
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-109

**4.22.1 Description.** Parses a job offer, benchmarks it against market comp (F-016), surfaces negotiation levers and
risks, and gives an honest, evidence-based recommendation — never pressuring, never inventing comp data.

**4.22.2 Triggers**
- Candidate pastes/uploads an offer for evaluation.

**4.22.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-022.1 | The system shall parse an offer (base, bonus, equity, benefits, location) from pasted text or a document. | Must |
| FR-022.2 | The system shall benchmark the offer against market bands (F-016) and show where it sits (p-rank). | Must |
| FR-022.3 | The system shall surface negotiation levers and risks specific to the offer. | Must |
| FR-022.4 | The system shall give an honest recommendation grounded in data; it shall not pressure a decision. | Must |
| FR-022.5 | The system shall be explicit about uncertainty (e.g. private-company equity) rather than inventing a valuation. | Must |

**4.22.4 User stories & acceptance criteria**
- AC-022.1.1 — Given an offer, when evaluated, then I see base vs market p-rank, levers, risks, and an honest recommendation.
- AC-022.1.2 — Given **private-company equity** with no clear valuation, then the uncertainty is stated, not invented.
- AC-022.1.3 — Given an **unparseable offer**, then I'm asked to paste the key numbers — no fabricated evaluation.
- AC-022.1.4 — Given a strong offer, the recommendation is honest (e.g. "strong; minor lever on X"), not artificially negative to seem useful.

**4.22.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-022.1 | No invented comp/equity valuation | Generation | State uncertainty |
| BR-022.2 | No decision pressure; advisory only | Output | Neutral framing |

**4.22.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| offer | string/file | Y | text or doc | "Base $180k…" | User |
| role/location | string | N | for benchmark | "PM / Dubai" | Profile |

**4.22.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| parsed | object | Y | {base, bonus, equity, benefits} |
| benchmark | object | Y | p-rank vs market + confidence |
| levers[] | array | Y | negotiation points |
| risks[] | array | Y | — |
| recommendation | string | Y | honest, non-pressuring |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 422 | OFFER_UNPARSEABLE | can't parse | "Paste the base, bonus, and equity." | No |
| 503 | ENGINE_UNAVAILABLE | down | "Try again shortly." | Yes |

**4.22.8 State model.** *Stateless evaluation per request; can save to the application (F-018).*

**4.22.9 Sequence (happy path)**
```
Cand→App: evaluate(offer, role/location)
App→Engine: parse + benchmark(F-016) + levers/risks
Engine→App: {parsed, benchmark, levers, risks, recommendation}
App→Cand: 200 (honest recommendation; uncertainty noted)
```

**4.22.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Private-company equity | State uncertainty; don't invent valuation |
| Unparseable offer | `422`; ask for key numbers |
| No market data for role | Honest "limited benchmark" |
| Strong offer | Honest positive recommendation |
| Engine down | `503` |

**4.22.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-022.1 | Latency | Evaluation ≤20 s p95 | Probes |
| NFR-022.2 | Honesty | 0 invented comp/equity figures | Audit |

**4.22.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-022.1 | Offer data candidate-private (trust wall) |

**4.22.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Honest-AI / no invented figures | FR-022.5, BR-022.1 |
| Non-pressuring advice | FR-022.4, BR-022.2 |

**4.22.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| offer_eval_total | Counter | — | — |
| offer_unparseable_rate | Gauge | — | high = parser gap |

**4.22.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-022.1 | **Parse + benchmark + recommend** | a full offer | p-rank, levers, risks, honest rec | FR-022.1-.4, AC-022.1.1 | Integration |
| TC-022.2 | **Private equity uncertainty** | startup equity, no valuation | uncertainty stated, not invented | FR-022.5, AC-022.1.2 | Integration |
| TC-022.3 | **Unparseable offer** | garbled text | `422`; ask for numbers | FR-022.1, AC-022.1.3 | Integration |
| TC-022.4 | Strong offer honesty | great offer | honest positive rec | BR-022.2, AC-022.1.4 | Unit |
| TC-022.5 | No market data | niche role | honest limited benchmark | edge table | Integration |
| TC-022.6 | Trust-wall | employer reads offer | denied | SR-022.1 | Security |

**4.22.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-022.1 | Equity-valuation methodology for private companies | PM | Open |

### 4.23 Feature F-023 — Relocation / visa signals
**Owner:** PM · **Priority:** P2 · **Release:** v1.1 · **PRD:** §7.1

**4.23.1 Description.** Lets relocation seekers filter/target roles by location/country and surfaces relocation- and
visa-friendly signals plus target-market norms, grounded in evidence — never asserting visa eligibility it can't verify.
**4.23.2 Triggers.** Candidate sets a target location/country; views a role's relocation signals.
**4.23.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-023.1 | The system shall filter/target roles by location/country, including "remote-from" and "relocation-friendly" flags. | Must |
| FR-023.2 | The system shall surface visa/sponsorship signals for a role where publicly available, labeled with confidence. | Should |
| FR-023.3 | The system shall present target-market norms (résumé conventions, comp) for the destination. | Should |
| FR-023.4 | The system shall never assert visa eligibility it cannot verify; it provides signals + a "verify with the employer/authority" note. | Must |
**4.23.4 ACs.** AC-023.1.1 — Given a target country, when I filter, then I see relocation-friendly roles + visa signals with confidence. AC-023.1.2 — Given an **unverifiable visa claim**, then it's labeled "signal only — verify," never asserted as fact. AC-023.1.3 — Given no relocation data for a market, then an honest "limited data."
**4.23.5 Business rules.** BR-023.1 — No definitive visa-eligibility assertions (legal risk). **4.23.6 I/O.** In:{target_location, role}. Out:{roles[], visa_signals[], norms}. **4.23.7 Errors.** 404 NO_MARKET_DATA. **4.23.8 State.** Stateless filter. **4.23.9 Sequence.** filter→signals→present. **4.23.10 Edge.** Conflicting visa info→present uncertainty; sanctioned country→handle per policy. **4.23.11 NFR.** ≤5s. **4.23.12 Security.** SR-023.1 candidate-private. **4.23.13 Compliance.** No legal/immigration advice (FR-023.4). **4.23.14 Obs.** relocation_filter_total. **4.23.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-023.1 | **Location filter** | relocation-friendly roles + visa signals |
| TC-023.2 | **Unverifiable visa claim** | "signal only — verify"; not asserted |
| TC-023.3 | No market data | honest limited-data message |
**4.23.16 Open Q.** Visa-data source partner?

---

### 4.24 Feature F-024 — Gap-framing / skill-translation
**Owner:** PM · **Priority:** P2 · **Release:** v1.1 · **PRD:** §7.1

**4.24.1 Description.** Helps returners frame employment gaps honestly and helps career-changers translate transferable
skills into a target field — always truthful (never inventing experience to hide a gap).
**4.24.2 Triggers.** Candidate with a gap/career-change requests framing help.
**4.24.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-024.1 | The system shall produce honest framing for an employment gap (what to say, what to emphasize) without fabricating activity. | Must |
| FR-024.2 | The system shall translate the user's transferable skills into the target field's language. | Must |
| FR-024.3 | The system shall never invent experience or activity to "fill" a gap. | Must |
**4.24.4 ACs.** AC-024.1.1 — Given a 2-year gap, when I ask, then I get honest framing + emphasis guidance. AC-024.1.2 — Given a career change, then my transferable skills are mapped to the target field's terms. AC-024.1.3 — Given a request to **invent activity** to hide a gap, then it's refused.
**4.24.5 Business rules.** BR-024.1 — No fabricated activity/experience. **4.24.6 I/O.** In:{gap_context|current_field, target_field}. Out:{framing, skill_map}. **4.24.7 Errors.** 503. **4.24.8 State.** Stateless. **4.24.9 Sequence.** request→frame/translate→present. **4.24.10 Edge.** Long gap→honest, constructive; sensitive gap reason (health/caregiving)→respectful, no probing. **4.24.11 NFR.** ≤8s. **4.24.12 Security.** candidate-private. **4.24.13 Compliance.** Honest-AI (FR-024.3). **4.24.14 Obs.** gap_framing_total. **4.24.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-024.1 | **Gap framing** | honest framing + emphasis |
| TC-024.2 | Skill translation | transferable skills mapped to target field |
| TC-024.3 | **Invent-activity refusal** | refused; no fabrication |
**4.24.16 Open Q.** —

---

### 4.25 Feature F-025 — Portfolio / work-samples
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-110

**4.25.1 Description.** A builder to add/host work samples (case studies, code, designs, links) with shareable,
privacy-controlled links — the substance a weak résumé hides; the candidate-side complement to substance-screening.
**4.25.2 Triggers.** Candidate adds a sample; generates/revokes a share link.
**4.25.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-025.1 | The system shall let a user add/host work samples (file ≤25 MB or link) with title, description, tags. | Must |
| FR-025.2 | The system shall produce a shareable link, **private by default**, with a per-link visibility setting and revocation. | Must |
| FR-025.3 | The system shall link samples to applications and the profile. | Should |
| FR-025.4 | The system shall scan uploaded sample files for malware. | Must |
| FR-025.5 | The system shall let a share link be revoked at any time, immediately invalidating it. | Must |
**4.25.4 ACs.** AC-025.1.1 — Given I add a sample + share it, then a private-by-default link is created. AC-025.1.2 — Given I **revoke** a share link, then it stops working immediately. AC-025.1.3 — Given a **malware file**, then it's rejected. AC-025.1.4 — Given a sample, default visibility is private until I choose otherwise.
**4.25.5 Business rules.** BR-025.1 — Private by default; BR-025.2 — File ≤25 MB; malware-scanned; BR-025.3 — Revocation immediate. **4.25.6 I/O.** In:{file|link, title, tags, visibility}. Out:{sample_id, share_url?}. **4.25.7 Errors.** 413 SAMPLE_TOO_LARGE; 422 FILE_REJECTED_SECURITY. **4.25.8 State.** Sample: Draft→Published→(Shared→Revoked). **4.25.9 Sequence.** add→scan→store→share(private)→revoke. **4.25.10 Edge.** Revoked link accessed→404; large media→size guard; link guessing→unguessable tokens. **4.25.11 NFR.** Upload ≤10s; revoke effective ≤1s. **4.25.12 Security.** SR-025.1 unguessable share tokens; revocable; private default; malware scan; SR-025.2 no public indexing without consent. **4.25.13 Compliance.** Data rights (export/delete via F-093c). **4.25.14 Obs.** samples_total; share_revoke_total. **4.25.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-025.1 | **Add + share + revoke** | private link created; revoke invalidates immediately |
| TC-025.2 | **Malware file** | `422 FILE_REJECTED_SECURITY` |
| TC-025.3 | Revoked link access | 404 |
| TC-025.4 | Default visibility | private until changed |
| TC-025.5 | Oversize file | `413 SAMPLE_TOO_LARGE` |
| TC-025.6 | Token guessing | unguessable; no enumeration |
**4.25.16 Open Q.** Hosting limits / CDN for media samples?

---

### 4.26 Feature F-026 — Candidate interview scheduling
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1

**4.26.1 Description.** Lets a candidate manage multiple interview rounds in a calendar view, sync with an external
calendar, and honor employer-sent self-schedule links (F-041) — coordinating rounds without chaos.
**4.26.2 Triggers.** Candidate adds/edits an interview; accepts an employer self-schedule link; syncs calendar.
**4.26.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-026.1 | The system shall let a candidate view/manage multiple interview rounds per application in a calendar. | Must |
| FR-026.2 | The system shall sync (read/write) with Google/Microsoft calendar via OAuth. | Should |
| FR-026.3 | The system shall honor an employer-sent self-schedule link (F-041) and reflect the booked slot. | Should |
| FR-026.4 | The system shall detect and warn on scheduling conflicts (overlap). | Must |
| FR-026.5 | The system shall handle time zones correctly (store UTC, display local). | Must |
**4.26.4 ACs.** AC-026.1.1 — Given multiple rounds, when I view, then a calendar shows them by application. AC-026.1.2 — Given a **time-zone difference**, then times display correctly in my local zone. AC-026.1.3 — Given an **overlapping slot**, then I'm warned of the conflict. AC-026.1.4 — Given I accept an employer self-schedule link, then the booked slot appears.
**4.26.5 Business rules.** BR-026.1 — Store UTC; display local; BR-026.2 — Warn on overlap. **4.26.6 I/O.** In:{interview: {app_id, round, datetime, tz}}. Out:{calendar_view}. **4.26.7 Errors.** 409 SCHEDULE_CONFLICT (warn); 401 CALENDAR_AUTH. **4.26.8 State.** Interview: Scheduled→(Rescheduled|Completed|Cancelled). **4.26.9 Sequence.** add/accept→tz-normalize→conflict-check→calendar. **4.26.10 Edge.** DST boundary→correct; calendar token expired→re-auth; double-book→warn not block. **4.26.11 NFR.** Calendar load ≤1s; sync ≤5s. **4.26.12 Security.** SR-026.1 calendar OAuth tokens encrypted, least-scope; candidate-private. **4.26.13 Compliance.** —. **4.26.14 Obs.** interviews_scheduled_total; conflict_warn_total. **4.26.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-026.1 | **Multi-round view** | calendar shows rounds by application |
| TC-026.2 | **Time-zone correctness** | times display in local zone (DST-safe) |
| TC-026.3 | **Conflict warning** | overlap warned |
| TC-026.4 | Employer self-schedule link | booked slot appears |
| TC-026.5 | Expired calendar token | re-auth prompt |
**4.26.16 Open Q.** Which calendar providers first?

---

### 4.27 Feature F-027 — Career coach surface
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** v1.1 · **PRD:** §7.1

**4.27.1 Description.** An encouraging, action-oriented coaching surface for anxious/laid-off users (David) — supportive
tone, concrete next steps, **never reinforcing distress** and **never giving clinical/mental-health advice**. Includes
a safety routing path if signs of serious distress are detected.
**4.27.2 Triggers.** Candidate engages the coach surface; or low-morale signals (e.g. many rejections) prompt an offer.
**4.27.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-027.1 | The system shall provide an encouraging, action-oriented coaching tone with concrete next steps. | Must |
| FR-027.2 | The system shall never reinforce or amplify negative self-talk/distress. | Must |
| FR-027.3 | The system shall not provide clinical or mental-health advice. | Must |
| FR-027.4 | The system shall detect signs of serious distress and route to appropriate support resources (not assess or diagnose). | Must |
| FR-027.5 | The system shall stay within career-coaching scope. | Should |
**4.27.4 ACs.** AC-027.1.1 — Given an anxious user, when they engage, then they get supportive, concrete next steps (not platitudes, not clinical advice). AC-027.1.2 — Given a message **indicating serious distress/self-harm**, then the surface responds with care and routes to appropriate support resources, and does not continue coaching as normal. AC-027.1.3 — Given a request for **clinical advice**, then it declines and routes appropriately. AC-027.1.4 — Given negative self-talk, the response **does not reinforce** it.
**4.27.5 Business rules.** BR-027.1 — No clinical/mental-health advice; BR-027.2 — Distress signals trigger safe routing; BR-027.3 — Never reinforce distress. **4.27.6 I/O.** In:{message, context}. Out:{reply, routed:bool, resources?}. **4.27.7 Errors.** 503. **4.27.8 State.** Conversational; distress-flag escalates the path. **4.27.9 Sequence.** message→safety-classify→(coach | route-to-support). **4.27.10 Edge.** Self-harm language→care + resources, halt normal coaching; abusive content→de-escalate; off-topic→redirect. **4.27.11 NFR.** reply ≤8s; **distress-detection recall high (red-team eval).** **4.27.12 Security.** SR-027.1 candidate-private; sensitive messages handled per policy. **4.27.13 Compliance.** Wellbeing safety (FR-027.2-.4); no clinical advice. **4.27.14 Obs.** coach_messages_total; distress_route_total (monitored carefully). **4.27.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-027.1 | **Tone + concrete steps** | supportive, actionable; not clinical |
| TC-027.2 | **Distress signal → safe routing** | care + support resources; halts normal coaching |
| TC-027.3 | **Clinical-advice request** | declines; routes appropriately |
| TC-027.4 | Negative self-talk | not reinforced |
| TC-027.5 | Red-team distress phrases | high-recall detection + safe routing |
**4.27.16 Open Q.** Which support-resource directory per region?

---

### 4.90c Feature F-090c — Candidate notifications & preferences
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.5 · **Wireframe:** W-107

**4.90c.1 Description.** Delivers alerts and digests to the candidate across email/push/in-app via the Platform
notification infrastructure (F-084), honoring per-user channel + frequency preferences and unsubscribe.
**4.90c.2 Triggers.** An alert/event fires (monitoring F-015, status changes, follow-ups); user edits preferences.
**4.90c.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-090c.1 | The system shall deliver notifications via email/push/in-app per the user's channel preference (Platform F-084). | Must |
| FR-090c.2 | The system shall honor frequency settings (instant/daily-digest/off) and one-click unsubscribe. | Must |
| FR-090c.3 | The system shall never send to an unsubscribed channel. | Must |
| FR-090c.4 | The system shall batch into a digest when frequency=daily. | Must |
| FR-090c.5 | The system shall include an unsubscribe link in every email (compliance). | Must |
**4.90c.4 ACs.** AC-090c.1 — Given email-only + daily, then alerts arrive as a daily email digest, not push. AC-090c.2 — Given I **unsubscribe**, then no further sends on that channel. AC-090c.3 — Given frequency=off, then no notifications (in-app only). AC-090c.4 — Given an email, it contains an unsubscribe link.
**4.90c.5 Business rules.** BR-090c.1 — No send to unsubscribed/disabled channels; BR-090c.2 — Email must carry unsubscribe (CAN-SPAM/anti-spam). **4.90c.6 I/O.** In:{event, prefs}. Out:{delivered:bool, channel}. **4.90c.7 Errors.** 410 UNSUBSCRIBED (suppressed). **4.90c.8 State.** Notification: Queued→(Sent|Suppressed|Batched). **4.90c.9 Sequence.** event→pref-check→(send|batch|suppress)→F-084 dispatch. **4.90c.10 Edge.** Bounced email→mark, stop retrying that address; push token invalid→fall back to in-app; over frequency→batch. **4.90c.11 NFR.** Delivery ≤1 min for instant. **4.90c.12 Security.** SR-090c.1 no PII in notification metadata logs. **4.90c.13 Compliance.** Anti-spam (unsubscribe); consent. **4.90c.14 Obs.** notifications_sent_total{channel}; unsubscribe_total; bounce_rate. **4.90c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-090c.1 | **Preference honored** | email-only+daily → digest email; no push |
| TC-090c.2 | **Unsubscribe** | no further sends on that channel |
| TC-090c.3 | Frequency off | in-app only |
| TC-090c.4 | Email unsubscribe link | present |
| TC-090c.5 | Bounced email | stop retrying that address |
**4.90c.16 Open Q.** Digest send-time per user timezone?

---

### 4.91 Feature F-091c — Onboarding / first-run
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.5 · **Wireframe:** W-111

**4.91c.1 Description.** A guided first-run flow: welcome → import résumé/network → pick target companies → first
diagnosis (the activation moment) — resumable, with the owner/first user exempt.
**4.91c.2 Triggers.** New user signs up; resumes a partial onboarding.
**4.91c.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-091c.1 | The system shall guide a new user through welcome → import → pick targets → first diagnosis in one session. | Must |
| FR-091c.2 | The system shall be resumable (a partial user returns to where they left off). | Must |
| FR-091c.3 | The system shall exempt the owner/first user from onboarding (backfilled). | Must |
| FR-091c.4 | The system shall let a user skip optional steps and still reach a first diagnosis. | Should |
| FR-091c.5 | The system shall track onboarding completion + drop-off for analytics (F-082). | Should |
**4.91c.4 ACs.** AC-091c.1 — Given a new user, when onboarding, then they reach a **first diagnosis in one session**. AC-091c.2 — Given I **leave mid-onboarding**, when I return, then I resume at the same step. AC-091c.3 — Given I'm the **owner**, then I'm not forced through onboarding. AC-091c.4 — Given I **skip network import**, then I still reach a first diagnosis.
**4.91c.5 Business rules.** BR-091c.1 — Owner exempt (onboarded_at backfilled); BR-091c.2 — First diagnosis is the activation goal. **4.91c.6 I/O.** In:{step, data}. Out:{next_step, progress}. **4.91c.7 Errors.** per-step validation (reuses F-003/F-001 errors). **4.91c.8 State.** Onboarding: welcome→import→targets→diagnosis→done (resumable cursor). **4.91c.9 Sequence.** signup→stepper→first diagnosis(F-001)→done. **4.91c.10 Edge.** Import fails→skip, continue; abandons→resumable; owner→skip entirely; returns days later→resume. **4.91c.11 NFR.** Reach first diagnosis ≤ one session; each step ≤ fast. **4.91c.12 Security.** SR-091c.1 candidate-private throughout. **4.91c.13 Compliance.** Consent captured at import steps. **4.91c.14 Obs.** onboarding_step_completion{step}; onboarding_dropoff_rate; time_to_first_diagnosis. **4.91c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-091c.1 | **Reach first win** | new user reaches a diagnosis in one session |
| TC-091c.2 | **Resume** | return mid-onboarding → resume same step |
| TC-091c.3 | **Owner exempt** | owner not forced through onboarding |
| TC-091c.4 | Skip optional step | still reaches first diagnosis |
| TC-091c.5 | Import failure mid-flow | skip + continue |
**4.91c.16 Open Q.** Onboarding A/B variants to maximize activation?

---

### 4.93 Feature F-093c — Data portability / delete
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7.5 · **Wireframe:** W-112

**4.93c.1 Description.** Candidate-facing data export (machine-readable) and account+data deletion on request within
SLA — a GDPR/PDPB-class right and a trust feature.
**4.93c.2 Triggers.** Candidate requests an export or account deletion.
**4.93c.3 Functional requirements**
| Req ID | Requirement | Pri |
|---|---|---|
| FR-093c.1 | The system shall export all of a user's data on request in a machine-readable format (JSON + files), within SLA (≤24 h async). | Must |
| FR-093c.2 | The system shall delete the user's account + all personal data on request within SLA (≤30 days hard), with confirmation. | Must |
| FR-093c.3 | The system shall verify identity before export/delete. | Must |
| FR-093c.4 | The system shall, on delete, purge or irreversibly anonymize personal data (outcome data may be anonymized for the loop, never re-identifiable). | Must |
| FR-093c.5 | The system shall send confirmation when export is ready and when deletion completes. | Should |
**4.93c.4 ACs.** AC-093c.1 — Given an export request, when ready, then I receive a machine-readable export of all my data. AC-093c.2 — Given a **delete request**, when confirmed, then my account + personal data are removed/anonymized and I'm notified. AC-093c.3 — Given a delete, then a **verification confirms removal** (no residual personal data). AC-093c.4 — Given a delete, **outcome data is anonymized** (not re-identifiable), not retained with PII.
**4.93c.5 Business rules.** BR-093c.1 — Identity verified before export/delete; BR-093c.2 — Delete = purge or irreversible anonymize; BR-093c.3 — Within SLA. **4.93c.6 I/O.** In:{request:export|delete, identity}. Out:{request_id, status}. **4.93c.7 Errors.** 401 IDENTITY_UNVERIFIED; 409 DELETE_PENDING. **4.93c.8 State.** Request: Submitted→Verified→Processing→Completed. **4.93c.9 Sequence.** request→verify→(export job | delete job)→confirm. **4.93c.10 Edge.** Active subscription→cancel + delete; shared data (e.g. an employer screening result)→anonymize candidate side per trust wall; re-request during processing→`409`; legal-hold edge→flag per policy. **4.93c.11 NFR.** Export ≤24 h; delete ≤30 days; **verified removal**. **4.93c.12 Security.** SR-093c.1 export delivered via authenticated, expiring link; SR-093c.2 deletion cryptographically verifiable. **4.93c.13 Compliance.** GDPR/PDPB-class data subject rights (FR-093c.1-.4). **4.93c.14 Obs.** data_export_total; data_delete_total; delete_sla_breach_total (alert any). **4.93c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-093c.1 | **Export** | machine-readable export of all data, via auth link |
| TC-093c.2 | **Delete (verified removal)** | account+PII removed; verification confirms no residual |
| TC-093c.3 | **Identity check** | export/delete requires verified identity |
| TC-093c.4 | **Outcome anonymization** | outcome data anonymized, not re-identifiable |
| TC-093c.5 | Re-request during processing | `409 DELETE_PENDING` |
| TC-093c.6 | SLA breach | alert fires |
**4.93c.16 Open Q.** Legal-hold exceptions per jurisdiction?

---

### 4.96 Feature F-096c — Job search & filtering
**Owner:** PM · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.1 · **Wireframe:** W-107
**4.96c.1 Description.** Lets candidates search/filter discovered jobs by role, location, legitimacy tier, and fit.
**4.96c.3 FRs.** FR-096c.1 search/filter by role/location/legitimacy/fit, paginated. FR-096c.2 default-hide ghost postings (F-059). FR-096c.3 sort by fit/date/legitimacy.
**4.96c.4 ACs.** AC-096c.1 — Given filters, then only matching, legitimate jobs show. AC-096c.2 — Given ghost postings, then hidden by default.
**4.96c.5 BR.** Ghost postings hidden unless explicitly shown. **4.96c.6 I/O.** In:{query, filters, sort, page}. Out:{results[], total}. **4.96c.7 Errors.** 400 INVALID_FILTER. **4.96c.10 Edge.** No results→empty-state; huge result set→paginate. **4.96c.11 NFR.** ≤1s p95. **4.96c.12 Security.** candidate-scoped. **4.96c.14 Obs.** search_total. **4.96c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-096c.1 | **Filter correctness** | only matching legitimate jobs |
| TC-096c.2 | Ghost hidden | ghost postings hidden by default |
| TC-096c.3 | Invalid filter | `400 INVALID_FILTER` |

---

### 4.98 Feature F-098c — Localization
**Owner:** PM · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.5
**4.98c.1 Description.** Support Arabic + key MENA/APAC languages across core flows (UI + AI generation), region/residency-aware, with RTL support.
**4.98c.3 FRs.** FR-098c.1 localize core UI + generated content into supported languages. FR-098c.2 full RTL layout for Arabic. FR-098c.3 region/data-residency-aware. FR-098c.4 honest "limited support" notice for unsupported languages (never fail).
**4.98c.4 ACs.** AC-098c.1 — Given Arabic, then UI is RTL + translated and generation is in Arabic. AC-098c.2 — Given an unsupported language, then a graceful English fallback + notice. AC-098c.3 — Given a region with residency rules, then data is handled region-aware.
**4.98c.5 BR.** No hard failure on unsupported language. **4.98c.6 I/O.** locale + region context. **4.98c.10 Edge.** Mixed-language input→detect+handle; RTL+LTR mixed content→render correctly. **4.98c.11 NFR.** No layout breakage in RTL. **4.98c.12 Security.** residency-aware storage. **4.98c.13 Compliance.** Data residency per region. **4.98c.14 Obs.** locale_usage{lang}. **4.98c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-098c.1 | **RTL + translated flow** | Arabic UI RTL + translated; generation in Arabic |
| TC-098c.2 | Unsupported language | graceful English fallback + notice |
| TC-098c.3 | Residency region | region-aware data handling |

---

### 4.99 Feature F-099c — Invite / referral loop
**Owner:** PM · **Priority:** P2 · **Release:** v1.1 · **PRD:** §7.1
**4.99c.1 Description.** In-product invite with a referral incentive; tracks referrals + attribution (the cheapest growth channel).
**4.99c.3 FRs.** FR-099c.1 generate a personal invite link; FR-099c.2 track referrals + attribute signups; FR-099c.3 grant the incentive on a qualified referral; FR-099c.4 prevent self-referral/fraud.
**4.99c.4 ACs.** AC-099c.1 — Given I invite someone who signs up, then the referral is attributed to me. AC-099c.2 — Given a **self-referral attempt**, then it's blocked. AC-099c.3 — Given a qualified referral, the incentive is granted once.
**4.99c.5 BR.** No self-referral; incentive once per qualified referral. **4.99c.6 I/O.** In:{invite}. Out:{invite_link, referrals[]}. **4.99c.7 Errors.** 409 SELF_REFERRAL. **4.99c.10 Edge.** Duplicate signup→one attribution; fraud ring→flag to trust&safety. **4.99c.11 NFR.** —. **4.99c.12 Security.** referral fraud controls (links to F-092p). **4.99c.14 Obs.** invites_total; referral_conversion_rate. **4.99c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-099c.1 | **Invite + attribution** | referral attributed correctly |
| TC-099c.2 | **Self-referral** | `409 SELF_REFERRAL` blocked |
| TC-099c.3 | Incentive | granted once per qualified referral |

---

### 4.100 Feature F-100c — Help center
**Owner:** PM · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7.5 · **Wireframe:** W-130
**4.100c.1 Description.** A searchable knowledge base + contextual in-product help drawer, backed by the Platform help-center system (F-085).
**4.100c.3 FRs.** FR-100c.1 searchable KB; FR-100c.2 contextual help relevant to the current screen; FR-100c.3 escalate to support (F-083) when no answer.
**4.100c.4 ACs.** AC-100c.1 — Given a query, then relevant KB articles surface. AC-100c.2 — Given the current screen, then contextual help is offered. AC-100c.3 — Given no answer, then an escalate-to-support path.
**4.100c.6 I/O.** In:{query|screen}. Out:{articles[], escalate?}. **4.100c.10 Edge.** No results→escalation; outdated article→flag. **4.100c.11 NFR.** Search ≤500ms. **4.100c.14 Obs.** help_search_total; help_escalation_rate. **4.100c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-100c.1 | **Search relevance** | relevant articles surface |
| TC-100c.2 | Contextual help | screen-relevant help offered |
| TC-100c.3 | No answer | escalate-to-support path |

---

### 4.101 Feature F-101c — Employer↔candidate messaging (candidate side)
**Owner:** PM · **Priority:** P1 · **Release:** vNext · **PRD:** §7.5
**4.101c.1 Description.** In-platform messaging between candidate and employer (via Platform F-084), trust-wall-safe — no candidate-private diagnostics/outcomes are exposed in the thread.
**4.101c.3 FRs.** FR-101c.1 send/receive messages with an employer in an application context; FR-101c.2 **never expose candidate-private diagnostics** in messaging; FR-101c.3 abuse/spam controls; FR-101c.4 notifications via F-090c.
**4.101c.4 ACs.** AC-101c.1 — Given an active application, when I message the employer, then it's delivered. AC-101c.2 — Given the thread, then my **private diagnosis/outcomes are never visible** to the employer (trust wall). AC-101c.3 — Given **abusive content**, then it's blocked/flagged.
**4.101c.5 BR.** Trust wall enforced in messaging; abuse controls. **4.101c.6 I/O.** In:{application_id, message}. Out:{delivered}. **4.101c.7 Errors.** 403 MESSAGING_NOT_ALLOWED (no active relationship). **4.101c.10 Edge.** Employer not connected→no messaging; PII over-share→warn; harassment→block + trust&safety. **4.101c.11 NFR.** Delivery ≤2s. **4.101c.12 Security.** SR-101c.1 trust wall in messaging; abuse filtering. **4.101c.13 Compliance.** Anti-harassment; consent. **4.101c.14 Obs.** messages_total; trust_wall_block_total. **4.101c.15 Tests.**
| TC | Scenario | Expected |
|---|---|---|
| TC-101c.1 | **Message round-trip** | message delivered in app context |
| TC-101c.2 | **Trust-wall check** | private diagnosis/outcomes never visible to employer |
| TC-101c.3 | **Abuse** | abusive content blocked/flagged |

---

## 5. Cross-cutting non-functional requirements
| Area | Requirement | Measurement |
|---|---|---|
| Performance | Diagnosis ≤8s p95; tailoring ≤60s p95; chat-edit ≤5s | Synthetic probes |
| AI quality | Groundedness ≥95%→98%; fabrication <1%→~0; eval-gated | Eval harness (engine) |
| Reliability | No lost work on restart; long ops via queue+poll | Chaos tests |
| Availability | Diagnose/monitor paths 99.9% | Uptime monitor |
| Accessibility | WCAG 2.1 AA on core candidate flows; mobile-first | Audit |
| Localization | RTL + translated core flows where supported | QA |
| Security | Per-tenant isolation; trust wall; PII encrypted; no biometric storage | Pen test |
| Privacy | Export/delete within SLA; consent for network/recording | Compliance audit |

---

## 6. Integrations
| System | Direction | Protocol | Auth | Note |
|---|---|---|---|---|
| Shared Engine | internal | service | mTLS | Score/generate/research/loop |
| Platform (auth/billing/notify) | internal | service | mTLS | Auth, payments, usage, delivery |
| Calendar (Google/MS) | outbound | API/OAuth | OAuth | F-026 scheduling |
| LinkedIn scheduling (Buffer-class) | outbound | API | OAuth | F-012 posting |
| Comp-data partner | outbound | API | key | F-016 salary bands |

---

## 7. Data model (feature-level view — candidate)
| Entity | Purpose | Key fields | Source of truth |
|---|---|---|---|
| CandidateProfile | Master profile | profile_id, user_id, experience, skills, keywords, stories | Trajct |
| ResumeVersion | A build | version_id, profile_id, job_id, content, cites[], voice_id | Trajct |
| Diagnosis | A diagnosis result | diag_id, user_id, score, reasons[], cites[], ttl | Trajct (transient→saved) |
| TargetCriteria | Monitoring targets | user_id, companies[], roles[], filters | Trajct |
| Outcome | Logged result | outcome_id, user_id, app_id, type, feedback, cites[] | Trajct (→engine) |
| WorkSample | Portfolio item | sample_id, user_id, type, url, visibility | Trajct |

**Retention:** profile/résumés retained until user delete; diagnosis transient (24h) until saved; outcomes retained for the learning loop (anonymizable on delete).

---

## 8. Rollout & migration
**8.1 Release strategy.** Feature-flagged; % rollout; v1.0 = F-001..005, F-007, F-015, F-090c, F-091c, F-093c.
**8.2 Backward compatibility.** The existing single owner (jobHunt) keeps full access; not forced through onboarding.
**8.3 Data migration.** Existing jobHunt profile/persona data maps to CandidateProfile/engine corpus.
**8.4 Rollback.** Fabrication spike → diagnosis flag off; trust-wall breach → rollback; per-feature flags isolate blast radius.

---

## 9. Launch readiness (gate checklist)
| Gate item | Owner | Status |
|---|---|---|
| All P0 features pass UAT | QA Lead | Pending |
| Trust wall verified (candidate data isolated) | CISO delegate | Pending |
| Fabrication/groundedness within target | PM/Eng | Pending |
| Billing + usage cap verified on the fix path | Finance/Eng | Pending |
| Data export/delete working | Compliance | Pending |
| Onboarding reaches first diagnosis | PM | Pending |

---

## 10. Open items / risks / questions
| # | Type | Description | Owner | Status |
|---|---|---|---|---|
| 1 | Q | Diagnostic-led vs résumé-led framing | PM | Open |
| 2 | R | Alert relevance below bar → notification fatigue | PM | Mitigating |
| 3 | Q | Voice-calibration cold start (no samples) | PM | Open |

---

## 11. Traceability matrix (master — candidate)
| F-ID | FR IDs | ACs | BRs | Tests | PRD | Wireframe | Priority |
|---|---|---|---|---|---|---|---|
| F-001 | FR-001.1–.7 | AC-001.1.1–.3 | BR-001.1–.3 | TC-001.1–.5 | §8.1 | W-101 | P0 |
| F-002 | FR-002.1–.5 | AC-002.1.1–.3 | BR-002.1–.2 | TC-002.1–.3 | §8 | W-103/104 | P0 |
| F-003 | FR-003.1–.4 | — | — | TC-003.1–.2 | — | W-111 | P0 |
| F-004 | FR-004.1–.5 | — | — | TC-004.1–.3 | — | W-104 | P0 |
| F-005 | FR-005.1–.4 | — | — | TC-005.1–.3 | — | W-102 | P0 |
| F-007 | FR-007.1–.4 | — | — | TC-007.1–.2 | — | W-105 | P0 |
| F-015 | FR-015.1–.5 | — | — | TC-015.1–.3 | — | W-107 | P0 |
| F-091c | FR-091c.1–.2 | — | — | TC-091c.1–.2 | — | W-111 | P0 |
| F-093c | FR-093c.1–.2 | — | GDPR | TC-093c.1–.2 | — | W-112 | P0 |
| … | (remaining F-IDs trace identically; full matrix maintained in the live FRD) | | | | | | |

---
*FRD-2026-001-C v0.1.0 — Candidate. Paired with Candidate PRD; references Wireframe Library + Shared Engine (00).*
