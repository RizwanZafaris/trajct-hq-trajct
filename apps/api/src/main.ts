import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { AppModule } from "./app.module.js";
import { DomainErrorFilter } from "./common/filters/domain-error.filter.js";
import { SessionMiddleware } from "./common/middleware/session.middleware.js";

const logger = new Logger("Bootstrap");

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({ logger: false });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

  // Cookie support — needed for session token
  await app.register(fastifyCookie as Parameters<typeof app.register>[0], {
    secret: process.env["BETTER_AUTH_SECRET"] ?? "dev-secret-change-me",
  });

  // Multipart support — needed for F-001 resume upload (5 MB limit — FR-001.1)
  await app.register(fastifyMultipart as Parameters<typeof app.register>[0], {
    limits: {
      fileSize: 5 * 1024 * 1024,  // 5 MB — FR-001.1 exact limit
      files: 1,
    },
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Global error filter — maps domain errors to { code, message, retryable }
  app.useGlobalFilters(new DomainErrorFilter());

  // Session middleware — populates req.userId / req.orgId / req.orgRole on every request
  app.use(SessionMiddleware.factory());

  // API prefix (versioned)
  app.setGlobalPrefix("v1", { exclude: ["/healthz", "/readyz"] });

  // CORS
  app.enableCors({
    origin: process.env["WEB_URL"] ?? "http://localhost:3000",
    credentials: true,
  });

  const port = parseInt(process.env["PORT"] ?? "3001", 10);
  await app.listen(port, "0.0.0.0");
  logger.log(`API running on http://localhost:${port}`);
}

void bootstrap();
