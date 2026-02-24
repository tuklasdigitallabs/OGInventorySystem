import { BadRequestException, Injectable } from "@nestjs/common";
import { LedgerReferenceType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { AuthUser } from "../../common/types/auth-user.type";
import { AuditService } from "../audit/audit.service";
import { LedgerService } from "../ledger/ledger.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePoDto } from "./dto/create-po.dto";
import { ReceivePoDto } from "./dto/receive-po.dto";

@Injectable()
export class PurchasingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly audit: AuditService
  ) {}

  async createPo(dto: CreatePoDto, actor: AuthUser): Promise<{ id: string }> {
    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber: dto.poNumber,
        supplierId: dto.supplierId,
        locationId: dto.locationId,
        businessDate: new Date(dto.businessDate),
        createdBy: actor.id,
        lines: {
          create: dto.lines.map((line) => ({
            itemId: line.itemId,
            orderedQty: new Prisma.Decimal(line.orderedQty),
            unitCost: new Prisma.Decimal(line.unitCost)
          }))
        }
      }
    });
    await this.audit.log({
      userId: actor.id,
      action: "PO_CREATE",
      entityType: "PURCHASE_ORDER",
      entityId: po.id
    });
    return { id: po.id };
  }

  async receivePo(poId: string, dto: ReceivePoDto, actor: AuthUser): Promise<{ receivedLines: number }> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lines: true }
    });
    if (!po) {
      throw new BadRequestException("PO not found");
    }

    for (const line of dto.lines) {
      const poLine = po.lines.find((x) => x.id === line.poLineId);
      if (!poLine) {
        throw new BadRequestException(`PO line not found: ${line.poLineId}`);
      }
      const qtyReceived = new Prisma.Decimal(line.qtyReceived);
      const remaining = poLine.orderedQty.sub(poLine.receivedQty);
      if (qtyReceived.gt(remaining)) {
        throw new BadRequestException(`Receive qty exceeds remaining for line ${line.poLineId}`);
      }

      await this.ledgerService.postEvent(
        {
          id: randomUUID(),
          locationId: po.locationId,
          itemId: poLine.itemId,
          qtyIn: qtyReceived.toString(),
          qtyOut: "0",
          unitCostAtTime: poLine.unitCost.toString(),
          referenceType: LedgerReferenceType.RECEIVE,
          referenceId: po.id,
          businessDate: dto.businessDate
        },
        actor
      );

      await this.prisma.purchaseOrderLine.update({
        where: { id: poLine.id },
        data: { receivedQty: poLine.receivedQty.add(qtyReceived) }
      });
    }

    await this.audit.log({
      userId: actor.id,
      action: "PO_RECEIVE",
      entityType: "PURCHASE_ORDER",
      entityId: po.id,
      details: { lines: dto.lines.length }
    });
    return { receivedLines: dto.lines.length };
  }
}

