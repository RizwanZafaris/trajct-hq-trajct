import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_INTERCEPTOR } from "@nestjs/core";

// Platform
import { AuthModule } from "./auth/auth.module.js";
import { OrgModule } from "./org/org.module.js";
import { HealthModule } from "./health/health.module.js";

// Candidate
import { DiagnosticModule } from "./diagnostic/diagnostic.module.js";
import { ResumeModule } from "./candidate/resume/resume.module.js";
import { RateModule } from "./candidate/rate/rate.module.js";
import { ProfileModule } from "./candidate/profile/profile.module.js";
import { PrepModule } from "./candidate/prep/prep.module.js";
import { TrackerModule } from "./candidate/tracker/tracker.module.js";
import { LinkedInModule } from "./candidate/linkedin/linkedin.module.js";

// Employer
import { JdModule } from "./employer/jd/jd.module.js";
import { MatchingModule } from "./employer/matching/matching.module.js";
import { PipelineModule } from "./employer/pipeline/pipeline.module.js";

// Engine
import { PersonaModule } from "./engine/persona/persona.module.js";

// Common
import { AuditInterceptor } from "./common/interceptors/audit.interceptor.js";

@Module({
  imports: [
    // Rate limiting — fail-CLOSED if Redis unreachable (F-078.5)
    ThrottlerModule.forRoot([
      { name: "default",    ttl: 60000, limit: 60 },
      { name: "auth",       ttl: 60000, limit: 10 },
      { name: "generation", ttl: 60000, limit: 5 },
    ]),

    // Platform
    AuthModule,
    OrgModule,
    HealthModule,

    // Candidate features
    DiagnosticModule,   // F-001 (diagnostic) — already exists
    ResumeModule,       // F-001/F-002 (upload + tailor) + F-004 (chat-edit)
    RateModule,         // F-005 (rate-a-job)
    ProfileModule,      // F-003
    PrepModule,         // F-007, F-008
    TrackerModule,      // F-005, F-015, F-018, F-020, F-022
    LinkedInModule,     // F-011, F-012

    // Employer features
    JdModule,           // F-030, F-031
    MatchingModule,     // F-032, F-035, F-036
    PipelineModule,     // F-037, F-038, F-039

    // Engine
    PersonaModule,      // F-050, F-052, F-058, F-059
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
