import { BadRequestException, Injectable } from "@nestjs/common";
import { LedgerReferenceType, Prisma, TransferStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { AuthUser } from "../../common/types/auth-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LedgerService } from "../ledger/ledger.service";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ReceiveTransferDto } from "./dto/receive-transfer.dto";

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly audit: AuditService
  ) {}

  async createTransfer(dto: CreateTransferDto, actor: AuthUser): Promise<{ id: string }> {
    const transfer = await this.prisma.transfer.create({
      data: {
        transferNumber: dto.transferNumber,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        businessDate: new Date(dto.businessDate),
        createdBy: actor.id,
        lines: {
          create: dto.lines.map((line) => ({
            itemId: line.itemId,
            qty: new Prisma.Decimal(line.qty),
            unitCostAtDispatch: new Prisma.Decimal(0)
          }))
        }
      }
    });
    await this.audit.log({
      userId: actor.id,
      action: "TRANSFER_CREATE",
      entityType: "TRANSFER",
      entityId: transfer.id
    });
    return { id: transfer.id };
  }

  async dispatchTransfer(id: string, actor: AuthUser): Promise<{ id: string; status: TransferStatus }> {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!transfer || transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException("Transfer not found or not in draft");
    }

    for (const line of transfer.lines) {
      const costState = await this.prisma.itemLocationCost.findUnique({
        where: {
          itemId_locationId: { itemId: line.itemId, locationId: transfer.fromLocationId }
        }
      });
      const unitCost = costState?.averageCost ?? new Prisma.Decimal(0);

      await this.ledgerService.postEvent(
        {
          id: randomUUID(),
          locationId: transfer.fromLocationId,
          itemId: line.itemId,
          qtyIn: "0",
          qtyOut: line.qty.toString(),
          referenceType: LedgerReferenceType.TRANSFER_OUT,
          referenceId: transfer.id,
          businessDate: transfer.businessDate.toISOString(),
          unitCostAtTime: unitCost.toString()
        },
        actor
      );

      await this.prisma.transferLine.update({
        where: { id: line.id },
        data: { unitCostAtDispatch: unitCost }
      });
    }

    const updated = await this.prisma.transfer.update({
      where: { id },
      data: {
        status: TransferStatus.DISPATCHED,
        dispatchedBy: actor.id,
        dispatchedAt: new Date()
      }
    });
    await this.audit.log({
      userId: actor.id,
      action: "TRANSFER_DISPATCH",
      entityType: "TRANSFER",
      entityId: id
    });
    return { id: updated.id, status: updated.status };
  }

  async receiveTransfer(id: string, dto: ReceiveTransferDto, actor: AuthUser): Promise<{
    id: string;
    status: TransferStatus;
    varianceCount: number;
  }> {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!transfer || transfer.status !== TransferStatus.DISPATCHED) {
      throw new BadRequestException("Transfer not found or not dispatched");
    }

    let varianceCount = 0;
    for (const line of dto.lines) {
      const transferLine = transfer.lines.find((x) => x.id === line.transferLineId);
      if (!transferLine) {
        throw new BadRequestException(`Line not found: ${line.transferLineId}`);
      }
      const receivedQty = new Prisma.Decimal(line.qtyReceived);
      if (!receivedQty.eq(transferLine.qty)) {
        varianceCount += 1;
      }
      await this.ledgerService.postEvent(
        {
          id: randomUUID(),
          locationId: transfer.toLocationId,
          itemId: transferLine.itemId,
          qtyIn: receivedQty.toString(),
          qtyOut: "0",
          unitCostAtTime: transferLine.unitCostAtDispatch.toString(),
          referenceType: LedgerReferenceType.TRANSFER_IN,
          referenceId: transfer.id,
          businessDate: dto.businessDate
        },
        actor
      );
      await this.prisma.transferLine.update({
        where: { id: transferLine.id },
        data: { receivedQty }
      });
    }

    const updated = await this.prisma.transfer.update({
      where: { id },
      data: {
        status: TransferStatus.RECEIVED,
        receivedBy: actor.id,
        receivedAt: new Date()
      }
    });
    await this.audit.log({
      userId: actor.id,
      action: "TRANSFER_RECEIVE",
      entityType: "TRANSFER",
      entityId: id,
      details: { varianceCount }
    });
    return { id: updated.id, status: updated.status, varianceCount };
  }
}

