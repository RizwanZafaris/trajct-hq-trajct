import { Controller, Post, Get, Body, Req, UseGuards, HttpException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { OnboardingAdvanceRequestSchema } from "@trajct/contracts";
import { OnboardingService } from "./onboarding.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";

@Controller("candidate/onboarding")
@UseGuards(RbacGuard)
@RequireAuth()
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  /** GET /v1/candidate/onboarding — current (resumable) state (F-091c) */
  @Get()
  async getState(@Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.onboarding.getState(req.userId ?? "");
  }

  /** POST /v1/candidate/onboarding/advance — record a step + advance (F-091c) */
  @Post("advance")
  async advance(@Body() body: unknown, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    const parsed = OnboardingAdvanceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid step", retryable: false }, 400);
    }
    return this.onboarding.advance(req.userId ?? "", parsed.data);
  }
}
