import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { AccountStateGuard } from "../../common/guards/account-state.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { LedgerService } from "./ledger.service";
import { PostLedgerEventDto } from "./dto/post-ledger-event.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { LedgerEvent } from "@prisma/client";

@Controller("ledger")
@UseGuards(JwtAuthGuard, PermissionsGuard, LocationAccessGuard, AccountStateGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post("events")
  @RequirePermissions("LEDGER_POST")
  async postEvent(@Body() dto: PostLedgerEventDto, @CurrentUser() user: AuthUser): Promise<LedgerEvent> {
    return this.ledgerService.postEvent(dto, user);
  }

  @Get("events")
  @RequirePermissions("LEDGER_READ")
  async stockOnHand(@Query("locationId") locationId: string, @Query("itemId") itemId?: string): Promise<{
    locationId: string;
    rows: Array<{ itemId: string; qtyOnHand: string }>;
  }> {
    return this.ledgerService.stockOnHand(locationId, itemId);
  }
}
