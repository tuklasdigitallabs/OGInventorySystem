import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LedgerModule } from "../ledger/ledger.module";
import { AuditModule } from "../audit/audit.module";
import { BranchOpsController } from "./branch-ops.controller";
import { BranchOpsService } from "./branch-ops.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";

@Module({
  imports: [JwtModule.register({}), LedgerModule, AuditModule],
  controllers: [BranchOpsController],
  providers: [BranchOpsService, JwtAuthGuard, PermissionsGuard, LocationAccessGuard]
})
export class BranchOpsModule {}

