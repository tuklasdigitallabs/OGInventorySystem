import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LedgerModule } from "../ledger/ledger.module";
import { AuditModule } from "../audit/audit.module";
import { TransfersController } from "./transfers.controller";
import { TransfersService } from "./transfers.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";

@Module({
  imports: [JwtModule.register({}), LedgerModule, AuditModule],
  controllers: [TransfersController],
  providers: [TransfersService, JwtAuthGuard, PermissionsGuard, LocationAccessGuard]
})
export class TransfersModule {}

