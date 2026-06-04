import { Controller, Get, Put, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ProfileService } from "./profile.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import type { ProfileUpsert } from "@trajct/contracts";

@Controller("candidate/profile")
@UseGuards(RbacGuard)
@RequireAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.profileService.getProfile(req.userId ?? "");
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async upsertProfile(
    @Body() body: ProfileUpsert,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.profileService.upsertProfile(body, req.userId ?? "");
  }
}
