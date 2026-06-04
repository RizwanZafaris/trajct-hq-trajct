import {
  Controller, Post, Get, Param, HttpCode, HttpStatus, Req, Res,
  BadRequestException, UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest, FastifyReply } from "fastify";
import { DiagnosticService } from "./diagnostic.service.js";
import { RbacGuard } from "../common/guards/rbac.guard.js";
import type { DiagnosticUploadResponse, DiagnosticResult, DiagnosticError } from "@trajct/contracts";

@Controller("diagnostic")
@UseGuards(RbacGuard)
export class DiagnosticController {
  constructor(private readonly diagnostic: DiagnosticService) {}

  /**
   * POST /v1/diagnostic/upload
   * Accepts multipart/form-data: file (resume) + fields (targetUrl|targetJdText, idempotencyKey)
   * Rate limit: 10/hr IP unauthenticated, 30/hr authenticated (FR-001.9)
   * No auth required (FR-001.5)
   */
  @Post("upload")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async upload(
    @Req() req: FastifyRequest & { userId?: string },
    @Res({ passthrough: true }) _res: FastifyReply
  ): Promise<DiagnosticUploadResponse> {
    // Parse multipart fields + file
    const data = await req.file();
    if (!data) {
      throw new BadRequestException({
        code: "PARSE_FAILED",
        message: "No file uploaded. Send multipart/form-data with a 'file' field.",
        retryable: false,
      } satisfies DiagnosticError);
    }

    const fileBuffer = await data.toBuffer();
    const fileName   = data.filename;
    const mimeType   = data.mimetype;

    // Additional fields from the multipart body
    const fields = data.fields as Record<string, { value: string }>;
    const targetUrl      = (fields["targetUrl"]?.value as string | undefined)      ?? "";
    const targetJdText   = (fields["targetJdText"]?.value as string | undefined)   ?? "";
    const idempotencyKey = (fields["idempotencyKey"]?.value as string | undefined) ?? `anon:${Date.now()}`;

    return this.diagnostic.processUpload(
      fileBuffer, fileName, mimeType,
      { url: targetUrl || undefined, text: targetJdText || undefined },
      req.userId ?? null,
      idempotencyKey
    );
  }

  /**
   * POST /v1/diagnostic/upload/text
   * Alternative: paste resume + JD text directly (no file upload needed)
   */
  @Post("upload/text")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async uploadText(
    @Req() req: FastifyRequest & { userId?: string; body?: {
      resumeText: string;
      targetUrl?: string;
      targetJdText?: string;
      idempotencyKey?: string;
    } }
  ): Promise<DiagnosticUploadResponse> {
    const body = req.body;
    const resumeText = body?.resumeText ?? "";

    if (!resumeText.trim()) {
      throw new BadRequestException({
        code: "RESUME_TOO_SHORT",
        message: "Please paste your resume text.",
        retryable: false,
      } satisfies DiagnosticError);
    }

    // Convert text to buffer (treated as plain text)
    const fileBuffer = Buffer.from(resumeText, "utf-8");
    const idempotencyKey = body?.idempotencyKey ?? `text:${Date.now()}`;

    return this.diagnostic.processUpload(
      fileBuffer, "paste.txt", "text/plain",
      { url: body?.targetUrl, text: body?.targetJdText },
      req.userId ?? null,
      idempotencyKey
    );
  }

  /**
   * GET /v1/diagnostic/:diagnosticId — poll result
   */
  @Get(":diagnosticId")
  @HttpCode(HttpStatus.OK)
  async getResult(
    @Param("diagnosticId") diagnosticId: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<DiagnosticResult> {
    return this.diagnostic.getResult(diagnosticId, req.userId ?? null);
  }
}
