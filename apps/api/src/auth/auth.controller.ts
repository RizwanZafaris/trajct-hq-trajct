import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import type {
  SignupRequest,
  LoginRequest,
  SignupResponse,
  LoginResponse,
  MeResponse,
  LogoutResponse,
} from "@trajct/contracts";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: SignupRequest): Promise<SignupResponse> {
    return this.authService.signup(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: FastifyRequest): Promise<MeResponse> {
    const sessionToken = req.cookies?.["session"] ?? "";
    return this.authService.me(sessionToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: FastifyRequest): Promise<LogoutResponse> {
    const sessionToken = req.cookies?.["session"] ?? "";
    await this.authService.logout(sessionToken);
    return { success: true };
  }
}
