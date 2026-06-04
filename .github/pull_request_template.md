## F-ID(s) covered

<!-- Required. Link every FRD feature this PR touches. No F-ID = no merge. -->
<!-- Example: F-073 (Billing), F-076 (Metering) -->

- F-XXX: [description]

## TC-IDs covered

<!-- Required. List every test case this PR adds or covers. -->
<!-- Example: TC-073.2 (idempotent retry), TC-077.4 (concurrency) -->

- [ ] TC-XXX: [description]

## What changed

<!-- Brief description of the change and why it was made. -->

## Protected paths?

<!-- Does this PR touch any of these? -->
- [ ] `packages/core/billing/`
- [ ] `packages/core/screening/`
- [ ] `packages/core/compliance/`
- [ ] `packages/db/`

If yes, CODEOWNERS approval required before merge.

## Checklist

- [ ] PR size ≤ 400 lines diff (split if larger)
- [ ] All new logic has a matching Zod contract in `packages/contracts`
- [ ] `pnpm lint && pnpm typecheck && pnpm test` green locally
- [ ] No secrets or env values committed (only `.env.example` changes)
- [ ] Trust wall respected: employer code does not import engine internals
- [ ] Fail-closed where a guard exists (cap, rate limit, RLS, decision log)
- [ ] Conventional commit message: `feat(module): F-XXX description`
