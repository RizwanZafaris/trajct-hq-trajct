import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module.js";
import { DomainErrorFilter } from "./common/filters/domain-error.filter.js";

const logger = new Logger("Bootstrap");

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  // Global validation pipe — validates every request against Zod/class-validator schemas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global error filter — maps domain errors to FRD error-code format { code, message, retryable }
  app.useGlobalFilters(new DomainErrorFilter());

  // API prefix — versioned at /v1/
  app.setGlobalPrefix("v1", { exclude: ["/healthz", "/readyz"] });

  // CORS — restrict in production
  app.enableCors({
    origin: process.env["WEB_URL"] ?? "http://localhost:3000",
    credentials: true,
  });

  const port = parseInt(process.env["PORT"] ?? "3001", 10);
  await app.listen(port, "0.0.0.0");
  logger.log(`API running on port ${port}`);
}

void bootstrap();
