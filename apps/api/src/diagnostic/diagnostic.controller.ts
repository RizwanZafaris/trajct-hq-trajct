import { Controller, Post, Get, Param, HttpCode, HttpStatus, Req } from "@nestjs/common";
import { UseGuards, Throttle } from "@nestjs/common";
import { RbacGuard, RequireAuth } from "../common/guards/rbac.guard.js";
import type { FastifyRequest } from "fastify";
import { DiagnosticService } from "./diagnostic.service.js";
import type { DiagnosticUploadResponse, DiagnosticResult } from "@trajct/contracts";

@Controller("diagnostic")
@UseGuards(RbacGuard)
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  @Post("upload")
  @HttpCode(HttpStatus.ACCEPTED)
  @RequireAuth()
  @Throttle({ generation: { limit: 5, ttl: 60000 } })
  async upload(
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<DiagnosticUploadResponse> {
    // Multipart handled by Fastify — body and file extracted before calling service
    // TODO: extract file from multipart request
    throw new Error("F-001 multipart not wired yet");
  }

  @Get(":diagnosticId")
  @HttpCode(HttpStatus.OK)
  @RequireAuth()
  async getResult(
    @Param("diagnosticId") diagnosticId: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<DiagnosticResult> {
    return this.diagnosticService.getResult(diagnosticId, req.userId ?? "");
  }
}
