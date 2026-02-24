import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { JwtModule } from "@nestjs/jwt";
import { ReportsController } from "./reports.controller";
import { ReportsService, REPORTS_QUEUE } from "./reports.service";
import { ReportsProcessor } from "./reports.processor";
import { AuditModule } from "../audit/audit.module";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

@Module({
  imports: [JwtModule.register({}), AuditModule, BullModule.registerQueue({ name: REPORTS_QUEUE })],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsProcessor, JwtAuthGuard, PermissionsGuard]
})
export class ReportsModule {}

