import { Module } from "@nestjs/common";
import { PipelineController } from "./pipeline.controller.js";
import { PipelineService } from "./pipeline.service.js";
import { AnalyticsService } from "./analytics.service.js";

@Module({
  controllers: [PipelineController],
  providers: [PipelineService, AnalyticsService],
  exports: [PipelineService],
})
export class PipelineModule {}
