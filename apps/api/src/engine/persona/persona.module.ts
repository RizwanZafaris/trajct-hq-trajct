import { Module } from "@nestjs/common";
import { PersonaController } from "./persona.controller.js";
import { PersonaService } from "./persona.service.js";
import { OutcomeService } from "./outcome.service.js";
import { DiscoveryService } from "./discovery.service.js";

@Module({
  controllers: [PersonaController],
  providers: [PersonaService, OutcomeService, DiscoveryService],
  exports: [PersonaService, OutcomeService],
})
export class PersonaModule {}
