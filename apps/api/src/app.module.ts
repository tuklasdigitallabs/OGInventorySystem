import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { LedgerModule } from "./modules/ledger/ledger.module";
import { PurchasingModule } from "./modules/purchasing/purchasing.module";
import { TransfersModule } from "./modules/transfers/transfers.module";
import { BranchOpsModule } from "./modules/branch-ops/branch-ops.module";
import { SalesModule } from "./modules/sales/sales.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SyncModule } from "./modules/sync/sync.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AuditModule } from "./modules/audit/audit.module";
import { InventoryModule } from "./modules/inventory/inventory.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 120)
      }
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379)
      }
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    AdminModule,
    LedgerModule,
    PurchasingModule,
    InventoryModule,
    TransfersModule,
    BranchOpsModule,
    SalesModule,
    ReportsModule,
    SyncModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
