import { Controller, Get, Put, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ProfileService, type ProfileDoc } from "./profile.service.js";
import { RbacGuard, RequireAuth } from "../../common/guards/rbac.guard.js";
import type { ProfileUpsert, BuildProfileResult } from "@trajct/contracts";

@Controller("candidate/profile")
@UseGuards(RbacGuard)
@RequireAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: FastifyRequest & { userId?: string }): Promise<unknown> {
    return this.profileService.getProfile(req.userId ?? "");
  }

  /** POST /v1/candidate/profile/build — build the master profile from ≤10 docs + pasted text (F-003). */
  @Post("build")
  @HttpCode(HttpStatus.OK)
  async build(@Req() req: FastifyRequest & { userId?: string }): Promise<BuildProfileResult> {
    const userId = req.userId ?? "";
    const docs: ProfileDoc[] = [];
    let pastedText: string | undefined;

    // Multipart: iterate all file parts + a "pasted_text" field.
    const multipart = (req as unknown as { parts?: () => AsyncIterableIterator<{ type: string; toBuffer?: () => Promise<Buffer>; filename?: string; mimetype?: string; fieldname?: string; value?: string }> }).parts;
    if (multipart) {
      for await (const part of multipart.call(req)) {
        if (part.type === "file" && part.toBuffer) {
          docs.push({ buffer: await part.toBuffer(), fileName: part.filename ?? "doc", mime: part.mimetype ?? "application/octet-stream" });
        } else if (part.fieldname === "pasted_text" && part.value) {
          pastedText = part.value;
        }
      }
    } else {
      const body = req.body as { pasted_text?: string } | undefined;
      pastedText = body?.pasted_text;
    }

    return this.profileService.buildProfile(userId, docs, pastedText);
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
