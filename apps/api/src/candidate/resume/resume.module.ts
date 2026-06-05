import { Module } from "@nestjs/common";
import { ResumeController } from "./resume.controller.js";
import { ResumeService } from "./resume.service.js";
import { TailorService } from "./tailor.service.js";
import { EditService } from "./edit.service.js";

@Module({
  controllers: [ResumeController],
  providers: [ResumeService, TailorService, EditService],
  exports: [ResumeService, TailorService, EditService],
})
export class ResumeModule {}
