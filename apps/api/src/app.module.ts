import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module.js";
import { OrgModule } from "./org/org.module.js";
import { HealthModule } from "./health/health.module.js";
import { DiagnosticModule } from "./diagnostic/diagnostic.module.js";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor.js";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Module({
  imports: [
    // Rate limiting — fail-CLOSED if Redis unreachable (F-078.5)
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000,
        limit: 60,
      },
      {
        name: "auth",
        ttl: 60000,
        limit: 10,
      },
      {
        name: "generation",
        ttl: 60000,
        limit: 5,
      },
    ]),
    AuthModule,
    OrgModule,
    HealthModule,
    DiagnosticModule,
  ],
  providers: [
    // Global audit interceptor — writes audit_log on all mutating routes
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
