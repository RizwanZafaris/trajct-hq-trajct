import { createHash } from "crypto";
import postgres from "postgres";

const SESSION_COOKIE = "trajct_session";
const SESSION_DAYS = 30;

let _sql: ReturnType<typeof postgres> | null = null;
function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 5 });
  }
  return _sql;
}

interface AuthenticatedRequest {
  cookies?: Record<string, string>;
  userId?: string;
  userType?: string;
  orgId?: string | null;
  orgRole?: string | null;
  displayName?: string | null;
}

/**
 * Session middleware — validates session cookie on every request.
 * Populates req.userId, req.userType, req.orgId, req.orgRole.
 * Does NOT block unauthenticated requests — guards do that.
 */
export class SessionMiddleware {
  static factory(): (req: AuthenticatedRequest, res: unknown, next: () => void) => void {
    return (req, _res, next) => {
      const token = req.cookies?.[SESSION_COOKIE];
      if (!token) { next(); return; }

      const sql = getSql();
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const newExpiry = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();

      sql`
        SELECT s.id, s.user_id, s.is_revoked, s.expires_at,
               u.user_type, u.display_name, u.is_active, u.is_suspended
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ${tokenHash}
        LIMIT 1
      `.then(async ([session]) => {
        if (
          !session ||
          session.is_revoked ||
          !session.is_active ||
          session.is_suspended ||
          new Date(session.expires_at as string) < new Date()
        ) {
          next(); return;
        }

        req.userId   = session.user_id as string;
        req.userType = session.user_type as string;
        req.displayName = (session.display_name as string | null) ?? null;

        // Slide session expiry
        await sql`UPDATE sessions SET expires_at = ${newExpiry}, last_active_at = NOW() WHERE id = ${session.id as string}`;

        // Fetch org context for employer users
        if (session.user_type === "employer") {
          const [mem] = await sql`
            SELECT org_id, role FROM org_memberships
            WHERE user_id = ${session.user_id as string} AND revoked_at IS NULL
            ORDER BY joined_at DESC LIMIT 1
          `;
          req.orgId   = (mem?.org_id as string | undefined) ?? null;
          req.orgRole = (mem?.role as string | undefined) ?? null;
        }

        next();
      }).catch(() => next());
    };
  }
}
