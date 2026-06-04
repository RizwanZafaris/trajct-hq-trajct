import { Module } from "@nestjs/common";
import { JdController } from "./jd.controller.js";
import { JdService } from "./jd.service.js";

@Module({ controllers: [JdController], providers: [JdService], exports: [JdService] })
export class JdModule {}
