import { BadRequestException, Injectable } from "@nestjs/common";
import { CountStatus, LedgerReferenceType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { AuthUser } from "../../common/types/auth-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LedgerService } from "../ledger/ledger.service";
import { CreateCountDto } from "./dto/create-count.dto";
import { CreateWastageDto } from "./dto/create-wastage.dto";
import { IssueToOpsDto } from "./dto/issue-to-ops.dto";

@Injectable()
export class BranchOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly audit: AuditService
  ) {}

  async recordWastage(dto: CreateWastageDto, actor: AuthUser): Promise<{ id: string }> {
    const record = await this.prisma.wastage.create({
      data: {
        locationId: dto.locationId,
        itemId: dto.itemId,
        qty: new Prisma.Decimal(dto.qty),
        reasonCode: dto.reasonCode,
        businessDate: new Date(dto.businessDate),
        createdBy: actor.id
      }
    });
    await this.ledgerService.postEvent(
      {
        id: randomUUID(),
        locationId: dto.locationId,
        itemId: dto.itemId,
        qtyIn: "0",
        qtyOut: dto.qty,
        referenceType: LedgerReferenceType.WASTAGE,
        referenceId: record.id,
        businessDate: dto.businessDate
      },
      actor
    );
    await this.audit.log({
      userId: actor.id,
      action: "WASTAGE_CREATE",
      entityType: "WASTAGE",
      entityId: record.id
    });
    return { id: record.id };
  }

  async createCount(dto: CreateCountDto, actor: AuthUser): Promise<{ id: string }> {
    const count = await this.prisma.count.create({
      data: {
        locationId: dto.locationId,
        businessDate: new Date(dto.businessDate),
        submittedBy: actor.id,
        lines: {
          create: dto.lines.map((line) => ({
            itemId: line.itemId,
            systemQty: new Prisma.Decimal(line.systemQty),
            countedQty: new Prisma.Decimal(line.countedQty),
            reasonCode: line.reasonCode
          }))
        }
      }
    });
    return { id: count.id };
  }

  async submitCount(id: string, actor: AuthUser): Promise<{ id: string; status: CountStatus }> {
    const count = await this.prisma.count.findUnique({ where: { id } });
    if (!count || count.status !== CountStatus.DRAFT) {
      throw new BadRequestException("Count not found or not in draft status");
    }
    const updated = await this.prisma.count.update({
      where: { id },
      data: {
        status: CountStatus.SUBMITTED,
        submittedBy: actor.id,
        submittedAt: new Date(),
        lockedAt: new Date()
      }
    });
    return { id: updated.id, status: updated.status };
  }

  async approveCount(id: string, actor: AuthUser): Promise<{ id: string; status: CountStatus }> {
    const count = await this.prisma.count.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!count || count.status !== CountStatus.SUBMITTED) {
      throw new BadRequestException("Count not found or not submitted");
    }
    for (const line of count.lines) {
      const delta = line.countedQty.sub(line.systemQty);
      if (delta.eq(new Prisma.Decimal(0))) {
        continue;
      }
      const isIncoming = delta.gt(new Prisma.Decimal(0));
      await this.ledgerService.postEvent(
        {
          id: randomUUID(),
          locationId: count.locationId,
          itemId: line.itemId,
          qtyIn: isIncoming ? delta.toString() : "0",
          qtyOut: isIncoming ? "0" : delta.abs().toString(),
          referenceType: LedgerReferenceType.ADJUSTMENT,
          referenceId: count.id,
          approvedBy: actor.id,
          businessDate: count.businessDate.toISOString()
        },
        actor
      );
    }
    const updated = await this.prisma.count.update({
      where: { id },
      data: { status: CountStatus.APPROVED, approvedBy: actor.id }
    });
    await this.audit.log({
      userId: actor.id,
      action: "COUNT_APPROVE",
      entityType: "COUNT",
      entityId: id
    });
    return { id: updated.id, status: updated.status };
  }

  async issueToOperations(dto: IssueToOpsDto, actor: AuthUser): Promise<{ referenceId: string }> {
    const referenceId = randomUUID();
    await this.ledgerService.postEvent(
      {
        id: randomUUID(),
        locationId: dto.locationId,
        itemId: dto.itemId,
        qtyIn: "0",
        qtyOut: dto.qty,
        referenceType: LedgerReferenceType.ISSUE_TO_OPS,
        referenceId,
        businessDate: dto.businessDate
      },
      actor
    );
    await this.audit.log({
      userId: actor.id,
      action: "ISSUE_TO_OPS",
      entityType: "LEDGER_REF",
      entityId: referenceId
    });
    return { referenceId };
  }
}

