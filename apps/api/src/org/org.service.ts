import { Injectable, Logger } from "@nestjs/common";
import type {
  CreateOrgRequest, CreateOrgResponse,
  InviteMemberRequest, InviteMemberResponse,
  ChangeMemberRoleRequest, ChangeMemberRoleResponse,
} from "@trajct/contracts";

/**
 * F-070/F-072e — Org management service skeleton.
 */
@Injectable()
export class OrgService {
  private readonly logger = new Logger(OrgService.name);

  async createOrg(req: CreateOrgRequest, creatorUserId: string): Promise<CreateOrgResponse> {
    this.logger.log(`Create org: ${req.name} by user ${creatorUserId}`);
    // TODO: implement in Sprint 1
    throw new Error("Not implemented");
  }

  async inviteMember(orgId: string, req: InviteMemberRequest, invitedBy: string): Promise<InviteMemberResponse> {
    this.logger.log(`Invite ${req.email} to org ${orgId}`);
    void invitedBy;
    throw new Error("Not implemented");
  }

  async changeRole(orgId: string, req: ChangeMemberRoleRequest, changedBy: string): Promise<ChangeMemberRoleResponse> {
    this.logger.log(`Change role in org ${orgId}`);
    void changedBy;
    throw new Error("Not implemented");
  }
}
