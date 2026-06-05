import { Controller, Post, Get, Param, Req, UseGuards, HttpException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest } from "fastify";
import { RateJobRequestSchema } from "@trajct/contracts";
import { RateService } from "./rate.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";

@Controller("candidate/jobs")
@UseGuards(RbacGuard)
@RequireAuth()
export class RateController {
  constructor(private readonly rateService: RateService) {}

  /** POST /v1/candidate/jobs/rate — rate any job by URL or JD (F-005) */
  @Post("rate")
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // BR-005.3: 20/hour/user (service also enforces, fail-closed)
  async rate(
    @Req() req: FastifyRequest & { userId?: string; body?: unknown }
  ): Promise<unknown> {
    const parsed = RateJobRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpException({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request", retryable: false }, 400);
    }
    return this.rateService.rate(parsed.data, req.userId ?? "");
  }

  /** GET /v1/candidate/jobs/rated/:token — read a held rating (F-005) */
  @Get("rated/:token")
  async getRating(
    @Param("token") token: string,
    @Req() _req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    void _req;
    return this.rateService.getRating(token);
  }

  /** POST /v1/candidate/jobs/rated/:token/save — save into the pipeline (F-005 → F-018) */
  @Post("rated/:token/save")
  async saveRating(
    @Param("token") token: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.rateService.saveRating(token, req.userId ?? "");
  }
}
