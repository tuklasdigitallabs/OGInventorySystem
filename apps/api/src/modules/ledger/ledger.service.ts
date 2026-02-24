import { BadRequestException, Injectable } from "@nestjs/common";
import { LedgerEvent, LedgerReferenceType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthUser } from "../../common/types/auth-user.type";
import { PostLedgerEventDto } from "./dto/post-ledger-event.dto";

const decimalZero = new Prisma.Decimal(0);

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postEvent(dto: PostLedgerEventDto, actor: AuthUser): Promise<LedgerEvent> {
    const qtyIn = new Prisma.Decimal(dto.qtyIn);
    const qtyOut = new Prisma.Decimal(dto.qtyOut);
    if (qtyIn.gt(decimalZero) && qtyOut.gt(decimalZero)) {
      throw new BadRequestException("Event cannot have both qtyIn and qtyOut");
    }
    if (qtyIn.eq(decimalZero) && qtyOut.eq(decimalZero)) {
      throw new BadRequestException("Either qtyIn or qtyOut must be > 0");
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ledgerEvent.findUnique({ where: { id: dto.id } });
      if (existing) {
        return existing;
      }

      const agg = await tx.ledgerEvent.aggregate({
        _sum: { qtyIn: true, qtyOut: true },
        where: {
          locationId: dto.locationId,
          itemId: dto.itemId
        }
      });
      const currentQtyIn = agg._sum.qtyIn ?? decimalZero;
      const currentQtyOut = agg._sum.qtyOut ?? decimalZero;
      const currentQty = currentQtyIn.sub(currentQtyOut);
      const costState = await tx.itemLocationCost.findUnique({
        where: { itemId_locationId: { itemId: dto.itemId, locationId: dto.locationId } }
      });
      const currentAvg = costState ? costState.averageCost : decimalZero;

      let unitCost = currentAvg;
      let extendedCost = decimalZero;

      if (qtyIn.gt(decimalZero)) {
        if (!dto.unitCostAtTime) {
          throw new BadRequestException("Incoming events require unitCostAtTime");
        }
        unitCost = new Prisma.Decimal(dto.unitCostAtTime);
        extendedCost = qtyIn.mul(unitCost);
        const newQty = currentQty.add(qtyIn);
        const weightedCost = currentQty.mul(currentAvg).add(extendedCost);
        const newAvg = newQty.eq(decimalZero) ? decimalZero : weightedCost.div(newQty);

        await tx.itemLocationCost.upsert({
          where: {
            itemId_locationId: { itemId: dto.itemId, locationId: dto.locationId }
          },
          update: { averageCost: newAvg },
          create: {
            itemId: dto.itemId,
            locationId: dto.locationId,
            averageCost: newAvg
          }
        });
      } else {
        if (qtyOut.gt(currentQty)) {
          throw new BadRequestException("Insufficient stock for outgoing transaction");
        }
        extendedCost = qtyOut.mul(currentAvg);
      }

      const event = await tx.ledgerEvent.create({
        data: {
          id: dto.id,
          locationId: dto.locationId,
          itemId: dto.itemId,
          qtyIn,
          qtyOut,
          unitCostAtTime: unitCost,
          extendedCost,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          createdBy: actor.id,
          approvedBy: dto.approvedBy,
          businessDate: new Date(dto.businessDate)
        }
      });
      return event;
    });
  }

  async stockOnHand(locationId: string, itemId?: string): Promise<{
    locationId: string;
    rows: Array<{ itemId: string; qtyOnHand: string }>;
  }> {
    const rows = await this.prisma.ledgerEvent.groupBy({
      by: ["itemId"],
      _sum: { qtyIn: true, qtyOut: true },
      where: {
        locationId,
        ...(itemId ? { itemId } : {})
      }
    });

    return {
      locationId,
      rows: rows.map((r) => {
        const qty = (r._sum.qtyIn ?? decimalZero).sub(r._sum.qtyOut ?? decimalZero);
        return { itemId: r.itemId, qtyOnHand: qty.toFixed(4) };
      })
    };
  }

  allowedOfflineTypes(): LedgerReferenceType[] {
    return [
      LedgerReferenceType.WASTAGE,
      LedgerReferenceType.STOCK_COUNT,
      LedgerReferenceType.SALE_CONSUMPTION,
      LedgerReferenceType.TRANSFER_IN
    ];
  }
}

