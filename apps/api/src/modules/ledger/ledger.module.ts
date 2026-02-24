import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LedgerController } from "./ledger.controller";
import { LedgerService } from "./ledger.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";

@Module({
  imports: [JwtModule.register({})],
  controllers: [LedgerController],
  providers: [LedgerService, JwtAuthGuard, PermissionsGuard, LocationAccessGuard],
  exports: [LedgerService]
})
export class LedgerModule {}

