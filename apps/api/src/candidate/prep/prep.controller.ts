import { Controller, Post, Get, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { PrepService } from "./prep.service.js";
import { MockInterviewService } from "./mock-interview.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import type { PrepSessionRequest, MockInterviewStart, MockInterviewTurn } from "@trajct/contracts";

@Controller("candidate/prep")
@UseGuards(RbacGuard)
@RequireAuth()
export class PrepController {
  constructor(
    private readonly prepService: PrepService,
    private readonly mockService: MockInterviewService,
  ) {}

  /** POST /v1/candidate/prep — request interview prep session (F-007) */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPrep(@Body() body: PrepSessionRequest, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.prepService.requestPrepSession(body, req.userId ?? "");
  }

  /** GET /v1/candidate/prep/:id */
  @Get(":id")
  async getPrep(@Param("id") id: string, @Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.prepService.getPrepSession(id, req.userId ?? "");
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
