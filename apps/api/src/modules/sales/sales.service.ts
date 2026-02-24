import { BadRequestException, Injectable } from "@nestjs/common";
import { LedgerReferenceType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { AuthUser } from "../../common/types/auth-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LedgerService } from "../ledger/ledger.service";
import { CreateSalesBatchDto } from "./dto/create-sales-batch.dto";

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly audit: AuditService
  ) {}

  async createSalesBatch(dto: CreateSalesBatchDto, actor: AuthUser): Promise<{ id: string; consumedEvents: number }> {
    const salesBatch = await this.prisma.salesBatch.create({
      data: {
        locationId: dto.locationId,
        businessDate: new Date(dto.businessDate),
        source: dto.source,
        externalRef: dto.externalRef,
        createdBy: actor.id,
        lines: {
          create: dto.lines.map((line) => ({
            recipeId: line.recipeId,
            qtySold: new Prisma.Decimal(line.qtySold)
          }))
        }
      },
      include: {
        lines: {
          include: {
            recipe: {
              include: {
                lines: true
              }
            }
          }
        }
      }
    });

    let consumedEvents = 0;
    for (const line of salesBatch.lines) {
      if (line.recipe.lines.length === 0) {
        throw new BadRequestException(`Recipe has no ingredients: ${line.recipeId}`);
      }
      for (const ingredient of line.recipe.lines) {
        const qtyOut = ingredient.qtyPerSale.mul(line.qtySold);
        await this.ledgerService.postEvent(
          {
            id: randomUUID(),
            locationId: dto.locationId,
            itemId: ingredient.ingredientItemId,
            qtyIn: "0",
            qtyOut: qtyOut.toString(),
            referenceType: LedgerReferenceType.SALE_CONSUMPTION,
            referenceId: salesBatch.id,
            businessDate: dto.businessDate
          },
          actor
        );
        consumedEvents += 1;
      }
    }

    await this.audit.log({
      userId: actor.id,
      action: "SALES_BATCH_CREATE",
      entityType: "SALES_BATCH",
      entityId: salesBatch.id,
      details: { consumedEvents }
    });
    return { id: salesBatch.id, consumedEvents };
  }
}

