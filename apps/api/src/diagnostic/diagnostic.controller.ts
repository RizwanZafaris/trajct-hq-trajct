import {
  Controller, Post, Get, Param, HttpCode, HttpStatus, Req, BadRequestException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest } from "fastify";
import { DiagnosticService, type DiagnoseInput } from "./diagnostic.service.js";
import {
  DiagnoseRequestSchema, type DiagnoseSubmitResponse, type DiagnosePollResponse, type DiagnosticError,
} from "@trajct/contracts";

/**
 * F-001 — Honest diagnostic endpoints. No auth required (FR-001.5).
 * Rate limit: 10/h (BR-001.8). The 30/h authed tier is a follow-up custom throttler key.
 */
@Controller("diagnostic")
export class DiagnosticController {
  constructor(private readonly diagnostic: DiagnosticService) {}

  /** POST /v1/diagnostic — submit a résumé (multipart file OR JSON paste) + a target. */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async submit(@Req() req: FastifyRequest & { userId?: string; body?: unknown }): Promise<DiagnoseSubmitResponse> {
    const userId = req.userId ?? null;
    const contentType = req.headers["content-type"] ?? "";

    let input: DiagnoseInput;

    if (contentType.includes("multipart/form-data")) {
      const data = await (req as unknown as { file: () => Promise<{ toBuffer: () => Promise<Buffer>; filename: string; mimetype: string; fields: Record<string, { value: string }> } | undefined> }).file();
      if (!data) throw this.err("MISSING_INPUT", "Add your résumé and a target role.");
      const buffer = await data.toBuffer();
      const fields = data.fields ?? {};
      const target = (fields["target"]?.value ?? "").toString();
      input = {
        resumeBuffer: buffer,
        resumeFileName: data.filename,
        resumeMime: data.mimetype,
        target,
        ...(fields["context"]?.value ? { context: fields["context"].value } : {}),
        ...(fields["locale"]?.value ? { locale: fields["locale"].value } : {}),
      };
    } else {
      const parsed = DiagnoseRequestSchema.parse(req.body);
      input = {
        ...(parsed.resume_text ? { resumeText: parsed.resume_text } : {}),
        target: parsed.target,
        ...(parsed.context ? { context: parsed.context } : {}),
        ...(parsed.locale ? { locale: parsed.locale } : {}),
      };
    }

    return this.diagnostic.diagnose(input, userId);
  }

  /** GET /v1/diagnostic/:diagToken — poll the diagnosis. */
  @Get(":diagToken")
  @HttpCode(HttpStatus.OK)
  async poll(
    @Param("diagToken") diagToken: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<DiagnosePollResponse> {
    return this.diagnostic.getResult(diagToken, req.userId ?? null);
  }

  private err(code: DiagnosticError["code"], message: string): BadRequestException {
    return new BadRequestException({ code, message, retryable: false } as DiagnosticError);
  }
}
