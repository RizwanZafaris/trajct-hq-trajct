# Hermes — 500-Agent Engineering Org for Building Trajct

> **Hermes** is an agent-orchestration harness that runs a tiered AI "company" of up to **500 worker slots**
> to build the Trajct platform from its FRDs. C-level agents run on frontier models, mid-level managers/reviewers
> on paid Chinese models, junior ICs on a rotating free-model pool with paid spill — all under a hard-capped
> **Governor** (the same halting-spend-cap philosophy as Trajct's own F-077: *fail closed, never silently overspend*).
>
> This guide covers: the org design, the full `hermes.yaml` model-routing config, and a complete
> **Linux server installation** (Ubuntu 22.04/24.04, systemd).

---

## 0. Read this first — what "500 agents" really means

500 agents ≠ 500 always-on processes. Hermes defines **500 concurrent worker slots** distributed across a
hierarchy. A slot wakes when a task is assigned, runs one task to completion (code → self-test → PR), reports,
and sleeps. At any moment, the Governor decides how many slots may be active per tier based on **budget headroom
and provider rate limits** — exactly like a real company managing payroll.

Why this matters: 500 simultaneous free-tier calls would 429 instantly, and 500 frontier calls would burn
hundreds of dollars per hour. The hierarchy + Governor turns "500 agents" from a cost bomb into a throughput dial.

**The work source is the FRDs.** Every task Hermes dispatches is an F-ID (feature) or TC-ID (test case) from
`Trajct-FRD-Candidate.md`, `Trajct-FRD-Employer.md`, `Trajct-FRD-Platform.md`. The FRDs are the backlog;
the TC-xxx tables are the acceptance contract. No task without an F-ID.

---

## 1. Org chart — 500 slots, 4 tiers

```
                         ┌─────────────────────────┐
                         │   C-SUITE (6 slots)     │  frontier models
                         │ CTO · Chief Architect · │  plan, arbitrate, gate
                         │ QA Dir · CISO · Release │  protected paths
                         │ Mgr · Product Owner     │
                         └───────────┬─────────────┘
                       ┌─────────────┼──────────────┐
                ┌──────┴─────┐ ┌─────┴──────┐ ┌─────┴──────┐
                │ DIRECTORS  │ │ (14 slots) │ │  per-domain │   mid-tier paid
                │ Candidate · Employer · Platform · AI/RAG · │   (Chinese frontier)
                │ Infra · Security · QA — 2 each              │
                └──────┬─────────────────────────────────────┘
                ┌──────┴──────────────────────────────────────┐
                │ TEAM LEADS / REVIEWERS (80 slots)            │  mid-tier paid
                │ 1 lead per module/feature-cluster:           │  review every junior PR,
                │ billing, cap, engine, screening, upload,     │  decompose F-IDs into tasks
                │ auth/RBAC, RAG, gateway, web-candidate,      │
                │ web-employer, workers, db, tests, docs …     │
                └──────┬──────────────────────────────────────┘
                ┌──────┴──────────────────────────────────────┐
                │ JUNIOR ICs (400 slots)                       │  FREE pool, rotate_then_spill
                │ coders 240 · testers 100 · writers/docs 40 · │
                │ long-context analysts 20                     │
                └──────────────────────────────────────────────┘
```

| Tier | Slots | Model class (ALL-FREE MODE) | What they do | What they may NOT do |
|---|---|---|---|---|
| **C-suite** | 6 | Free reasoning pool (DeepSeek-R1:free, Qwen3-235B:free, GLM-4.5-Air:free) — **2-of-3 consensus**; splits go to the human | Sprint planning from FRDs, architecture rulings (ADRs), conflict arbitration, **pre-screen for the human gate** on protected paths, release prep | Be the FINAL gate on `core/billing`, `core/screening`, `core/compliance`, `db/` — in all-free mode that gate is the human, every time |
| **Directors** | 14 | Free reasoning pool (R1:free-led rotation) | Own one domain; break epics into F-ID task batches; cross-team integration reviews | Merge protected paths |
| **Leads/Reviewers** | 80 | Free coder/reasoner pool — **2-of-2 consensus review**, CI-green first, diff-only context | Review every junior PR by vote against the FRD spec; own one module's quality | Self-merge own code; review with failing CI; whole-repo judgments (→ human) |
| **Junior ICs** | 400 | **Free pool**, `rotate_then_spill` (spill optional, default off) | One atomic task each: implement a function/endpoint/component, write a TC-xxx test, write a doc section | Touch protected paths; merge anything; exceed 4k output tokens |

**Why Chinese paid models at mid-tier:** DeepSeek/Qwen/GLM/Kimi sit at near-frontier coding quality at 5–20×
lower cost than US frontier — the right price point for the highest-volume *judgment* work (PR review,
decomposition). Frontier is reserved for the 6 slots whose mistakes are expensive (architecture, protected-path
merges). Free models do the highest-volume *typing* work, where a bad output costs one review cycle, not a refund.

---

## 2. The Hermes loop (per task)

```
1. INTAKE      Director pulls next F-ID from the FRD backlog (priority: MVP table §9 of the
               Technical Methodology) → Lead decomposes into tasks (≤400-line diff each).
2. DISPATCH    Scheduler assigns task → free junior slot (matched by role: coder/tester/writer).
               Task prompt = FRD feature spec section + repo context + the TC-xxx rows it must pass.
3. WORK        Junior implements in a git worktree, runs lint+typecheck+unit locally, opens PR
               (branch: feat/F-xxx-task-slug, conventional commit).
4. REVIEW      Lead reviews against checklist: spec match (FR-IDs), tests present (TC-IDs),
               no protected-path edits, no secrets, trust-wall types respected.
               → request-changes loops back to the SAME junior (max 3 cycles, then reassign).
5. GATE        CI green (lint, types, unit, contract, TC-xxx e2e, eval smoke, gitleaks).
               Protected path touched? → C-suite gate (CISO or Architect persona reviews).
6. MERGE       Lead merges → main → staging auto-deploy → Release Manager batches tags.
7. LEDGER      Governor logs tokens+cost per task per tier; QA Director samples 5% of merged
               PRs for post-merge audit; failures feed back as new tasks.
```

**Escalation rules (hard-coded):**
- Junior stuck (3 failed attempts or 429-storm) → task escalates to its Lead's model tier.
- Lead disagreement / cross-module conflict → Director → CTO ruling (becomes an ADR).
- Any task touching `core/billing | core/screening | core/compliance | db/migrations` → C-suite gate, no exceptions.
- Any agent output containing credentials/PII patterns → blocked by the output filter, incident to CISO persona.

---

## 3. Model routing — `hermes.yaml`

Single config file; all calls go through **OpenRouter** (one API key, every provider) with optional direct
Anthropic/OpenAI keys for the C-suite. Your `junior_ic` block is included verbatim.

```yaml
# /opt/hermes/config/hermes.yaml
version: 1
provider:
  primary: openrouter            # https://openrouter.ai/api/v1
  direct:                        # optional direct keys for frontier (lower latency, higher RPM)
    anthropic: env:ANTHROPIC_API_KEY
    openai: env:OPENAI_API_KEY

org:
  total_slots: 500

# ============================================================================
# ALL-FREE MODE — every tier runs on free models. $0 LLM spend by design.
# Quality control shifts from paid model judgment to: (a) deterministic CI
# gates (lint/types/TC-xxx tests are the REAL reviewer), (b) consensus voting
# (N free reviewers must agree), (c) a larger human sample. Throughput is
# RPM-bound, not budget-bound. Optional spill wallets exist but default $0.
# ============================================================================
tiers:
  c_suite:
    slots: 6
    roles: [cto, chief_architect, qa_director, ciso, release_manager, product_owner]
    strategy: consensus            # rulings/gates require 2-of-3 agreement
    consensus: { voters: 3, agree: 2, on_split: escalate_human }
    free_pool:                     # strongest free reasoning models
      - deepseek/deepseek-r1:free
      - qwen/qwen3-235b-a22b:free
      - z-ai/glm-4.5-air:free
    spill_paid: null               # all-free: splits go to the HUMAN, not a paid model
    params: { max_tokens: 12000, temperature: 0.2 }
    wallet_usd_daily: 0.00

  director:
    slots: 14
    strategy: rotate_then_spill
    free_pool:
      - deepseek/deepseek-r1:free            # decomposition needs reasoning
      - qwen/qwen3-235b-a22b:free
      - deepseek/deepseek-r1-distill:free
      - z-ai/glm-4.5-air:free
    spill_paid: null
    params: { max_tokens: 10000, temperature: 0.2 }
    wallet_usd_daily: 0.00

  lead_reviewer:
    slots: 80
    strategy: consensus            # PR review by vote — compensates for weaker single-model judgment
    consensus: { voters: 2, agree: 2, on_split: third_voter_then_human }
    free_pool:
      - qwen/qwen3-coder:free                # code review by coder models
      - deepseek/deepseek-r1-distill:free
      - qwen/qwen3-235b-a22b:free
      - z-ai/glm-4.5-air:free
      - openai/gpt-oss-120b:free
    spill_paid: null
    params: { max_tokens: 8000, temperature: 0.1 }
    wallet_usd_daily: 0.00
    review_policy:
      ci_first: true               # model review runs ONLY after CI is fully green —
                                   # never burn RPM reviewing code that fails tests
      diff_only_context: true      # free context windows are smaller: review diff + spec,
                                   # not whole-repo (whole-repo questions escalate to human)

  junior_ic:
    slots: 400
    strategy: rotate_then_spill
    free_pool:                       # round-robin; on 429 → next in pool
      - qwen/qwen3-coder:free        # coders
      - openai/gpt-oss-120b:free     # coders
      - deepseek/deepseek-r1-distill:free   # testers
      - meta-llama/llama-3.3-70b-instruct:free  # writers/docs
      - google/gemini-2.0-flash-exp:free        # long-context
      - z-ai/glm-4.5-air:free
      - qwen/qwen3-235b-a22b:free
    spill_paid: deepseek/deepseek-v4-flash      # when whole pool is throttled
    spill_wallet_usd: 5.00           # Governor-capped
    params: { max_tokens: 4000 }

  escalation_fixer:                  # THE one paid slot in all-free mode — the 3-strike rescue tier
    slots: 1
    strategy: fixed_with_fallback
    model: deepseek/deepseek-v3.2              # primary: best $/quality on hard coding rework
    fallback:
      - moonshotai/kimi-k2                     # long-context agentic loops when DeepSeek can't crack it
    params: { max_tokens: 12000, temperature: 0.1 }
    wallet_usd_daily: 5.00           # ~$100–150/mo ceiling; absorbs ~70% of would-be human escalations
    intake: three_strike_failures    # ONLY consumes tasks that defeated the free tiers 3×
    on_fail: human_queue             # if even this slot fails twice → your desk, with full attempt history
    role_affinity:                   # route by role to the model that's best at it
      coder:   [qwen/qwen3-coder:free, openai/gpt-oss-120b:free]
      tester:  [deepseek/deepseek-r1-distill:free]
      writer:  [meta-llama/llama-3.3-70b-instruct:free]
      analyst: [google/gemini-2.0-flash-exp:free]   # long-context FRD reading

governor:                            # in all-free mode the Governor caps RPM + spill, not dollars
  global_wallet_usd_daily: 10.00     # safety net for junior spill ONLY (deepseek-v4-flash); set 0 for pure-free
  reserve_before_call: true
  alerts: [0.8, 0.95, 1.0]
  on_cap_hit: halt_tier
  reconcile_cron: "0 * * * *"
  rpm_budget_is_primary: true        # the scarce resource is now requests-per-minute, not USD

scheduler:
  max_concurrent_active: 25          # all tiers share free RPM pools — concurrency drops 60→25
  per_model_rpm:
    ":free": 15                      # per free model; rotation spreads load across the pool
  rpm_reservations:                  # protect judgment work from being starved by juniors
    lead_reviewer: 0.35              # 35% of total free RPM reserved for reviews
    c_suite: 0.10
    director: 0.10
    junior_ic: 0.45
  retry: { max: 3, backoff: exponential, jitter: true }
  task_timeout_min: 35               # free models are slower; don't kill healthy runs
  stuck_escalation: escalation_fixer # 3 fails → the paid DeepSeek/Kimi slot; only ITS failures reach you

repo:
  url: git@github.com:YOURORG/trajct.git
  protected_paths: [packages/core/billing, packages/core/screening, packages/core/compliance, packages/db]
  backlog: docs/frd/                 # the three FRD markdown files
  pr_rules: { require_fid: true, max_diff_lines: 400, require_tc_tests: true }

observability:
  ledger_db: postgres://hermes:***@localhost:5432/hermes
  dashboard_port: 8088
  log_dir: /var/log/hermes
  redact_patterns: [api_key, password, BEGIN PRIVATE KEY, sk-]
```

**Routing semantics:**
- `rotate_then_spill`: round-robin the free pool per role affinity; on `429` mark that model cooled-down (60s)
  and try the next; if the **entire pool** is cooling, spend from `spill_wallet_usd` on `spill_paid`; if the
  spill wallet is empty → **task queues, does not fail, does not overspend** (fail closed).
- `weighted_pool`: spreads lead-review load across paid providers so no single RPM limit bottlenecks reviews.
- `fixed_with_fallback`: C-suite/directors get deterministic models (consistent judgment) with explicit fallback.
- Every call writes a ledger row: `{task_id, fid, tier, role, model, tokens_in/out, usd, latency, outcome}`.

---

## 4. Install on a Linux server (Ubuntu 22.04 / 24.04)

Sizing: the orchestrator is I/O-bound (it calls APIs); **4 vCPU / 8 GB RAM / 80 GB SSD** runs 500 slots
comfortably. Redis queues the tasks; Postgres holds the ledger; git worktrees hold parallel work.

### 4.1 Base system

```bash
# as root or sudo
apt update && apt upgrade -y
apt install -y git curl build-essential redis-server postgresql postgresql-contrib \
               python3.12 python3.12-venv python3-pip ufw fail2ban unzip jq

# Node 22 (orchestrator runtime) + pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
npm i -g pnpm

# dedicated non-root user
useradd -m -s /bin/bash hermes
mkdir -p /opt/hermes /var/log/hermes
chown -R hermes:hermes /opt/hermes /var/log/hermes

# firewall: SSH + dashboard only
ufw allow OpenSSH && ufw allow 8088/tcp && ufw enable
```

### 4.2 Databases

```bash
# Redis: enable AOF (Governor counters must survive restarts — fail-closed accounting)
sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf
systemctl enable --now redis-server

# Postgres ledger
sudo -u postgres psql <<'SQL'
CREATE USER hermes WITH PASSWORD 'CHANGE_ME_STRONG';
CREATE DATABASE hermes OWNER hermes;
SQL
```

### 4.3 Hermes itself

```bash
sudo -iu hermes
cd /opt/hermes
git clone git@github.com:YOURORG/hermes.git app     # your orchestrator repo
cd app && pnpm install && pnpm build

# the codebase Hermes will build
git clone git@github.com:YOURORG/trajct.git /opt/hermes/workspace/trajct
# juniors work in throwaway worktrees:
#   git -C /opt/hermes/workspace/trajct worktree add ../wt/F-001-task17 -b feat/F-001-task17
```

### 4.4 Secrets (never in the YAML)

```bash
install -m 600 /dev/null /opt/hermes/config/hermes.env
cat > /opt/hermes/config/hermes.env <<'ENV'
OPENROUTER_API_KEY=sk-or-...
ANTHROPIC_API_KEY=sk-ant-...          # optional, C-suite direct
OPENAI_API_KEY=sk-...                 # optional
HERMES_DB_URL=postgres://hermes:CHANGE_ME_STRONG@localhost:5432/hermes
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=ghp_...                  # PR creation; least-privilege fine-grained token
GOVERNOR_GLOBAL_WALLET_USD=200
ENV
chown hermes:hermes /opt/hermes/config/hermes.env
```

### 4.5 systemd units

```ini
# /etc/systemd/system/hermes-orchestrator.service
[Unit]
Description=Hermes Orchestrator (scheduler + governor + dashboard)
After=network-online.target redis-server.service postgresql.service
Wants=network-online.target

[Service]
User=hermes
WorkingDirectory=/opt/hermes/app
EnvironmentFile=/opt/hermes/config/hermes.env
ExecStart=/usr/bin/node dist/orchestrator.js --config /opt/hermes/config/hermes.yaml
Restart=always
RestartSec=5
MemoryMax=4G
StandardOutput=append:/var/log/hermes/orchestrator.log
StandardError=append:/var/log/hermes/orchestrator.err

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/hermes-workers@.service   (templated: one unit = one worker pool shard)
[Unit]
Description=Hermes Worker Pool shard %i
After=hermes-orchestrator.service

[Service]
User=hermes
WorkingDirectory=/opt/hermes/app
EnvironmentFile=/opt/hermes/config/hermes.env
ExecStart=/usr/bin/node dist/worker.js --shard %i --config /opt/hermes/config/hermes.yaml
Restart=always
RestartSec=5
MemoryMax=2G

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now hermes-orchestrator
# 4 worker shards × 15 active slots = 60 max concurrent (matches scheduler.max_concurrent_active)
for i in 1 2 3 4; do systemctl enable --now hermes-workers@$i; done
```

### 4.6 Seed the backlog and start

```bash
sudo -iu hermes
cd /opt/hermes/app
# parse the FRDs into the task backlog (F-IDs + TC-IDs, MVP priority first)
node dist/cli.js backlog import \
  --frd /opt/hermes/workspace/trajct/docs/frd/Trajct-FRD-Candidate.md \
  --frd /opt/hermes/workspace/trajct/docs/frd/Trajct-FRD-Employer.md \
  --frd /opt/hermes/workspace/trajct/docs/frd/Trajct-FRD-Platform.md \
  --priority-plan docs/frd/Trajct-Technical-Methodology.md   # §9 MVP table = sprint 1

node dist/cli.js org status      # tiers, slots, wallets
node dist/cli.js sprint start --epic "MVP platform spine: F-070,F-071,F-073,F-076,F-077"
# dashboard: http://SERVER_IP:8088  (tasks, PRs, per-tier spend, 429 heatmap, ledger)
```

### 4.7 Verify (smoke checklist)

```bash
node dist/cli.js call --tier junior_ic --role coder --prompt "return OK"     # free pool works
node dist/cli.js call --tier c_suite  --role cto    --prompt "return OK"     # frontier works
node dist/cli.js governor status                                             # wallets + reserve test
redis-cli get governor:global:reserved                                       # atomic counter live
node dist/cli.js test 429-rotation    # forces a 429 → confirms pool rotation + cooldown
node dist/cli.js test cap-halt        # sets wallet to $0 → confirms tasks QUEUE, calls halt
journalctl -u hermes-orchestrator -f  # tail
```

---

## 5. Daily operating rhythm

| When | What | Who (persona) |
|---|---|---|
| 00:00 | Wallets reset; nightly: full TC-xxx e2e on staging, eval suite, cost report | Release Mgr + QA Dir |
| Hourly | Ledger ↔ OpenRouter usage reconcile; drift > 5% → alert | Governor |
| Continuous | Backlog → dispatch → review → merge loop | All tiers |
| On 80/95% wallet | Alert; Governor throttles junior concurrency first | Governor |
| On 100% | **Halt tier, queue tasks, never spill past caps** | Governor (fail closed) |
| Weekly | 5% post-merge audit sample; ADR review; reassign chronically-failing model→role pairs | QA Dir + CTO |
| Human (you) | Review C-suite gate queue (protected paths), tag releases, adjust wallets | The actual human |

**The one rule that keeps this safe:** Hermes merges to `main` → staging only. **Production tags are issued by
a human.** A 500-agent org with prod deploy rights is not an engineering team, it's an incident generator.

---

## 6. All-free economics (what replaces the budget)

**LLM spend: ≈ $0** (optional $10/day junior-spill safety net; set to 0 for pure-free). The scarce resource is
no longer money — it's **requests-per-minute and judgment quality**. That changes three numbers:

| Dimension | Paid-tier design | **All-free design** |
|---|---|---|
| LLM cost (full build) | $30–45k | **$0–300** (spill only) |
| Max concurrent active slots | 60 | **~25** (shared free RPM pools) |
| Net merged tasks/day | 250–400 | **~80–150** (consensus review costs 2–3× RPM; rework rate rises ~50%→~65%) |
| Calendar — MVP | 10–13 wks | **~16–22 wks** |
| Calendar — full V2 | 7–9 months | **~12–15 months** |
| Your daily review load | 5–10 protected-path approvals | **~20–40 items** (protected paths + consensus splits + 3-strike escalations — there is no paid tier above the free one, so the escalation target is YOU) |

How quality survives without paid judgment — the three compensators (already in the config above):
1. **CI is the real reviewer.** Model review runs only after lint+types+TC-xxx are green (`ci_first`). The FRD
   test suite carries the quality load free models can't — which means **QA tester throughput is now the
   critical path**: TC tests must land *before or with* features, never after.
2. **Consensus voting.** Leads review 2-of-2 (split → third voter → human); C-suite rulings 2-of-3. Independent
   weak judges agreeing beats one weak judge — at the price of RPM, which is why concurrency drops.
3. **Bigger human sample.** Post-merge audit rises from 5% → 15%, and protected paths
   (`billing/screening/compliance/db`) are now **human-reviewed line-by-line, every time** — no free model is
   fit to be the last gate on financial or compliance code.

**The honest trade in one line:** you exchanged ~$30–45k of model spend for ~3–6 extra calendar months and
roughly 2–4× your personal review hours. If runway is the constraint, that's a rational trade.

**Adopted: the `escalation_fixer` slot** (configured above) — ONE paid slot, **DeepSeek-V3.2 primary,
Kimi K2 fallback**, $5/day wallet (~$100–150/mo), consuming only 3-strike failures. It removes ~70% of the
human-load increase (your queue drops back to ~8–15 items/day: protected paths + consensus splits + the rare
task that defeats DeepSeek *and* Kimi twice). Total LLM budget in this mode: **≈ $100–200/month all-in.**

---

*Hermes builds Trajct the way Trajct treats its own AI spend: metered, capped, fail-closed, and every decision logged.*
