import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { randomBytes } from "crypto";
import type { GenerateJdRequest, GeneratedJd, PublishJdRequest, AnalyzeJdRequest } from "@trajct/contracts";

/**
 * F-030 — AI JD generation + optimization (FREE employer front door).
 * F-031 — JD skill analysis + inclusivity review.
 *
 * Free forever (FR-030.5). Metered against org free-tier spend cap (FR-030.6).
 * p95 ≤ 20s (FR-030.1).
 * Inclusivity check runs on every generation (FR-030.2).
 * No auth required to generate (lead magnet); auth required to publish.
 */
@Injectable()
export class JdService {
  private readonly logger = new Logger(JdService.name);

  async generateJd(
    req: GenerateJdRequest,
    orgId: string
  ): Promise<{ jobPostingId: string; jobId: string; pollUrl: string }> {
    this.logger.log(`Generate JD: ${req.title} (${req.level}) org=${orgId}`);

    const jobPostingId = randomBytes(16).toString("hex");
    const jobId = randomBytes(8).toString("hex");

    // Fire-and-forget generation
    void this.generateAsync(req, orgId, jobPostingId);

    return { jobPostingId, jobId, pollUrl: `/v1/employer/jds/${jobPostingId}` };
  }

  async getJdStatus(jobPostingId: string, orgId: string): Promise<GeneratedJd> {
    void orgId;
    // TODO: SELECT from job_postings WHERE id = jobPostingId AND org_id = orgId
    return {
      jobId: jobPostingId,
      status: "pending",
      generatedJd: null,
      requiredSkills: null,
      inclusivityFlags: null,
      salaryHint: null,
      modelVersion: null,
    };
  }

  async publishJd(jobPostingId: string, req: PublishJdRequest, orgId: string): Promise<{ publishedAt: string }> {
    this.logger.log(`Publish JD ${jobPostingId} for org ${orgId}`);
    const publishedAt = new Date().toISOString();
    // TODO: UPDATE job_postings SET status='published', published_at=NOW(), edited_jd=req.editedJd
    void req;
    return { publishedAt };
  }

  async analyzeJd(req: AnalyzeJdRequest, orgId: string): Promise<{
    requiredSkills: string[];
    niceToHaveSkills: string[];
    seniorityBand: string;
    inclusivityFlags: object[];
    improvementSuggestions: string[];
  }> {
    this.logger.log(`Analyze JD for org ${orgId}`);

    const analysis = await this.runInclusivityCheck(req.jdText);

    return {
      requiredSkills: analysis.skills.required,
      niceToHaveSkills: analysis.skills.niceToHave,
      seniorityBand: analysis.seniorityBand,
      inclusivityFlags: analysis.flags,
      improvementSuggestions: analysis.suggestions,
    };
  }

  async listJds(orgId: string): Promise<unknown[]> {
    void orgId;
    // TODO: SELECT from job_postings WHERE org_id = orgId ORDER BY created_at DESC
    return [];
  }

  async updateJd(jobPostingId: string, editedJd: string, orgId: string): Promise<void> {
    this.logger.log(`Update JD ${jobPostingId}`);
    void orgId;
    // TODO: UPDATE + re-run inclusivity check
    void editedJd;
  }

  // ---------------------------------------------------------------------------

  private async generateAsync(req: GenerateJdRequest, orgId: string, jobPostingId: string): Promise<void> {
    try {
      const apiKey = process.env["OPENROUTER_API_KEY"];

      const jdContent = await this.callJdAI(req, jobPostingId, apiKey);
      const inclusivity = await this.runInclusivityCheck(jdContent);

      this.logger.log(`JD ${jobPostingId}: generated (${jdContent.length} chars, ${inclusivity.flags.length} inclusivity flags)`);

      // TODO: UPDATE job_postings SET
      //   generated_jd = jdContent,
      //   inclusivity_flags = flags,
      //   required_skills = skills,
      //   status = 'completed'
      void orgId;
    } catch (err) {
      this.logger.error(`JD ${jobPostingId} generation failed`, err);
      // TODO: UPDATE job_postings SET status = 'failed'
    }
  }

