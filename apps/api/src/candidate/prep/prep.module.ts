import { Module } from "@nestjs/common";
import { PrepController } from "./prep.controller.js";
import { PrepService } from "./prep.service.js";
import { MockInterviewService } from "./mock-interview.service.js";

@Module({
  controllers: [PrepController],
  providers: [PrepService, MockInterviewService],
  exports: [PrepService],
})
export class PrepModule {}
