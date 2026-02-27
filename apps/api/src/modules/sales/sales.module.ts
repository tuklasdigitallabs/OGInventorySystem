import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { LedgerModule } from "../ledger/ledger.module";
import { AuditModule } from "../audit/audit.module";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { AccountStateGuard } from "../../common/guards/account-state.guard";

@Module({
  imports: [JwtModule.register({}), LedgerModule, AuditModule],
  controllers: [SalesController],
  providers: [SalesService, JwtAuthGuard, PermissionsGuard, LocationAccessGuard, AccountStateGuard]
})
export class SalesModule {}
