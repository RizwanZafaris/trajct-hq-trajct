import { Injectable, UnauthorizedException, TooManyRequestsException, Logger } from "@nestjs/common";
import type { SignupRequest, LoginRequest, SignupResponse, LoginResponse, MeResponse } from "@trajct/contracts";

/**
 * F-070 — Auth service skeleton.
 * Better Auth is integrated here. Argon2id for password hashing. Sessions in Postgres.
 * Login rate-limit: 5 failures → lockout (FR-070.5, AC-070.1.3).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async signup(req: SignupRequest): Promise<SignupResponse> {
    this.logger.log(`Signup: ${req.email}`);
    // TODO: implement with Better Auth + Argon2id
    // 1. Check if email exists → 409
    // 2. Check breached password (hibp) → reject
    // 3. Hash password: argon2.hash(password, { type: argon2.argon2id })
    // 4. Insert user
    // 5. Send verification email (via Resend/Novu)
    throw new Error("Not implemented — wire Better Auth in Sprint 1");
  }

  async login(req: LoginRequest): Promise<LoginResponse> {
    this.logger.log(`Login attempt: ${req.email}`);
    // TODO: implement with Better Auth
    // 1. Lookup user by email
    // 2. Check failed_login_count < 5 (else lockout → AC-070.1.3)
    // 3. Verify password: argon2.verify(hash, password)
    // 4. If MFA enabled and no mfaCode → return requiresMfa: true
    // 5. Create session in Postgres
    // 6. Set session cookie (httpOnly, secure, sameSite=lax)
    throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid email or password.", retryable: false });
  }

  async me(sessionToken: string): Promise<MeResponse> {
    // TODO: validate session token (hash + DB lookup + expiry check)
    void sessionToken;
    throw new UnauthorizedException({ code: "SESSION_EXPIRED", message: "Session expired.", retryable: false });
  }

  async logout(sessionToken: string): Promise<void> {
    // TODO: mark session as revoked in DB
    void sessionToken;
  }

  /** Rate-limit check: 5 failed logins → lockout (FR-070.5) */
  private async checkLoginRateLimit(userId: string): Promise<void> {
    // TODO: check Redis counter and/or DB locked_until field
    void userId;
  }
}
