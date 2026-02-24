import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const zero = new Prisma.Decimal(0);

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async stockRows(client: PrismaClient | PrismaService, locationId: string): Promise<
    Array<{
      itemId: string;
      qtyOnHand: Prisma.Decimal;
      averageCost: Prisma.Decimal;
    }>
  > {
    const groups = await client.ledgerEvent.groupBy({
      by: ["itemId"],
      _sum: { qtyIn: true, qtyOut: true },
      where: { locationId }
    });
    const costs = await client.itemLocationCost.findMany({
      where: { locationId }
    });
    const costMap = new Map<string, Prisma.Decimal>();
    for (const cost of costs) {
      costMap.set(cost.itemId, cost.averageCost);
    }
    return groups.map((group) => ({
      itemId: group.itemId,
      qtyOnHand: (group._sum.qtyIn ?? zero).sub(group._sum.qtyOut ?? zero),
      averageCost: costMap.get(group.itemId) ?? zero
    }));
  }

  async stockOnHand(locationId: string): Promise<Array<{ itemId: string; qtyOnHand: string }>> {
    const rows = await this.stockRows(this.prisma, locationId);
    return rows.map((row) => ({ itemId: row.itemId, qtyOnHand: row.qtyOnHand.toFixed(4) }));
  }

  async valuation(locationId: string): Promise<Array<{ itemId: string; qtyOnHand: string; valuation: string }>> {
    const rows = await this.stockRows(this.prisma, locationId);
    return rows.map((row) => ({
      itemId: row.itemId,
      qtyOnHand: row.qtyOnHand.toFixed(4),
      valuation: row.qtyOnHand.mul(row.averageCost).toFixed(6)
    }));
  }

  async lowStock(locationId: string): Promise<Array<{ itemId: string; sku: string; name: string; qtyOnHand: string; lowStockLevel: string }>> {
    const rows = await this.stockRows(this.prisma, locationId);
    const items = await this.prisma.item.findMany({
      where: { lowStockLevel: { not: null } }
    });
    const rowMap = new Map<string, Prisma.Decimal>();
    for (const row of rows) {
      rowMap.set(row.itemId, row.qtyOnHand);
    }
    return items
      .map((item) => {
        const qty = rowMap.get(item.id) ?? zero;
        return {
          itemId: item.id,
          sku: item.sku,
          name: item.name,
          qtyOnHand: qty.toFixed(4),
          lowStockLevel: item.lowStockLevel!.toFixed(4)
        };
      })
      .filter((row) => new Prisma.Decimal(row.qtyOnHand).lt(new Prisma.Decimal(row.lowStockLevel)));
  }
}

