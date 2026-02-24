"use client";

import { openDB } from "idb";

export type OfflineEvent = {
  id: string;
  locationId: string;
  itemId: string;
  qtyIn: string;
  qtyOut: string;
  unitCostAtTime?: string;
  referenceType: "WASTAGE" | "STOCK_COUNT" | "SALE_CONSUMPTION" | "TRANSFER_IN";
  referenceId: string;
  businessDate: string;
};

const DB_NAME = "og-inventory-offline";
const STORE = "events";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(upgradeDb) {
      if (!upgradeDb.objectStoreNames.contains(STORE)) {
        upgradeDb.createObjectStore(STORE, { keyPath: "id" });
      }
    }
  });
}

export async function queueOfflineEvent(event: OfflineEvent): Promise<void> {
  const dbase = await db();
  await dbase.put(STORE, event);
}

export async function listOfflineEvents(): Promise<OfflineEvent[]> {
  const dbase = await db();
  return dbase.getAll(STORE);
}

export async function removeOfflineEvent(id: string): Promise<void> {
  const dbase = await db();
  await dbase.delete(STORE, id);
}

