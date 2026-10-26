"use client";

import { when } from "@/platform/v2/format";
import type { Health } from "./data";

type Check = { name: string; note: string; state: "ok" | "warn" | "bad" };

const DOT = { ok: "#10A35C", warn: "#F39C12", bad: "#E02424" };

/** The health checks as rows: what works, what needs a look. */
export function healthChecks(h: Health): Check[] {
  return [
    { name: "Website and API", note: h.database && h.cache ? "Up" : !h.database ? "Database not answering" : "Cache not answering", state: h.database && h.cache ? "ok" : "bad" },
    {
      name: "MoMo and card payments (Weflexfy)",
      note: h.last_payment ? `Last payment ${when(h.last_payment.date)}` : "No payment yet",
      state: h.stuck_pending > 0 ? "warn" : "ok",
    },
    {
      name: "Payouts to clients",
      note: h.payouts.failed ? `${h.payouts.failed} failed in 30 days · ask Weflexfy` : `${h.payouts.sent} sent in 30 days`,
      state: h.payouts.failed ? "bad" : "ok",
    },
    {
      name: "Weflexfy fee transfers",
      note: h.payouts.fee_failed ? `${h.payouts.fee_failed} failing on Weflexfy's side` : "Working",
      state: h.payouts.fee_failed ? "warn" : "ok",
    },
  ];
}

export function HealthChecks({ health }: { health: Health }) {
  return (
    <div className="flex flex-col gap-2.5">
      {healthChecks(health).map((c) => (
        <div key={c.name} className="flex items-center justify-between gap-3 px-3.5 py-3 border border-[#E5E7EB] rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DOT[c.state] }} />
            <span className="font-semibold text-sm">{c.name}</span>
          </div>
          <span className="text-[13px] text-[#5B6472] text-right">{c.note}</span>
        </div>
      ))}
    </div>
  );
}
