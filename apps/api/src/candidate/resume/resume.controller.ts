import { Controller, Post, Get, Delete, Param, HttpCode, HttpStatus, Req, UseGuards, HttpException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest } from "fastify";
import { EditRequestSchema } from "@trajct/contracts";
import { ResumeService } from "./resume.service.js";
import { TailorService } from "./tailor.service.js";
import { EditService } from "./edit.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";

@Controller("candidate/resumes")
@UseGuards(RbacGuard)
@RequireAuth()
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly tailorService: TailorService,
    private readonly editService: EditService,
  ) {}

  /** POST /v1/candidate/resumes — upload resume (F-001) */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ generation: { limit: 10, ttl: 3600000 } }) // FR-001.9
  async upload(@Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    void req;
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

  // --- F-004 chat-driven editing ------------------------------------------

  /** GET /v1/candidate/resumes/:id/edit/current — current editable version (F-004) */
  @Get(":id/edit/current")
  async currentVersion(
    @Param("id") resumeId: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.editService.currentVersion(resumeId, req.userId ?? "");
  }

  /** POST /v1/candidate/resumes/:id/edit/seed — bootstrap v1 from existing content (F-004) */
  @Post(":id/edit/seed")
  async seedVersion(
    @Param("id") resumeId: string,
    @Req() req: FastifyRequest & { userId?: string; body?: { content?: string } }
  ): Promise<unknown> {
    return this.editService.seedVersion(resumeId, req.userId ?? "", req.body?.content ?? "");
  }

  /** POST /v1/candidate/resumes/:id/edit — apply a chat instruction (F-004) */
  @Post(":id/edit")
  @Throttle({ generation: { limit: 60, ttl: 3600000 } }) // BR-004.3: 60 quick tweaks/hour/user
  async applyEdit(
    @Param("id") resumeId: string,
    @Req() req: FastifyRequest & { userId?: string; body?: unknown }
  ): Promise<unknown> {
    const parsed = EditRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpException({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request", retryable: false }, 400);
    }
    return this.editService.applyEdit(resumeId, parsed.data, req.userId ?? "");
  }

  /** POST /v1/candidate/resumes/:id/edit/undo (F-004) */
  @Post(":id/edit/undo")
  async undo(
    @Param("id") resumeId: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.editService.undo(resumeId, req.userId ?? "");
  }

  /** POST /v1/candidate/resumes/:id/edit/redo (F-004) */
  @Post(":id/edit/redo")
  async redo(
    @Param("id") resumeId: string,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<unknown> {
    return this.editService.redo(resumeId, req.userId ?? "");
  }
}
