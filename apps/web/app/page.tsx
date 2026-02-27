import { OfflineDemo } from "../components/offline-demo";
import { AccountControlPanel } from "../components/account-control-panel";
import type { ReactNode } from "react";

const modules = [
  "Authentication + RBAC",
  "Master Data",
  "Purchasing + Receiving",
  "Transfers",
  "Branch Operations",
  "Costing Engine",
  "Reporting Queue",
  "Offline Sync"
];

export default function HomePage(): ReactNode {
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-10">
      <header className="mb-8 rounded-3xl bg-brand-900 p-8 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-100">One Gourmet PH</p>
        <h1 className="mt-2 text-3xl font-bold">Centralized F&B Inventory & Costing</h1>
        <p className="mt-3 max-w-2xl text-sm text-brand-100">
          Immutable ledger inventory, moving average costing per location, and offline-safe branch transactions.
        </p>
      </header>

      <section className="mb-6 rounded-2xl bg-white/95 p-5 shadow-md">
        <h2 className="text-lg font-semibold text-brand-900">MVP Foundation Modules</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((moduleName) => (
            <article key={moduleName} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {moduleName}
            </article>
          ))}
        </div>
      </section>

      <AccountControlPanel />
      <OfflineDemo />
    </main>
  );
}
