import { Module } from "@nestjs/common";
import { JourneyService } from "./journey.service.js";

@Module({ providers: [JourneyService], exports: [JourneyService] })
export class JourneyModule {}
