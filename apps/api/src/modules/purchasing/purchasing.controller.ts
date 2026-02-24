import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { PurchasingService } from "./purchasing.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { CreatePoDto } from "./dto/create-po.dto";
import { ReceivePoDto } from "./dto/receive-po.dto";

@Controller("inventory")
@UseGuards(JwtAuthGuard, PermissionsGuard, LocationAccessGuard)
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Post("purchase-orders")
  @RequirePermissions("PO_CREATE")
  async createPo(@Body() dto: CreatePoDto, @CurrentUser() user: AuthUser): Promise<{ id: string }> {
    return this.purchasingService.createPo(dto, user);
  }

  @Post("purchase-orders/:id/receive")
  @RequirePermissions("PO_RECEIVE")
  async receivePo(
    @Param("id") id: string,
    @Body() dto: ReceivePoDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ receivedLines: number }> {
    return this.purchasingService.receivePo(id, dto, user);
  }
}

