import { uuid, varchar, text, jsonb, timestamp, pgSchema, pgEnum, index } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";

/**
 * Separate `vectors` schema for pgvector embeddings (Technical-Methodology §6.1).
 * Rows carry owner_scope + region for trust-wall and residency filtering INSIDE the SQL query.
 * Never filter post-hoc — the WHERE clause is the trust wall.
 *
 * HNSW index for approximate nearest-neighbor search.
 * Embedding dimension: 1536 (OpenAI text-embedding-3-small / ada-002 compatible).
 * Override per model version via embedding_model_version column.
 */

export const vectorsSchema = pgSchema("vectors");

export const ownerScopeEnum = pgEnum("owner_scope", ["user", "org", "global"]);
export const embeddingDocTypeEnum = pgEnum("embedding_doc_type", [
  "resume", "jd", "persona", "user-doc", "help", "outcome"
]);

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(",")
      .map(Number);
  },
});

export const embeddings = vectorsSchema.table(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerScope: ownerScopeEnum("owner_scope").notNull(),
    ownerId: uuid("owner_id"),
    region: varchar("region", { length: 10 }).notNull().default("global"),
    docType: embeddingDocTypeEnum("doc_type").notNull(),
    embeddingModelVersion: varchar("embedding_model_version", { length: 100 }).notNull(),
    embedding: vector("embedding").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    sourceRef: text("source_ref"),
    consentRef: uuid("consent_ref"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingHnswIdx: index("embeddings_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    ownerScopeIdx: index("embeddings_owner_scope_idx").on(table.ownerScope, table.ownerId),
    regionIdx: index("embeddings_region_idx").on(table.region),
  })
);

export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;