  private async callJdAI(req: GenerateJdRequest, jobPostingId: string, apiKey?: string): Promise<string> {
    if (!apiKey || apiKey === "sk-or-v1-replace-with-real-key") {
      return this.mockJd(req);
    }

    const mustHavesText = req.mustHaves.map((m, i) => `${i + 1}. ${m}`).join("\n");
    const niceToHavesText = (req.niceToHaves ?? []).map((n, i) => `${i + 1}. ${n}`).join("\n");
    const salaryText = req.salaryMinUsd
      ? `Salary: ${req.currency ?? "USD"} ${req.salaryMinUsd.toLocaleString()}–${(req.salaryMaxUsd ?? req.salaryMinUsd * 1.3).toLocaleString()}`
      : "";

    const prompt = `Write a complete, compelling job description for this role.

Role: ${req.title}
Level: ${req.level}
${req.department ? `Department: ${req.department}` : ""}
${req.location ? `Location: ${req.location}` : ""}
Work model: ${req.remotePolicy}
${salaryText}

Must-have requirements:
${mustHavesText}

${niceToHavesText ? `Nice-to-have:\n${niceToHavesText}` : ""}

Requirements for the JD:
1. Start with a compelling 2-sentence company hook and role mission
2. Write a clear "What you'll do" section (5-7 bullets)
3. Write a "What you'll bring" section — must-haves first, then nice-to-haves
4. Include a "What we offer" section with growth opportunities
5. Use inclusive language — no gendered terms, no unnecessary "ninja/rockstar/guru"
6. Aim for 350-500 words total
7. Write in second person ("You will..." not "The ideal candidate will...")

Return ONLY the job description text, no additional commentary.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://trajct.com",
        "X-Title": "Trajct JD Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",  // Utility tier — free feature
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException({ code: "ENGINE_UNAVAILABLE", message: "Try again.", retryable: true });
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message.content ?? this.mockJd(req);
  }

  private mockJd(req: GenerateJdRequest): string {
    return `## ${req.title} (${req.level})

We are looking for an experienced ${req.title} to join our team${req.department ? ` in ${req.department}` : ""}.

### What you'll do
- Lead initiatives that drive meaningful impact
- Collaborate with cross-functional teams to deliver results
- Own key workstreams from ideation to execution
- Mentor team members and share expertise
- Drive measurable improvements to core metrics

### What you'll bring
${req.mustHaves.map(m => `- ${m}`).join("\n")}
${(req.niceToHaves ?? []).map(n => `- ${n} (preferred)`).join("\n")}

### What we offer
- Competitive compensation${req.salaryMinUsd ? ` (${req.salaryMinUsd.toLocaleString()}–${(req.salaryMaxUsd ?? Math.round(req.salaryMinUsd * 1.3)).toLocaleString()} ${req.currency ?? "USD"})` : ""}
- ${req.remotePolicy === "remote" ? "Fully remote" : req.remotePolicy === "hybrid" ? "Hybrid work" : "On-site"} environment
- Growth opportunities and learning budget
- Inclusive, diverse team culture

[JD ID: mock-${Date.now()}]`;
  }

  private async runInclusivityCheck(jdText: string): Promise<{
    skills: { required: string[]; niceToHave: string[] };
    seniorityBand: string;
    flags: Array<{ flaggedText: string; reason: string; suggestion: string }>;
    suggestions: string[];
  }> {
    const flags: Array<{ flaggedText: string; reason: string; suggestion: string }> = [];

    // Heuristic bias checks (real implementation uses AI utility tier)
    const biasPatterns: Array<{ pattern: RegExp; reason: string; suggestion: string }> = [
      { pattern: /\b(ninja|rockstar|wizard|guru|superhero)\b/i,  reason: "Exclusionary jargon",   suggestion: "Use the specific skill instead (e.g., 'expert engineer')" },
      { pattern: /\b(aggressive)\b/i,                           reason: "Gendered language",      suggestion: "Use 'driven' or 'results-oriented'" },
      { pattern: /\b(manpower|man-hours|manning)\b/i,           reason: "Gendered compound",      suggestion: "Use 'workforce', 'hours', 'staffing'" },
      { pattern: /\b(digital native)\b/i,                       reason: "Age-coded language",     suggestion: "Describe the actual skill (e.g., 'comfortable with digital tools')" },
      { pattern: /\b(recent grad|fresh grad)\b/i,               reason: "Potential age bias",     suggestion: "Specify the qualification, not graduation recency" },
      { pattern: /\b(culture fit)\b/i,                          reason: "Vague and exclusionary", suggestion: "Describe specific values or ways of working" },
    ];

    for (const { pattern, reason, suggestion } of biasPatterns) {
      const match = pattern.exec(jdText);
      if (match) {
        flags.push({ flaggedText: match[0], reason, suggestion });
      }
    }

    // Extract skills heuristically
    const required: string[] = [];
    const niceToHave: string[] = [];

    const lines = jdText.split("\n");
    let inNiceToHave = false;
    for (const line of lines) {
      if (/nice.to.have|preferred|bonus/i.test(line)) { inNiceToHave = true; continue; }
      if (/required|must.have|qualifications/i.test(line)) { inNiceToHave = false; continue; }

      const techMatch = /\b(python|javascript|typescript|react|node|sql|aws|gcp|azure|kubernetes|docker)\b/i.exec(line);
      if (techMatch) {
        (inNiceToHave ? niceToHave : required).push(techMatch[0]);
      }
    }

    // Seniority detection
    const jdLower = jdText.toLowerCase();
    const seniorityBand = jdLower.includes("vp ") || jdLower.includes("director") || jdLower.includes("executive") ? "executive"
      : jdLower.includes("staff") || jdLower.includes("principal") ? "staff"
      : jdLower.includes("senior") ? "senior"
      : jdLower.includes("mid") || jdLower.includes("3+ year") ? "mid"
      : "entry";

    return {
      skills: { required: [...new Set(required)], niceToHave: [...new Set(niceToHave)] },
      seniorityBand,
      flags,
      suggestions: flags.length === 0
        ? ["JD looks inclusive! Consider adding salary range for better candidate conversion."]
        : ["Review flagged language to broaden your candidate pool."],
    };
  }
}
