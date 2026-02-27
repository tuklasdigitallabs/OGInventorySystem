"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type AccountState = "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED";

type AccountControlPayload = {
  state: AccountState;
  reason: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export function AccountControlPanel(): ReactNode {
  const [token, setToken] = useState("");
  const [state, setState] = useState<AccountState>("ACTIVE");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<string>("No request yet.");
  const [loading, setLoading] = useState(false);

  const readCurrentState = async (): Promise<void> => {
    setLoading(true);
    setResult("Loading account control...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/account-control`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = (await response.json()) as AccountControlPayload | { message?: string };
      if (!response.ok) {
        setResult(`Read failed (${response.status}): ${JSON.stringify(payload)}`);
        return;
      }
      const typed = payload as AccountControlPayload;
      setState(typed.state);
      setReason(typed.reason ?? "");
      setResult(JSON.stringify(typed, null, 2));
    } catch (error) {
      setResult(`Read failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (): Promise<void> => {
    setLoading(true);
    setResult("Updating account control...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/account-control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          state,
          reason: state === "SUSPENDED" ? reason : undefined
        })
      });
      const payload = (await response.json()) as AccountControlPayload | { message?: string };
      if (!response.ok) {
        setResult(`Update failed (${response.status}): ${JSON.stringify(payload)}`);
        return;
      }
      setResult(JSON.stringify(payload, null, 2));
    } catch (error) {
      setResult(`Update failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl bg-white/95 p-5 shadow-md">
      <h2 className="text-lg font-semibold text-brand-900">Account Control (Admin)</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">Explicit account state control with audit trail.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          placeholder="Admin JWT Access Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={state}
          onChange={(e) => setState(e.target.value as AccountState)}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="GRACE_PERIOD">GRACE_PERIOD</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Reason (required for SUSPENDED)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={state !== "SUSPENDED"}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-950 disabled:opacity-60"
          onClick={() => {
            void readCurrentState();
          }}
          disabled={loading || token.trim().length === 0}
        >
          Get Current State
        </button>
        <button
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          onClick={() => {
            void updateState();
          }}
          disabled={loading || token.trim().length === 0}
        >
          Apply State
        </button>
      </div>

      <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-slate-100 p-3 text-xs text-slate-800">{result}</pre>
    </section>
  );
}
