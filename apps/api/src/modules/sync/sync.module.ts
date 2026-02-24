import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LedgerModule } from "../ledger/ledger.module";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";

@Module({
  imports: [JwtModule.register({}), LedgerModule],
  controllers: [SyncController],
  providers: [SyncService, JwtAuthGuard, PermissionsGuard]
})
export class SyncModule {}

