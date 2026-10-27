"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { downloadCsv, methodLabel, rwf, rwfLabel, when } from "@/platform/v2/format";
import type { Earnings } from "@/platform/v2/org/types";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, NotBuilt, Page, Table, Td, inputClass } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

const PERIODS: Record<string, () => string> = {
  all: () => "",
  month: () => {
    const d = new Date();
    return `?from=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  },
  "30": () => `?from=${new Date(Date.now() - 29 * 86400000).toLocaleDateString("en-CA", { timeZone: "Africa/Kigali" })}`,
};

function Money() {
  const [period, setPeriod] = useState("all");
  const [kind, setKind] = useState<"" | "VOTE" | "TICKET">("");
  const { data, error, loading } = useLoad(() => api.get<Earnings>(`/payments/earnings/${PERIODS[period]()}`).then((r) => r.data), [period]);

  if (loading && !data) return <Loading />;
  if (!data) return <Page title="Money"><ErrorNote>{error}</ErrorNote></Page>;
  const t = data.totals;
  const rows = data.transactions.filter((r) => !kind || r.service === kind);
  const byMethod = Object.entries(t.by_method).filter(([, v]) => Number(v) > 0);

  return (
    <Page
      title="Money"
      subtitle="What came in, the Ozone team’s part, and what is yours."
      actions={
        <>
          <Field label={<span className="text-xs text-[#5B6472]">Period</span>}>
            <select className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All time</option>
              <option value="month">This month</option>
              <option value="30">Last 30 days</option>
            </select>
          </Field>
          <Button
            onClick={() =>
              downloadCsv("money-report.csv", ["Event or campaign", "Type", "Payments", "Money in (RWF)", "You keep (RWF)"],
                data.items.map((i) => [i.title, i.type === "event" ? "Tickets" : "Voting", i.transactions, Math.round(Number(i.gross)), Math.round(Number(i.organiser))]))
            }
          >
            Download report
          </Button>
        </>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <section aria-label="Money summary" className="bg-white border border-[#E5E7EB] rounded-2xl grid overflow-hidden" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="p-[22px] flex flex-col gap-1.5 border-r border-[#F1F2F4]">
          <span className="text-[13px] text-[#5B6472]">Money in</span>
          <span className="font-heading text-[28px] font-bold text-[#08283B] tabular-nums">{rwf(t.gross)}</span>
          <span className="text-xs text-[#5B6472]">{t.transactions} payments</span>
        </div>
        <div className="p-[22px] flex flex-col gap-1.5 border-r border-[#F1F2F4]">
          <span className="text-[13px] text-[#5B6472]">Ozone team</span>
          <span className="font-heading text-[28px] font-bold text-[#B42318] tabular-nums">− {rwf(t.ozone_team)}</span>
          <span className="text-xs text-[#5B6472]">{data.shares.ozone_team}% of what customers paid</span>
        </div>
        <div className="p-[22px] flex flex-col gap-1.5 bg-[#08283B]">
          <span className="text-[13px] text-[#C9D4DC]">Left for you</span>
          <span className="font-heading text-[28px] font-bold text-[#6EE7B7] tabular-nums">{rwf(t.organiser)}</span>
          <span className="text-xs text-[#C9D4DC]">{data.shares.organiser}% of what customers paid</span>
        </div>
      </section>

      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Card padded={false} title="By event and campaign">
          <Table head={["Event or campaign", "Money in", "You keep"]} minWidth={420} empty={data.items.length === 0 && <Empty>Nothing yet.</Empty>}>
            {data.items.map((i) => (
              <tr key={`${i.type}-${i.id}`}>
                <Td first><b>{i.title}</b><br /><span className="text-xs text-[#5B6472]">{i.type === "event" ? "Tickets" : "Voting"} · {i.transactions} payments</span></Td>
                <Td className="tabular-nums">{rwf(i.gross)}</Td>
                <Td last className="text-right font-semibold text-[#0B6B43] tabular-nums">{rwf(i.organiser)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="How people paid">
          {byMethod.length === 0 && <Empty>No payments yet.</Empty>}
          {byMethod.map(([m, v]) => (
            <div key={m} className="flex justify-between gap-3 text-sm py-1.5 border-b border-[#F1F2F4] last:border-0">
              <span>{methodLabel[m] ?? m}</span>
              <b className="tabular-nums">{rwfLabel(v)}</b>
            </div>
          ))}
          <NotBuilt>Payouts to your MoMo number aren&apos;t tracked per client yet. Ozone Events can tell you where your money is sent.</NotBuilt>
        </Card>
      </div>

      <Card
        padded={false}
        title="Latest payments"
        actions={
          <div role="group" aria-label="Show" className="inline-flex p-1 rounded-[10px] bg-[#F4F5F7] gap-1">
            {([["", "All"], ["VOTE", "Votes"], ["TICKET", "Tickets"]] as const).map(([k, label]) => (
              <button key={k || "all"} type="button" onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold ${kind === k ? "bg-white text-[#08283B]" : "text-[#4B5563]"}`}>{label}</button>
            ))}
          </div>
        }
      >
        <Table head={["Date", "For", "Paid by", "Amount", "You keep"]} minWidth={680} empty={rows.length === 0 && <Empty>No payments in this period.</Empty>}>
          {rows.map((r) => (
            <tr key={r.ref}>
              <Td first className="text-[#5B6472] whitespace-nowrap">{when(r.date)}</Td>
              <Td>{r.service === "VOTE" ? "Votes" : "Ticket"} · {r.title}</Td>
              <Td><Badge>{methodLabel[r.method] ?? r.method}</Badge></Td>
              <Td className="text-right font-semibold text-[#0B6B43] tabular-nums">+ {rwf(r.gross)}</Td>
              <Td last className="text-right tabular-nums">{rwf(r.organiser)}</Td>
            </tr>
          ))}
        </Table>
        <p className="m-0 px-[22px] pb-3 text-xs text-[#5B6472]">Shows the {data.transactions.length} most recent payments. The totals above count every payment.</p>
      </Card>
    </Page>
  );
}

export default function MoneyPage() {
  return <RoleGate roles={["COMPANY"]}><Money /></RoleGate>;
}
