import { Controller, Post, Get, Param, Body, Req, UseGuards, HttpCode, HttpStatus, HttpException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest } from "fastify";
import { PrepService } from "./prep.service.js";
import { MockInterviewService } from "./mock-interview.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import { PrepGenerateRequestSchema } from "@trajct/contracts";
import type { MockInterviewStart, MockInterviewTurn } from "@trajct/contracts";

@Controller("candidate/prep")
@UseGuards(RbacGuard)
@RequireAuth()
export class PrepController {
  constructor(
    private readonly prepService: PrepService,
    private readonly mockService: MockInterviewService,
  ) {}

  /** POST /v1/candidate/prep — request a company-grounded interview brief (F-007) */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // BR-007.3: 10/hour/user (service also enforces, fail-closed)
  async requestPrep(@Body() body: unknown, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    const parsed = PrepGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request", retryable: false }, 400);
    }
    return this.prepService.requestPrep(parsed.data, req.userId ?? "");
  }

  /** GET /v1/candidate/prep/:id — poll the generated brief (F-007) */
  @Get(":id")
  async getPrep(@Param("id") id: string, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.prepService.getPrep(id, req.userId ?? "");
  }

  /** POST /v1/candidate/mock — start mock interview (F-008) */
  @Post("mock")
  @HttpCode(HttpStatus.CREATED)
  async startMock(@Body() body: MockInterviewStart, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.mockService.startSession(body, req.userId ?? "");
  }

  /** POST /v1/candidate/mock/:id/turn — submit a turn */
  @Post("mock/:id/turn")
  async submitTurn(
    @Param("id") id: string,
    @Body() body: Omit<MockInterviewTurn, "sessionId">,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.mockService.processTurn({ ...body, sessionId: id }, req.userId ?? "");
  }

  /** POST /v1/candidate/mock/:id/end */
  @Post("mock/:id/end")
  async endMock(@Param("id") id: string, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.mockService.endSession(id, req.userId ?? "");
  }
}
