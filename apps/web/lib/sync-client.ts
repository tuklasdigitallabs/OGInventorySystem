"use client";

import { listOfflineEvents, removeOfflineEvent } from "./offline-queue";

type SyncResult = {
  id: string;
  status: "posted" | "duplicate" | "rejected" | "error";
  message?: string;
};

export async function syncOfflineEvents(accessToken: string): Promise<SyncResult[]> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
  const events = await listOfflineEvents();
  if (events.length === 0) {
    return [];
  }

  const response = await fetch(`${apiBaseUrl}/sync/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ events })
  });
  if (!response.ok) {
    throw new Error("Sync request failed");
  }

  const payload = (await response.json()) as { results: SyncResult[] };
  for (const result of payload.results) {
    if (result.status === "posted" || result.status === "duplicate") {
      await removeOfflineEvent(result.id);
    }
  }
  return payload.results;
}
