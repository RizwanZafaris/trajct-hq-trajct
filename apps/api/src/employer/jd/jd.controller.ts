import { Controller, Post, Get, Put, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { JdService } from "./jd.service.js";
import { RbacGuard, RequireAuth, RequireRoles } from "../../common/guards/rbac.guard.js";
import type { GenerateJdRequest, PublishJdRequest, AnalyzeJdRequest } from "@trajct/contracts";

@Controller("employer/jds")
@UseGuards(RbacGuard)
export class JdController {
  constructor(private readonly jdService: JdService) {}

  /** POST /v1/employer/jds — generate JD (F-030, free — auth optional but metered if authed) */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async generateJd(
    @Body() body: GenerateJdRequest,
    @Req() req: FastifyRequest & { userId?: string; orgId?: string }
  ): Promise<unknown> {
    return this.jdService.generateJd(body, req.orgId ?? "");
  }

  /** GET /v1/employer/jds/:id — poll JD generation status */
  @Get(":id")
  async getJdStatus(
    @Param("id") id: string,
    @Req() req: FastifyRequest & { orgId?: string }
  ): Promise<unknown> {
    return this.jdService.getJdStatus(id, req.orgId ?? "");
  }

  /** GET /v1/employer/jds — list org JDs */
  @Get()
  @RequireAuth()
  async listJds(@Req() req: FastifyRequest & { orgId?: string }): Promise<unknown[]> {
    return this.jdService.listJds(req.orgId ?? "");
  }

  /** POST /v1/employer/jds/:id/publish — publish a JD */
  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @RequireAuth()
  @RequireRoles("admin", "recruiter")
  async publishJd(
    @Param("id") id: string,
    @Body() body: PublishJdRequest,
    @Req() req: FastifyRequest & { orgId?: string }
  ): Promise<unknown> {
    return this.jdService.publishJd(id, body, req.orgId ?? "");
  }

  /** POST /v1/employer/jds/analyze — analyze an existing JD (F-031) */
  @Post("analyze")
  @HttpCode(HttpStatus.OK)
  async analyzeJd(
    @Body() body: AnalyzeJdRequest,
    @Req() req: FastifyRequest & { orgId?: string }
  ): Promise<unknown> {
    return this.jdService.analyzeJd(body, req.orgId ?? "");
  }
}
