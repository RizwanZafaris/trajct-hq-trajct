import { Controller, Post, Get, Put, Delete, Param, Body, Req, UseGuards, HttpCode, HttpStatus, HttpException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { TrackerService } from "./tracker.service.js";
import { MonitorService } from "./monitor.service.js";
import { OfferService } from "./offer.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import { CreateMonitorSchema, MonitorSnoozeSchema } from "@trajct/contracts";
import type { CreateApplication, UpdateApplication, OfferEvalRequest } from "@trajct/contracts";

@Controller("candidate")
@UseGuards(RbacGuard)
@RequireAuth()
export class TrackerController {
  constructor(
    private readonly tracker: TrackerService,
    private readonly monitor: MonitorService,
    private readonly offer: OfferService,
  ) {}

  // F-018: Applications
  @Post("applications") @HttpCode(HttpStatus.CREATED)
  async create(@Body() b: CreateApplication, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.tracker.createApplication(b, r.userId ?? "");
  }
  @Get("applications")
  async list(@Req() r: FastifyRequest & { userId?: string }): Promise<unknown[]> {
    return this.tracker.listApplications(r.userId ?? "");
  }
  @Put("applications/:id")
  async update(@Param("id") id: string, @Body() b: UpdateApplication, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.tracker.updateApplication(id, b, r.userId ?? "");
  }
  @Delete("applications/:id") @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApp(@Param("id") id: string, @Req() r: FastifyRequest & { userId?: string }): Promise<void> {
    return this.tracker.deleteApplication(id, r.userId ?? "");
  }

  // F-020: Follow-up
  @Post("applications/:id/follow-up") @HttpCode(HttpStatus.CREATED)
  async followUp(@Param("id") id: string, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.tracker.requestFollowUp(id, 1, r.userId ?? "");
  }

  // F-015: Monitors
  @Post("monitors") @HttpCode(HttpStatus.CREATED)
  async createMonitor(@Body() body: unknown, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    const parsed = CreateMonitorSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: "INVALID_FILTER", message: parsed.error.issues[0]?.message ?? "Check your filters.", retryable: false }, 400);
    }
    return this.monitor.createMonitor(parsed.data, r.userId ?? "");
  }
  @Get("monitors")
  async listMonitors(@Req() r: FastifyRequest & { userId?: string }): Promise<unknown[]> {
    return this.monitor.listMonitors(r.userId ?? "");
  }
  @Delete("monitors/:id") @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMonitor(@Param("id") id: string, @Req() r: FastifyRequest & { userId?: string }): Promise<void> {
    return this.monitor.deleteMonitor(id, r.userId ?? "");
  }
  /** POST /v1/candidate/monitors/:id/snooze — snooze a window (FR-015.5; setup preserved) */
  @Post("monitors/:id/snooze")
  async snoozeMonitor(@Param("id") id: string, @Body() body: unknown, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    const parsed = MonitorSnoozeSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ code: "INVALID_FILTER", message: "Provide a valid snoozeUntil.", retryable: false }, 400);
    return this.monitor.snooze(id, r.userId ?? "", parsed.data.snoozeUntil);
  }
  /** POST /v1/candidate/monitors/:id/pause */
  @Post("monitors/:id/pause")
  async pauseMonitor(@Param("id") id: string, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.monitor.setPaused(id, r.userId ?? "", true);
  }
  /** POST /v1/candidate/monitors/:id/resume */
  @Post("monitors/:id/resume")
  async resumeMonitor(@Param("id") id: string, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.monitor.setPaused(id, r.userId ?? "", false);
  }

  // F-005 Rate-a-job is served by RateModule at POST /v1/candidate/jobs/rate.

  // F-022: Offer evaluation
  @Post("offers/evaluate") @HttpCode(HttpStatus.CREATED)
  async evaluateOffer(@Body() b: OfferEvalRequest, @Req() r: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.offer.evaluateOffer(b, r.userId ?? "");
  }
  @Get("offers")
  async listOffers(@Req() r: FastifyRequest & { userId?: string }): Promise<unknown[]> {
    return this.offer.listOfferEvals(r.userId ?? "");
  }
}
