import { BadRequestException } from "@nestjs/common";
import { LedgerReferenceType, Prisma } from "@prisma/client";
import { AuthUser } from "../../common/types/auth-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { LedgerService } from "./ledger.service";

type TxStub = {
  ledgerEvent: {
    findUnique: jest.Mock;
    aggregate: jest.Mock;
    create: jest.Mock;
  };
  itemLocationCost: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

describe("LedgerService", () => {
  const actor: AuthUser = {
    id: "user-1",
    email: "admin@example.com",
    roleNames: ["Admin"],
    permissionCodes: ["LEDGER_POST"],
    locationIds: ["loc-1"]
  };

  function buildService(tx: TxStub): LedgerService {
    const prismaMock = {
      $transaction: async <T>(fn: (stub: TxStub) => Promise<T>): Promise<T> => fn(tx)
    } as unknown as PrismaService;
    return new LedgerService(prismaMock);
  }

  it("updates moving average on incoming stock", async () => {
    const tx: TxStub = {
      ledgerEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { qtyIn: new Prisma.Decimal(10), qtyOut: new Prisma.Decimal(0) }
        }),
        create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
          id: data.id,
          locationId: data.locationId,
          itemId: data.itemId,
          qtyIn: data.qtyIn,
          qtyOut: data.qtyOut,
          unitCostAtTime: data.unitCostAtTime,
          extendedCost: data.extendedCost,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          createdBy: data.createdBy,
          approvedBy: data.approvedBy,
          businessDate: data.businessDate,
          createdAt: new Date()
        }))
      },
      itemLocationCost: {
        findUnique: jest.fn().mockResolvedValue({
          averageCost: new Prisma.Decimal(100)
        }),
        upsert: jest.fn().mockResolvedValue(undefined)
      }
    };
    const service = buildService(tx);

    await service.postEvent(
      {
        id: "evt-1",
        locationId: "loc-1",
        itemId: "item-1",
        qtyIn: "10",
        qtyOut: "0",
        unitCostAtTime: "200",
        referenceType: LedgerReferenceType.RECEIVE,
        referenceId: "ref-1",
        businessDate: "2026-02-24T00:00:00.000Z"
      },
      actor
    );

    const upsertArg = tx.itemLocationCost.upsert.mock.calls[0][0] as {
      update: { averageCost: Prisma.Decimal };
    };
    expect(upsertArg.update.averageCost.toFixed(6)).toBe("150.000000");
  });

  it("rejects outgoing quantity when stock is insufficient", async () => {
    const tx: TxStub = {
      ledgerEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { qtyIn: new Prisma.Decimal(1), qtyOut: new Prisma.Decimal(0) }
        }),
        create: jest.fn()
      },
      itemLocationCost: {
        findUnique: jest.fn().mockResolvedValue({
          averageCost: new Prisma.Decimal(100)
        }),
        upsert: jest.fn()
      }
    };
    const service = buildService(tx);

    await expect(
      service.postEvent(
        {
          id: "evt-2",
          locationId: "loc-1",
          itemId: "item-1",
          qtyIn: "0",
          qtyOut: "2",
          referenceType: LedgerReferenceType.WASTAGE,
          referenceId: "ref-2",
          businessDate: "2026-02-24T00:00:00.000Z"
        },
        actor
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

