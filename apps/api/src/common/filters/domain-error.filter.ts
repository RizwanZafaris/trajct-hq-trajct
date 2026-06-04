import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";

/**
 * Maps domain errors to the FRD error-code format: { code, message, retryable }
 * Required by Technical-Methodology §5: every API error must follow this shape.
 */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred.";
    let retryable = true;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "object" && response !== null && "code" in response) {
        const r = response as { code: string; message: string; retryable: boolean };
        code = r.code;
        message = r.message;
        retryable = r.retryable ?? false;
      } else {
        message = exception.message;
        retryable = statusCode >= 500;
        code = this.statusToCode(statusCode);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    void reply.status(statusCode).send({ code, message, retryable });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: "VALIDATION_ERROR",
      401: "INVALID_CREDENTIALS",
      402: "PAYMENT_REQUIRED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      413: "FILE_TOO_LARGE",
      415: "UNSUPPORTED_FORMAT",
      422: "VALIDATION_ERROR",
      423: "LOCKED",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR",
      502: "BAD_GATEWAY",
      503: "ENGINE_UNAVAILABLE",
    };
    return map[status] ?? "INTERNAL_ERROR";
  }
}
