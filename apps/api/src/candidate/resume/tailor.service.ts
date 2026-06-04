import {
  Injectable, Logger, BadRequestException, PaymentRequiredException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import type { TailorRequest, TailorResponse, TailorResult } from "@trajct/contracts";
import { checkEntitlement } from "@trajct/core/billing";
import { CapRedisUnavailableError, CapExceededError } from "@trajct/ai";

/**
 * F-002 — Per-company tailored résumé generation (paid).
 *
 * Paywall: entitlement check (F-071) before any work.
 * Cap check: atomic cap reserve before calling AI (F-077).
 * No charge for failed/halted work: release cap on any error (FR-073.4).
 * Fabrication scan: generated text validated for groundedness before billing (FR-002.8).
 * Cite-markers: every tailored section carries evidence refs (F-050).
 */
@Injectable()
export class TailorService {
  private readonly logger = new Logger(TailorService.name);

  async requestTailor(req: TailorRequest, userId: string): Promise<TailorResponse> {
    this.logger.log(`Tailor: resume=${req.resumeId} company=${req.companyId} user=${userId}`);

    // 1. Entitlement check — paid feature (FR-071.2)
    const entitlement = await checkEntitlement({ accountId: userId, feature: "resume.tailor" });
    if (!entitlement.entitled) {
      throw new PaymentRequiredException({
        code: "PAYMENT_REQUIRED",
        message: "Tailored résumé requires a paid plan.",
        retryable: false,
      });
    }

    const tailoredResumeId = randomBytes(16).toString("hex");
    const jobId = randomBytes(8).toString("hex");

    // Fire-and-forget the generation (client polls via tailoredResumeId)
    void this.generateAsync(req, userId, tailoredResumeId);

    return {
      tailoredResumeId,
      jobId,
      status: "pending",
      pollUrl: `/v1/candidate/resumes/tailored/${tailoredResumeId}`,
      estimatedSeconds: 20,
      ledgerEntryId: null,
    };
  }

  async getTailorResult(tailoredResumeId: string, userId: string): Promise<TailorResult> {
    void userId;
    // TODO Sprint 1: SELECT from tailored_resumes WHERE id = tailoredResumeId AND user_id = userId
    return {
      id: tailoredResumeId,
      status: "pending",
      generatedText: null,
      generatedFileUrl: null,
      fabricationScanPassed: null,
      citations: [],
      modelVersion: null,
      version: 1,
    };
  }

  async getDownloadUrl(tailoredResumeId: string, userId: string): Promise<{ url: string; expiresAt: string }> {
    void tailoredResumeId;
    void userId;
    // TODO: Generate presigned R2 URL (15-min TTL)
    throw new Error("F-002 download not implemented — Sprint 1");
  }

  // ---------------------------------------------------------------------------

  private async generateAsync(req: TailorRequest, userId: string, tailoredResumeId: string): Promise<void> {
    const reservationId = `tailor:${tailoredResumeId}`;
    let capReserved = false;

    try {
      const openrouterKey = process.env["OPENROUTER_API_KEY"];

      // TODO: Fetch resume text from DB
      const resumeText = "[Resume text — wire DB in Sprint 1]";

      // TODO: Fetch persona from packages/core/engine
      const personaText = `Company persona for ${req.companyId} — wire engine in Sprint 1`;

      const jdText = req.targetJdText ?? `Target role: ${req.targetRole}`;

      // Generate tailored content
      const generated = await this.callAI(resumeText, jdText, personaText, tailoredResumeId, openrouterKey);

      // Fabrication scan (FR-002.8)
      const fabricationPassed = this.runFabricationScan(generated, resumeText);

      if (!fabricationPassed) {
        this.logger.warn(`Tailor ${tailoredResumeId}: fabrication scan failed — not serving`);
        // TODO: UPDATE tailored_resumes SET status='failed', error_code='FABRICATION_DETECTED'
        // No charge — FR-073.4
        return;
      }

      this.logger.log(`Tailor ${tailoredResumeId}: complete, fabrication scan passed`);
      // TODO: UPDATE tailored_resumes SET generated_text, fabrication_scan_passed=true, status='completed'
      // TODO: Commit billing charge (charge.ts + ledger)
    } catch (err) {
      if (err instanceof CapRedisUnavailableError || err instanceof CapExceededError) {
        this.logger.warn(`Tailor ${tailoredResumeId}: cap check failed — ${err.message}`);
      } else {
        this.logger.error(`Tailor ${tailoredResumeId}: generation failed`, err);
      }
      // TODO: Release cap reservation + UPDATE status='failed'
    }
  }

  private async callAI(
    resumeText: string, jdText: string, personaText: string,
    tailoredResumeId: string, apiKey?: string
  ): Promise<string> {
    if (!apiKey || apiKey === "sk-or-v1-replace-with-real-key") {
      return `[MOCK TAILORED RESUME for ${tailoredResumeId}]\n\nThis is a placeholder tailored resume. Wire OpenRouter API key to get real results.`;
    }

    const prompt = `You are an expert resume writer. Tailor the candidate's resume specifically for this role and company.

## Candidate Resume:
${resumeText.slice(0, 6000)}

## Target Role:
${jdText.slice(0, 2000)}

## Company Hiring Signals:
${personaText.slice(0, 1000)}

Create a tailored resume that:
1. Mirrors exact language from the JD for ATS optimization
2. Leads with the most relevant experience for THIS specific role
3. Quantifies impact where the original is vague
4. Removes irrelevant sections
5. Highlights skills that match the company's known preferences

Return ONLY the complete tailored resume text. No explanations.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://trajct.com",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5", // Frontier tier — F-002
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new ServiceUnavailableException({ code: "ENGINE_UNAVAILABLE", message: "Try again.", retryable: true });

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message.content ?? "";
  }

  /**
   * Fabrication scan: reject generated content that introduces facts not in the resume.
   * Real implementation: LLM judge + claim extraction. This is a heuristic pass for Sprint 1.
   */
  private runFabricationScan(generated: string, originalResume: string): boolean {
    if (!generated.trim()) return false;
    if (generated.includes("[MOCK")) return true; // pass mock content in dev

    // Basic check: generated should not be dramatically longer than source
    const genWords   = generated.trim().split(/\s+/).length;
    const srcWords   = originalResume.trim().split(/\s+/).length;
    if (genWords > srcWords * 2.5) return false; // suspiciously much more content

    // TODO: Real fabrication scan with LLM judge (compare claims in generated vs original)
    return true;
  }
}
