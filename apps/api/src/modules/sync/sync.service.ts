import { Injectable } from "@nestjs/common";
import { LedgerReferenceType } from "@prisma/client";
import { AuthUser } from "../../common/types/auth-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { SyncEventInput } from "./dto/sync-batch.dto";

type SyncStatus = "posted" | "duplicate" | "rejected" | "error";

export type SyncEventResult = {
  id: string;
  status: SyncStatus;
  message?: string;
};

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService
  ) {}

  async processBatch(events: SyncEventInput[], actor: AuthUser): Promise<SyncEventResult[]> {
    const allowed = new Set<LedgerReferenceType>(this.ledgerService.allowedOfflineTypes());
    const results: SyncEventResult[] = [];

    for (const event of events) {
      const existing = await this.prisma.ledgerEvent.findUnique({ where: { id: event.id } });
      if (existing) {
        results.push({ id: event.id, status: "duplicate", message: "Already processed" });
        continue;
      }
      if (!allowed.has(event.referenceType)) {
        results.push({
          id: event.id,
          status: "rejected",
          message: "Reference type not allowed for offline sync"
        });
        continue;
      }
      if (!actor.locationIds.includes(event.locationId)) {
        results.push({
          id: event.id,
          status: "rejected",
          message: "No location access for event location"
        });
        continue;
      }
      try {
        await this.ledgerService.postEvent(
          {
            id: event.id,
            locationId: event.locationId,
            itemId: event.itemId,
            qtyIn: event.qtyIn,
            qtyOut: event.qtyOut,
            unitCostAtTime: event.unitCostAtTime,
            referenceType: event.referenceType,
            referenceId: event.referenceId,
            businessDate: event.businessDate
          },
          actor
        );
        results.push({ id: event.id, status: "posted" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown processing error";
        results.push({ id: event.id, status: "error", message });
      }
    }
    return results;
  }
}
