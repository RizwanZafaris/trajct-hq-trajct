import { Controller, Post, Get, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { LinkedInService } from "./linkedin.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import type { LinkedInOptimizeRequest, LinkedInPostRequest } from "@trajct/contracts";

@Controller("candidate/linkedin")
@UseGuards(RbacGuard)
@RequireAuth()
export class LinkedInController {
  constructor(private readonly linkedin: LinkedInService) {}

  @Post("optimize") @HttpCode(HttpStatus.ACCEPTED)
  async optimize(@Body() b: LinkedInOptimizeRequest, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.linkedin.optimizeProfile(b, r.userId ?? "");
  }

  @Post("posts") @HttpCode(HttpStatus.CREATED)
  async generatePost(@Body() b: LinkedInPostRequest, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.linkedin.generatePost(b, r.userId ?? "");
  }

  @Post("posts/:id/schedule") @HttpCode(HttpStatus.NO_CONTENT)
  async schedulePost(
    @Param("id") id: string,
    @Body() b: { scheduledAt: string },
    @Req() r: FastifyRequest & { userId?: string }
  ): Promise<void> {
    return this.linkedin.schedulPost(id, b.scheduledAt, r.userId ?? "");
  }

  @Get("posts")
  async listPosts(@Req() r: FastifyRequest & { userId?: string }): Promise<unknown[]> {
    return this.linkedin.listPosts(r.userId ?? "");
  }
}
