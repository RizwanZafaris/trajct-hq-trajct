import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";

export type OrgRole = "admin" | "recruiter" | "hiring_manager" | "viewer";

export const REQUIRED_ROLES_KEY = "requiredRoles";
export const RequireRoles = (...roles: OrgRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);

export const REQUIRE_AUTH_KEY = "requireAuth";
export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true);

/**
 * RbacGuard — server-side only (FR-072e.2 — never trust client).
 * Reads org_memberships from the session context; enforced at the route level.
 * Combined with Postgres RLS for defense in depth (§8, Technical-Methodology).
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireAuth = this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireAuth && !requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      FastifyRequest & { userId?: string; orgId?: string; orgRole?: OrgRole }
    >();

    if (!request.userId) {
      throw new UnauthorizedException({ code: "SESSION_EXPIRED", message: "Authentication required.", retryable: false });
    }

    if (requiredRoles?.length && !requiredRoles.includes(request.orgRole as OrgRole)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Insufficient role for this action.", retryable: false });
    }

    return true;
  }
}
