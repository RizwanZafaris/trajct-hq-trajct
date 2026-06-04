import {
  Controller, Post, Get, Body, HttpCode, HttpStatus, Req, Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service.js";
import {
  SignupRequestSchema, LoginRequestSchema,
  type SignupRequest, type LoginRequest, type SignupResponse,
  type LoginResponse, type MeResponse, type LogoutResponse,
} from "@trajct/contracts";

const SESSION_COOKIE = "trajct_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 3600, // 30 days
};

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/signup */
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: SignupRequest): Promise<SignupResponse> {
    const parsed = SignupRequestSchema.parse(body);
    return this.auth.signup(parsed);
  }

  /** POST /v1/auth/login — 5 req/min rate limit (FR-070.5) */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<LoginResponse> {
    const parsed = LoginRequestSchema.parse(body);
    const { response, sessionToken } = await this.auth.login(parsed);

    // Set httpOnly session cookie
    void res.setCookie(SESSION_COOKIE, sessionToken, COOKIE_OPTS);

    return response;
  }

  /** GET /v1/auth/me */
  @Get("me")
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: FastifyRequest): Promise<MeResponse> {
    const token = req.cookies?.[SESSION_COOKIE] ?? "";
    return this.auth.me(token);
  }

  /** POST /v1/auth/logout */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<LogoutResponse> {
    const token = req.cookies?.[SESSION_COOKIE] ?? "";
    await this.auth.logout(token);
    void res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { success: true };
  }
}
