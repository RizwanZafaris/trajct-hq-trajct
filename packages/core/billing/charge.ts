/**
 * F-073 — Billing & payments via Stripe.
 *
 * Idempotency: check billing_ledger BEFORE calling PSP; UNIQUE(order_id, idempotency_key)
 * prevents double-charge at DB level (TC-073.7).
 * Card data never touches Trajct servers — tokenized at PSP (FR-073.1, SR-073.1).
 * No charge for failed/halted work (FR-073.4) — caller must not invoke this on failure.
 * Webhook reconciliation handled separately (F-073.5).
 */

import Stripe from "stripe";
import postgres from "postgres";

export interface ChargeRequest {
  accountId: string;
  orgId?: string;
  order: { sku: string; amount: number; currency: string };
  idempotencyKey: string;
  paymentToken: string;   // PSP token (no PAN — FR-073.1)
}

export interface ChargeResult {
  chargeId: string;
  status: "succeeded" | "requires_action" | "failed";
  ledgerEntryId: string;
}

let _stripe: Stripe | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("STRIPE_SECRET_KEY required");
    _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}

function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 3 });
  }
  return _sql;
}

export async function initiateCharge(req: ChargeRequest): Promise<ChargeResult> {
  const sql = getSql();
  const stripe = getStripe();

  // Idempotency check — return original if already processed (FR-073.2, TC-073.2)
  const existing = await sql`
    SELECT id, psp_charge_id, psp_status FROM billing_ledger
    WHERE order_id = ${req.order.sku} AND idempotency_key = ${req.idempotencyKey}
    LIMIT 1
  `;
  if (existing.length > 0) {
    return {
      chargeId: existing[0]!.psp_charge_id as string,
      status: (existing[0]!.psp_status as string) === "succeeded" ? "succeeded" : "failed",
      ledgerEntryId: existing[0]!.id as string,
    };
  }

  // Create Stripe PaymentIntent (idempotency_key prevents duplicate charge at Stripe)
  const intent = await stripe.paymentIntents.create(
    {
      amount: req.order.amount,
      currency: req.order.currency.toLowerCase(),
      payment_method: req.paymentToken,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { accountId: req.accountId, sku: req.order.sku },
    },
    { idempotencyKey: req.idempotencyKey }
  );

  const succeeded = intent.status === "succeeded";

  // Write double-entry ledger (debit for the charge, credit for the revenue)
  const [debitRow] = await sql`
    INSERT INTO billing_ledger
      (account_id, org_id, order_id, idempotency_key, entry_type, amount_cents, currency, psp_charge_id, psp_status, description)
    VALUES
      (${req.accountId}, ${req.orgId ?? null}, ${req.order.sku}, ${req.idempotencyKey},
       'debit', ${req.order.amount}, ${req.order.currency.toUpperCase()},
       ${intent.id}, ${intent.status}, ${"Charge for " + req.order.sku})
    RETURNING id
  `;

  if (succeeded) {
    await sql`
      INSERT INTO billing_ledger
        (account_id, org_id, order_id, idempotency_key, entry_type, amount_cents, currency, psp_charge_id, psp_status)
      VALUES
        (${req.accountId}, ${req.orgId ?? null}, ${req.order.sku}, ${req.idempotencyKey + ":credit"},
         'credit', ${req.order.amount}, ${req.order.currency.toUpperCase()},
         ${intent.id}, 'succeeded')
    `;
  }

  return {
    chargeId: intent.id,
    status: succeeded ? "succeeded" : intent.status === "requires_action" ? "requires_action" : "failed",
    ledgerEntryId: debitRow!.id as string,
  };
}

/** Verify a Stripe webhook signature (FR-073.5, SR-073.3). */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET required");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
