import { Controller, Post, Get, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { PersonaService } from "./persona.service.js";
import { OutcomeService } from "./outcome.service.js";
import { DiscoveryService } from "./discovery.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import type { LogOutcomeRequest, JobDiscoveryQuery } from "@trajct/contracts";

@Controller("engine")
@UseGuards(RbacGuard)
@RequireAuth()
export class PersonaController {
  constructor(
    private readonly persona: PersonaService,
    private readonly outcome: OutcomeService,
    private readonly discovery: DiscoveryService,
  ) {}

  @Get("personas/:companyId")
  async getPersona(@Param("companyId") id: string): Promise<unknown> {
    return this.persona.getPersona(id);
  }

  @Post("outcomes") @HttpCode(HttpStatus.CREATED)
  async logOutcome(@Body() body: LogOutcomeRequest): Promise<unknown> {
    return this.outcome.logOutcome(body);
  }

  @Post("jobs/discover") @HttpCode(HttpStatus.ACCEPTED)
  async discoverJobs(@Body() body: JobDiscoveryQuery): Promise<unknown> {
    return this.discovery.discoverJobs(body);
  }

  @Get("jobs/search")
  async searchJobs(@Req() req: FastifyRequest & { userId?: string; query?: Record<string, string> }): Promise<unknown[]> {
    return this.discovery.searchDiscovered(
      req.query?.["q"] ?? "",
      req.query ?? {},
      req.userId ?? ""
    );
  }
}
