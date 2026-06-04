import { Controller, Post, Get, Delete, Param, HttpCode, HttpStatus, Req, UseGuards, Throttle } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ResumeService } from "./resume.service.js";
import { TailorService } from "./tailor.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";

@Controller("candidate/resumes")
@UseGuards(RbacGuard)
@RequireAuth()
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly tailorService: TailorService,
  ) {}

  /** POST /v1/candidate/resumes — upload resume (F-001) */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ generation: { limit: 10, ttl: 3600000 } }) // FR-001.9
  async upload(@Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    throw new Error("Multipart not wired — Sprint 1");
  }

  /** GET /v1/candidate/resumes — list resumes */
  @Get()
  async listResumes(@Req() req: FastifyRequest & { userId?: string }): Promise<unknown[]> {
    return this.resumeService.listResumes(req.userId ?? "");
  }

  /** GET /v1/candidate/resumes/:id — get a resume */
  @Get(":id")
  async getResume(
    @Param("id") id: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.resumeService.getResume(id, req.userId ?? "");
  }

  /** DELETE /v1/candidate/resumes/:id */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteResume(
    @Param("id") id: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<void> {
    return this.resumeService.deleteResume(id, req.userId ?? "");
  }

  /** POST /v1/candidate/resumes/:id/tailor — request tailored resume (F-002, paid) */
  @Post(":id/tailor")
  @HttpCode(HttpStatus.ACCEPTED)
  async requestTailor(
    @Param("id") resumeId: string,
    @Req() req: FastifyRequest & { userId?: string; body?: unknown }
  ): Promise<unknown> {
    return this.tailorService.requestTailor(
      { ...(req.body as object), resumeId } as never,
      req.userId ?? ""
    );
  }

  /** GET /v1/candidate/tailored/:id — poll tailor result (F-002) */
  @Get("tailored/:id")
  async getTailorResult(
    @Param("id") id: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.tailorService.getTailorResult(id, req.userId ?? "");
  }

  /** GET /v1/candidate/tailored/:id/download — presigned download URL */
  @Get("tailored/:id/download")
  async getDownload(
    @Param("id") id: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.tailorService.getDownloadUrl(id, req.userId ?? "");
  }
}
