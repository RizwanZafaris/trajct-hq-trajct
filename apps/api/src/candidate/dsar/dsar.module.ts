import { Module } from "@nestjs/common";
import { DsarController } from "./dsar.controller.js";
import { DsarService } from "./dsar.service.js";

@Module({
  controllers: [DsarController],
  providers: [DsarService],
  exports: [DsarService],
})
export class DsarModule {}
