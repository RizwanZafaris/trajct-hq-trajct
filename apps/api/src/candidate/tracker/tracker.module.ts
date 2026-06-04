import { Module } from "@nestjs/common";
import { TrackerController } from "./tracker.controller.js";
import { TrackerService } from "./tracker.service.js";
import { MonitorService } from "./monitor.service.js";
import { OfferService } from "./offer.service.js";

@Module({
  controllers: [TrackerController],
  providers: [TrackerService, MonitorService, OfferService],
  exports: [TrackerService, MonitorService],
})
export class TrackerModule {}
