import { LedgerReferenceType } from "@prisma/client";
import { AuthUser } from "../../common/types/auth-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { SyncService } from "./sync.service";

describe("SyncService", () => {
  const actor: AuthUser = {
    id: "user-1",
    email: "admin@example.com",
    roleNames: ["Admin"],
    permissionCodes: ["SYNC_BATCH"],
    locationIds: ["loc-1"]
  };

  it("returns duplicate when event id already exists", async () => {
    const prismaMock = {
      ledgerEvent: {
        findUnique: jest.fn().mockResolvedValue({ id: "evt-1" })
      }
    } as unknown as PrismaService;

    const ledgerMock = {
      allowedOfflineTypes: jest.fn().mockReturnValue([LedgerReferenceType.WASTAGE]),
      postEvent: jest.fn()
    } as unknown as LedgerService;

    const service = new SyncService(prismaMock, ledgerMock);
    const result = await service.processBatch(
      [
        {
          id: "evt-1",
          locationId: "loc-1",
          itemId: "item-1",
          qtyIn: "0",
          qtyOut: "1",
          referenceType: LedgerReferenceType.WASTAGE,
          referenceId: "ref-1",
          businessDate: "2026-02-24T00:00:00.000Z"
        }
      ],
      actor
    );

    expect(result).toEqual([
      {
        id: "evt-1",
        status: "duplicate",
        message: "Already processed"
      }
    ]);
  });

  it("rejects event when actor has no location access", async () => {
    const prismaMock = {
      ledgerEvent: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    } as unknown as PrismaService;

    const ledgerMock = {
      allowedOfflineTypes: jest.fn().mockReturnValue([LedgerReferenceType.WASTAGE]),
      postEvent: jest.fn()
    } as unknown as LedgerService;

    const service = new SyncService(prismaMock, ledgerMock);
    const result = await service.processBatch(
      [
        {
          id: "evt-2",
          locationId: "loc-x",
          itemId: "item-1",
          qtyIn: "0",
          qtyOut: "1",
          referenceType: LedgerReferenceType.WASTAGE,
          referenceId: "ref-1",
          businessDate: "2026-02-24T00:00:00.000Z"
        }
      ],
      actor
    );

    expect(result).toEqual([
      {
        id: "evt-2",
        status: "rejected",
        message: "No location access for event location"
      }
    ]);
  });
});

