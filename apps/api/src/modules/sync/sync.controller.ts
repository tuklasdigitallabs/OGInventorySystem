import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { AccountStateGuard } from "../../common/guards/account-state.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { SyncBatchDto } from "./dto/sync-batch.dto";
import { SyncEventResult, SyncService } from "./sync.service";

@Controller("sync")
@UseGuards(JwtAuthGuard, PermissionsGuard, AccountStateGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post("batch")
  @RequirePermissions("SYNC_BATCH")
  async batch(
    @Body() dto: SyncBatchDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ results: SyncEventResult[] }> {
    const results = await this.syncService.processBatch(dto.events, user);
    return { results };
  }
}
