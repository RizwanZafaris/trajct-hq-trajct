import { Controller, Post, Body, Req, UseGuards, HttpException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { DsarRequestSchema } from "@trajct/contracts";
import { DsarService } from "./dsar.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";

@Controller("candidate/dsar")
@UseGuards(RbacGuard)
@RequireAuth()
export class DsarController {
  constructor(private readonly dsar: DsarService) {}

  /** POST /v1/candidate/dsar — request a data export or account deletion (F-093c) */
  @Post()
  async request(@Body() body: unknown, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    const parsed = DsarRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request", retryable: false }, 400);
    }
    const userId = req.userId ?? "";
    return parsed.data.requestType === "export"
      ? this.dsar.requestExport(userId, parsed.data.verificationToken)
      : this.dsar.requestDelete(userId, parsed.data.verificationToken);
  }
}
