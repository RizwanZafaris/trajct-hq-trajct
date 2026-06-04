import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("/healthz")
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string } {
    return { status: "ok" };
  }

  @Get("/readyz")
  @HttpCode(HttpStatus.OK)
  readiness(): { status: string; checks: Record<string, string> } {
    // TODO: add DB ping + Redis ping checks before launch
    return { status: "ok", checks: { db: "skip", redis: "skip" } };
  }
}
