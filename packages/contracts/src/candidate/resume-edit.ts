import { z } from "zod";

/**
 * F-004 — Chat-driven résumé editing. FRD §4.4.6 (input) / §4.4.7 (output).
 *
 * The user types a natural-language instruction; the résumé updates automatically.
 * Three modes (FR-004.1): quick_tweak (surgical), rebuild_section, full_rebuild.
 * Every change is visible (diff), reversible (undo/redo ≥20), explained (change_note),
 * and NEVER auto-sent (FR-004.5). Edits are version-based with optimistic concurrency.
 */

export const EditModeSchema = z.enum(["auto", "quick_tweak", "rebuild_section", "full_rebuild"]);
export type EditMode = z.infer<typeof EditModeSchema>;

// --- Input (FRD §4.4.6) ----------------------------------------------------
export const EditRequestSchema = z
  .object({
    versionId: z.string().uuid(),                       // current résumé version (optimistic concurrency)
    instruction: z.string().min(1).max(2000),           // BR-004.5: ≤2,000 chars
    mode: EditModeSchema.default("auto"),
    section: z.string().max(120).optional(),            // required for rebuild_section
    idempotencyKey: z.string().min(1).max(200).optional(),
  })
  .refine((v) => v.mode !== "rebuild_section" || !!v.section, {
    message: "section is required for rebuild_section",
    path: ["section"],
  });
export type EditRequest = z.infer<typeof EditRequestSchema>;

// --- Diff (FRD §4.4.7: added/removed/changed spans) ------------------------
export const EditDiffSchema = z.object({
  added: z.array(z.string()),
  removed: z.array(z.string()),
  changed: z.array(z.object({ before: z.string(), after: z.string() })),
});
export type EditDiff = z.infer<typeof EditDiffSchema>;

// --- Output — success 200 (FRD §4.4.7) -------------------------------------
export const EditResultSchema = z.object({
  newVersionId: z.string().uuid(),
  diff: EditDiffSchema,
  changeNote: z.string(),                               // "what changed + why" (FR-004.4)
  modeApplied: EditModeSchema,
  fabricationScanPassed: z.boolean(),                   // FR-004.6
});
export type EditResult = z.infer<typeof EditResultSchema>;

// --- Undo / redo (FR-004.4) ------------------------------------------------
export const EditNavResultSchema = z.object({
  currentVersionId: z.string().uuid(),
  versionNo: z.number().int(),
  content: z.string(),
  canUndo: z.boolean(),
  canRedo: z.boolean(),
});
export type EditNavResult = z.infer<typeof EditNavResultSchema>;
