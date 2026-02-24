"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { queueOfflineEvent } from "../lib/offline-queue";
import { syncOfflineEvents } from "../lib/sync-client";

export function OfflineDemo(): ReactNode {
  const [token, setToken] = useState("");
  const [locationId, setLocationId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [syncLog, setSyncLog] = useState<string>("");

  const addWastage = async (): Promise<void> => {
    await queueOfflineEvent({
      id: crypto.randomUUID(),
      locationId,
      itemId,
      qtyIn: "0",
      qtyOut: qty,
      referenceType: "WASTAGE",
      referenceId: crypto.randomUUID(),
      businessDate: new Date().toISOString()
    });
    setSyncLog("Queued offline wastage event.");
  };

  const syncNow = async (): Promise<void> => {
    const results = await syncOfflineEvents(token);
    setSyncLog(JSON.stringify(results, null, 2));
  };

  return (
    <section className="rounded-2xl bg-white/95 p-5 shadow-md">
      <h2 className="text-lg font-semibold text-brand-900">Offline Queue Demo</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        Allowed offline ops: wastage, stock count, sales batch consumption, transfer receive.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="JWT Access Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Location UUID"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Item UUID"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          onClick={() => {
            void addWastage();
          }}
        >
          Queue Wastage
        </button>
        <button
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-950"
          onClick={() => {
            void syncNow();
          }}
        >
          Sync /sync/batch
        </button>
      </div>

      <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-slate-100 p-3 text-xs text-slate-800">
        {syncLog || "No sync yet"}
      </pre>
    </section>
  );
}
