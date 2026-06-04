import { Controller, Post, Get, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { PipelineService } from "./pipeline.service.js";
import { AnalyticsService } from "./analytics.service.js";
import { RbacGuard, RequireAuth, RequireRoles } from "../../common/guards/rbac.guard.js";
import type { PipelineStageCreate, SubmitScorecard, BulkAction, AnalyticsQuery, MoveCandidateSchema } from "@trajct/contracts";

@Controller("employer/pipeline")
@UseGuards(RbacGuard)
@RequireAuth()
export class PipelineController {
  constructor(
    private readonly pipeline: PipelineService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get("jobs/:jobId/board")
  async getBoard(@Param("jobId") jobId: string, @Req() req: FastifyRequest & { orgId?: string }): Promise<unknown> {
    return this.pipeline.getBoard(jobId, req.orgId ?? "");
  }

  @Post("jobs/:jobId/stages") @HttpCode(HttpStatus.CREATED)
  @RequireRoles("admin", "recruiter")
  async createStage(
    @Param("jobId") jobId: string,
    @Body() body: PipelineStageCreate,
    @Req() req: FastifyRequest & { orgId?: string }
  ): Promise<unknown> {
    return this.pipeline.createStage(body, jobId, req.orgId ?? "");
  }

  @Post("move") @HttpCode(HttpStatus.OK)
  @RequireRoles("admin", "recruiter", "hiring_manager")
  async moveCandidate(@Body() body: { cardId: string; targetStageId: string; note?: string }, @Req() req: FastifyRequest & { orgId?: string; userId?: string }): Promise<void> {
    return this.pipeline.moveCandidate(body, req.orgId ?? "", req.userId ?? "");
  }

  @Post("scorecards") @HttpCode(HttpStatus.CREATED)
  async submitScorecard(@Body() body: SubmitScorecard, @Req() req: FastifyRequest & { orgId?: string; userId?: string }): Promise<void> {
    return this.pipeline.submitScorecard(body, req.orgId ?? "", req.userId ?? "");
  }

  @Post("bulk") @HttpCode(HttpStatus.OK)
  @RequireRoles("admin", "recruiter")
  async bulkAction(@Body() body: BulkAction, @Req() req: FastifyRequest & { orgId?: string; userId?: string }): Promise<unknown> {
    return this.pipeline.bulkAction(body, req.orgId ?? "", req.userId ?? "");
  }

  @Post("analytics") @HttpCode(HttpStatus.OK)
  async getAnalytics(@Body() body: AnalyticsQuery, @Req() req: FastifyRequest & { orgId?: string }): Promise<unknown> {
    return this.analytics.getAnalytics(body, req.orgId ?? "");
  }
}
