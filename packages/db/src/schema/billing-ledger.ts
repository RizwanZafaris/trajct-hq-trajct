import { pgTable, uuid, varchar, numeric, text, jsonb, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", ["debit", "credit"]);
export const ledgerCurrencyEnum = pgEnum("ledger_currency", ["USD", "AED", "SAR", "SGD", "GBP", "EUR"]);

/**
 * F-073 — Billing ledger (double-entry).
 * Each charge produces one debit row (charge) and one credit row (revenue) — never net-out.
 * UNIQUE(order_id, idempotency_key) prevents double-charge under concurrent retries (TC-073.7).
 */
export const billingLedger = pgTable(
  "billing_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    orgId: uuid("org_id"),
    orderId: varchar("order_id", { length: 255 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    amountCents: numeric("amount_cents", { precision: 12, scale: 0 }).notNull(),
    currency: ledgerCurrencyEnum("currency").notNull().default("USD"),
    pspChargeId: varchar("psp_charge_id", { length: 255 }),
    pspStatus: varchar("psp_status", { length: 50 }),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueOrderIdempotency: unique("billing_ledger_order_idempotency_unique").on(
      table.orderId,
      table.idempotencyKey
    ),
  })
);

export type BillingLedgerEntry = typeof billingLedger.$inferSelect;
export type NewBillingLedgerEntry = typeof billingLedger.$inferInsert;
