import { Controller, Post, Get, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { MatchingService } from "./matching.service.js";
import { RbacGuard, RequireAuth, RequireRoles } from "../../common/guards/rbac.guard.js";
import type { RunMatchingRequest, CandidateDecision } from "@trajct/contracts";

@Controller("employer/matching")
@UseGuards(RbacGuard)
@RequireAuth()
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Post("run")
  @HttpCode(HttpStatus.ACCEPTED)
  @RequireRoles("admin", "recruiter")
  async runMatching(
    @Body() body: RunMatchingRequest,
    @Req() req: FastifyRequest & { orgId?: string }
  ): Promise<unknown> {
    return this.matching.runMatching(body, req.orgId ?? "");
  }

  @Get("jobs/:jobId/results")
  async getResults(
    @Param("jobId") jobId: string,
    @Req() req: FastifyRequest & { orgId?: string }
  ): Promise<unknown[]> {
    return this.matching.getMatchingResults(jobId, req.orgId ?? "");
  }

  /** Human decision — advance or reject candidate (F-036 requires reason on reject) */
  @Post("decide")
  @HttpCode(HttpStatus.OK)
  @RequireRoles("admin", "recruiter", "hiring_manager")
  async makeDecision(
    @Body() body: CandidateDecision,
    @Req() req: FastifyRequest & { orgId?: string; userId?: string }
  ): Promise<void> {
    return this.matching.makeDecision(body, req.orgId ?? "", req.userId ?? "");
  }
}
