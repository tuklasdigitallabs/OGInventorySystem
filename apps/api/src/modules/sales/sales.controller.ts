import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { CreateSalesBatchDto } from "./dto/create-sales-batch.dto";
import { SalesService } from "./sales.service";

@Controller("sales")
@UseGuards(JwtAuthGuard, PermissionsGuard, LocationAccessGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post("batches")
  @RequirePermissions("SALES_BATCH_CREATE")
  async createBatch(
    @Body() dto: CreateSalesBatchDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ id: string; consumedEvents: number }> {
    return this.salesService.createSalesBatch(dto, user);
  }
}

