import { Module } from "@nestjs/common";
import { DiagnosticController } from "./diagnostic.controller.js";
import { DiagnosticService } from "./diagnostic.service.js";

@Module({
  controllers: [DiagnosticController],
  providers: [DiagnosticService],
})
export class DiagnosticModule {}
