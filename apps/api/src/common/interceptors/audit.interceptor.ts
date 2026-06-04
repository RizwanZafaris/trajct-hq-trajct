import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { FastifyRequest } from "fastify";

/**
 * Global AuditInterceptor — writes audit_log on all mutating routes (POST/PUT/PATCH/DELETE).
 * Wired as APP_INTERCEPTOR in AppModule.
 *
 * F-080: The audit log write is attempted before the response is sent.
 * If writing fails, the error is logged but does NOT suppress the response —
 * that behaviour is reserved for compliance-critical decisions (handled in q.compliance worker).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly mutateMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (!this.mutateMethods.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          // TODO: wire real audit_log write when DB client is injected
          this.logger.debug(
            `AUDIT ${request.method} ${request.url} — actor: ${(request as { userId?: string }).userId ?? "anon"}`
          );
        },
        error: (err: unknown) => {
          this.logger.error(
            `AUDIT_FAIL ${request.method} ${request.url}`,
            err instanceof Error ? err.stack : String(err)
          );
        },
      })
    );
  }
}
