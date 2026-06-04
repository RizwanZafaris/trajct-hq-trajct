import { Module } from "@nestjs/common";
import { ResumeController } from "./resume.controller.js";
import { ResumeService } from "./resume.service.js";
import { TailorService } from "./tailor.service.js";

@Module({
  controllers: [ResumeController],
  providers: [ResumeService, TailorService],
  exports: [ResumeService, TailorService],
})
export class ResumeModule {}
