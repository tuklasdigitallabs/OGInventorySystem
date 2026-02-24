import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(JwtAuthGuard, PermissionsGuard, LocationAccessGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("stock-on-hand")
  @RequirePermissions("INVENTORY_READ")
  async stockOnHand(@Query("locationId") locationId: string): Promise<Array<{ itemId: string; qtyOnHand: string }>> {
    return this.inventoryService.stockOnHand(locationId);
  }

  @Get("valuation")
  @RequirePermissions("INVENTORY_READ")
  async valuation(@Query("locationId") locationId: string): Promise<Array<{ itemId: string; qtyOnHand: string; valuation: string }>> {
    return this.inventoryService.valuation(locationId);
  }

  @Get("low-stock")
  @RequirePermissions("INVENTORY_READ")
  async lowStock(@Query("locationId") locationId: string): Promise<
    Array<{ itemId: string; sku: string; name: string; qtyOnHand: string; lowStockLevel: string }>
  > {
    return this.inventoryService.lowStock(locationId);
  }
}

