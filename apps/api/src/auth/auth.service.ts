import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  TooManyRequestsException,
  BadRequestException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { randomBytes, createHash } from "crypto";
import postgres from "postgres";
import type {
  SignupRequest,
  LoginRequest,
  SignupResponse,
  LoginResponse,
  MeResponse,
} from "@trajct/contracts";

/**
 * F-070 — Auth service.
 * Argon2id password hashing (FR-070.2).
 * Sessions stored in Postgres `sessions` table — RLS enforces per-user access.
 * Rate limit: 5 failed logins → lockout (FR-070.5, AC-070.1.3).
 * Sessions are 30-day sliding; token is hashed before storage.
 */

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 30;
const SESSION_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly sql: ReturnType<typeof postgres>;

  constructor() {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    this.sql = postgres(url, { max: 5 });
  }

  async signup(req: SignupRequest): Promise<SignupResponse> {
    this.logger.log(`Signup: ${req.email} type=${req.userType}`);

    // Check email uniqueness
    const existing = await this.sql`
      SELECT id FROM users WHERE email = ${req.email.toLowerCase()} LIMIT 1
    `;
    if (existing.length > 0) {
      throw new ConflictException({
        code: "EMAIL_TAKEN",
        message: "An account with that email already exists.",
        retryable: false,
      });
    }

    // Hash password with Argon2id (FR-070.2)
    const passwordHash = await argon2.hash(req.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const displayName = req.displayName?.trim() ?? null;

    const [user] = await this.sql`
      INSERT INTO users (email, password_hash, user_type, display_name)
      VALUES (${req.email.toLowerCase()}, ${passwordHash}, ${req.userType}, ${displayName})
      RETURNING id, email, user_type, email_verified
    `;

    this.logger.log(`User created: ${user!.id}`);

    return {
      userId: user!.id as string,
      email: user!.email as string,
      userType: user!.user_type as "candidate" | "employer",
      emailVerificationSent: false, // TODO: wire Resend email verification
    };
  }

  async login(req: LoginRequest): Promise<{ response: LoginResponse; sessionToken: string }> {
    this.logger.log(`Login attempt: ${req.email}`);

    const [user] = await this.sql`
      SELECT id, email, password_hash, user_type, display_name, email_verified,
             mfa_enabled, is_active, is_suspended, locked_until,
             failed_login_count
      FROM users
      WHERE email = ${req.email.toLowerCase()} AND deleted_at IS NULL
      LIMIT 1
    `;

    // Always hash even on not-found to prevent timing attack
    if (!user) {
      await argon2.hash("dummy-timing-protection");
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
        retryable: false,
      });
    }

    // Lockout check (FR-070.5, AC-070.1.3)
    if (user.locked_until && new Date(user.locked_until as string) > new Date()) {
      const retryAfter = Math.ceil(
        (new Date(user.locked_until as string).getTime() - Date.now()) / 1000
      );
      throw new TooManyRequestsException({
        code: "ACCOUNT_LOCKED",
        message: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        retryable: true,
        retryAfterSeconds: retryAfter,
      });
    }

    if (!user.is_active || user.is_suspended) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Account is inactive.",
        retryable: false,
      });
    }

    // Verify password
    const valid = await argon2.verify(user.password_hash as string, req.password);

    if (!valid) {
      // Increment failed count, lock if >= MAX
      const count = ((user.failed_login_count as number) ?? 0) + 1;
      if (count >= MAX_FAILED_LOGINS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
        await this.sql`
          UPDATE users SET failed_login_count = ${count}, locked_until = ${lockedUntil}
          WHERE id = ${user.id as string}
        `;
        throw new TooManyRequestsException({
          code: "TOO_MANY_ATTEMPTS",
          message: `Account locked for ${LOCKOUT_MINUTES} minutes after too many failed attempts.`,
          retryable: true,
          retryAfterSeconds: LOCKOUT_MINUTES * 60,
        });
      }
      await this.sql`
        UPDATE users SET failed_login_count = ${count} WHERE id = ${user.id as string}
      `;
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
        retryable: false,
      });
    }

    // Reset failed count on success
    await this.sql`
      UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW()
      WHERE id = ${user.id as string}
    `;

    // Create session — store hash of token (not the raw token)
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();

    await this.sql`
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES (${user.id as string}, ${tokenHash}, ${expiresAt})
    `;

    // Fetch org membership if employer
    let orgId: string | null = null;
    let orgRole: "admin" | "recruiter" | "hiring_manager" | "viewer" | null = null;
    if (user.user_type === "employer") {
      const [mem] = await this.sql`
        SELECT org_id, role FROM org_memberships
        WHERE user_id = ${user.id as string} AND revoked_at IS NULL
        ORDER BY joined_at DESC LIMIT 1
      `;
      if (mem) {
        orgId = mem.org_id as string;
        orgRole = mem.role as typeof orgRole;
      }
    }

    return {
      sessionToken: rawToken,
      response: {
        session: {
          sessionId: rawToken.slice(0, 36), // partial ID for client reference
          userId: user.id as string,
          userType: user.user_type as "candidate" | "employer" | "admin",
          displayName: (user.display_name as string | null) ?? null,
          orgId,
          orgRole,
          expiresAt,
          mfaRequired: (user.mfa_enabled as boolean) && !req.mfaCode,
        },
        requiresMfa: (user.mfa_enabled as boolean) && !req.mfaCode,
      },
    };
  }

  async validateSession(rawToken: string): Promise<{
    userId: string;
    userType: "candidate" | "employer" | "admin";
    orgId: string | null;
    orgRole: "admin" | "recruiter" | "hiring_manager" | "viewer" | null;
    displayName: string | null;
  } | null> {
    if (!rawToken) return null;

    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const [session] = await this.sql`
      SELECT s.id, s.user_id, s.expires_at, s.is_revoked,
             u.user_type, u.display_name, u.is_active, u.is_suspended
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (
      !session ||
      session.is_revoked ||
      !session.is_active ||
      session.is_suspended ||
      new Date(session.expires_at as string) < new Date()
    ) {
      return null;
    }

    // Slide expiry
    const newExpiry = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();
    await this.sql`
      UPDATE sessions SET expires_at = ${newExpiry}, last_active_at = NOW()
      WHERE id = ${session.id as string}
    `;

    let orgId: string | null = null;
    let orgRole: "admin" | "recruiter" | "hiring_manager" | "viewer" | null = null;
    if (session.user_type === "employer") {
      const [mem] = await this.sql`
        SELECT org_id, role FROM org_memberships
        WHERE user_id = ${session.user_id as string} AND revoked_at IS NULL
        ORDER BY joined_at DESC LIMIT 1
      `;
      if (mem) { orgId = mem.org_id as string; orgRole = mem.role as typeof orgRole; }
    }

    return {
      userId: session.user_id as string,
      userType: session.user_type as "candidate" | "employer" | "admin",
      displayName: (session.display_name as string | null) ?? null,
      orgId,
      orgRole,
    };
  }

  async me(rawToken: string): Promise<MeResponse> {
    const ctx = await this.validateSession(rawToken);
    if (!ctx) {
      throw new UnauthorizedException({ code: "SESSION_EXPIRED", message: "Session expired.", retryable: false });
    }

    const [user] = await this.sql`
      SELECT id, email, user_type, display_name, email_verified, mfa_enabled
      FROM users WHERE id = ${ctx.userId} LIMIT 1
    `;

    return {
      userId: ctx.userId,
      email: user!.email as string,
      userType: ctx.userType,
      displayName: ctx.displayName,
      emailVerified: user!.email_verified as boolean,
      mfaEnabled: user!.mfa_enabled as boolean,
      orgId: ctx.orgId,
      orgRole: ctx.orgRole,
    };
  }

  async logout(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await this.sql`
      UPDATE sessions SET is_revoked = true WHERE token_hash = ${tokenHash}
    `;
    this.logger.log("Session revoked");
  }
}
