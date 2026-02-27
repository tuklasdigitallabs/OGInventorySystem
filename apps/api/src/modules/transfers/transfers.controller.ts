import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { AccountStateGuard } from "../../common/guards/account-state.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ReceiveTransferDto } from "./dto/receive-transfer.dto";
import { TransfersService } from "./transfers.service";

@Controller("inventory/transfers")
@UseGuards(JwtAuthGuard, PermissionsGuard, LocationAccessGuard, AccountStateGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @RequirePermissions("TRANSFER_CREATE")
  async create(@Body() dto: CreateTransferDto, @CurrentUser() user: AuthUser): Promise<{ id: string }> {
    return this.transfersService.createTransfer(dto, user);
  }

  @Post(":id/dispatch")
  @RequirePermissions("TRANSFER_DISPATCH")
  async dispatch(@Param("id") id: string, @CurrentUser() user: AuthUser): Promise<{ id: string; status: string }> {
    const result = await this.transfersService.dispatchTransfer(id, user);
    return { id: result.id, status: result.status };
  }

  @Post(":id/receive")
  @RequirePermissions("TRANSFER_RECEIVE")
  async receive(
    @Param("id") id: string,
    @Body() dto: ReceiveTransferDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ id: string; status: string; varianceCount: number }> {
    const result = await this.transfersService.receiveTransfer(id, dto, user);
    return { id: result.id, status: result.status, varianceCount: result.varianceCount };
  }
}
