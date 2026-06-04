import { Controller, Post, Body, Param, HttpCode, HttpStatus, Req } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { RbacGuard, RequireAuth, RequireRoles } from "../common/guards/rbac.guard.js";
import type { FastifyRequest } from "fastify";
import { OrgService } from "./org.service.js";
import type {
  CreateOrgRequest, CreateOrgResponse,
  InviteMemberRequest, InviteMemberResponse,
  ChangeMemberRoleRequest, ChangeMemberRoleResponse,
} from "@trajct/contracts";

@Controller("orgs")
@UseGuards(RbacGuard)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAuth()
  async createOrg(
    @Body() body: CreateOrgRequest,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<CreateOrgResponse> {
    return this.orgService.createOrg(body, req.userId ?? "");
  }

  @Post(":orgId/members/invite")
  @HttpCode(HttpStatus.CREATED)
  @RequireAuth()
  @RequireRoles("admin")
  async inviteMember(
    @Param("orgId") orgId: string,
    @Body() body: InviteMemberRequest,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<InviteMemberResponse> {
    return this.orgService.inviteMember(orgId, body, req.userId ?? "");
  }

  @Post(":orgId/members/role")
  @HttpCode(HttpStatus.OK)
  @RequireAuth()
  @RequireRoles("admin")
  async changeRole(
    @Param("orgId") orgId: string,
    @Body() body: ChangeMemberRoleRequest,
    @Req() req: FastifyRequest & { userId?: string }
  ): Promise<ChangeMemberRoleResponse> {
    return this.orgService.changeRole(orgId, body, req.userId ?? "");
  }
}
