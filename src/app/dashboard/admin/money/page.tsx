"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import type { Earnings } from "@/platform/v2/admin/data";
import { downloadCsv, rwf } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Bar, Button, Card, Empty, ErrorNote, Field, inputClass, Loading, Page, Table, Td } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function AdminMoneyPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Money />
    </RoleGate>
  );
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The last six calendar months, oldest first, as from/to dates. */
function lastMonths(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { label: start.toLocaleDateString("en-GB", { month: "short", year: "numeric" }), from: iso(start), to: iso(end) };
  });
}

function periodParams(period: string): string {
  const now = new Date();
  if (period === "month") return `?from=${iso(new Date(now.getFullYear(), now.getMonth(), 1))}`;
  if (period === "last") {
    return `?from=${iso(new Date(now.getFullYear(), now.getMonth() - 1, 1))}&to=${iso(new Date(now.getFullYear(), now.getMonth(), 0))}`;
  }
  return "";
}

function Money() {
  const [period, setPeriod] = useState("all");
  const { data, error, loading } = useLoad(async () => {
    const months = lastMonths();
    const [report, ...byMonth] = await Promise.all([
      api.get<Earnings>(`/payments/earnings/${periodParams(period)}`).then((r) => r.data),
      ...months.map((m) => api.get<Earnings>(`/payments/earnings/?from=${m.from}&to=${m.to}`).then((r) => ({ ...m, gross: Number(r.data.totals.gross), gateway: Number(r.data.totals.gateway) }))),
    ]);
    return { report, byMonth };
  }, [period]);

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Platform money"><ErrorNote>{error}</ErrorNote></Page>;

  const { report: r, byMonth } = data;
  const t = r.totals;
  const gatewayPct = Number(r.shares.gateway) || 12;
  const viaWeflexfy = (Number(t.gateway) * 100) / gatewayPct;
  const oldLmb = Math.max(0, Number(t.gross) - viaWeflexfy);

  // One row per client, summing their events and campaigns.
  const clients = new Map<string, { gross: number; gateway: number; developer: number; host: number; items: string[] }>();
  for (const i of r.items) {
    const c = clients.get(i.company) || { gross: 0, gateway: 0, developer: 0, host: 0, items: [] };
    c.gross += Number(i.gross);
    c.gateway += Number(i.gateway);
    c.developer += Number(i.developer);
    c.host += Number(i.host);
    c.items.push(i.title);
    clients.set(i.company, c);
  }
  const rows = [...clients.entries()].sort((a, b) => b[1].gross - a[1].gross);
  const maxMonth = Math.max(1, ...byMonth.map((m) => m.gross));

  return (
    <Page
      title="Platform money"
      subtitle="Every client's money, and how it is shared."
      actions={
        <>
          <Field label="Period">
            <select className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All time</option>
              <option value="month">This month</option>
              <option value="last">Last month</option>
            </select>
          </Field>
          <Button
            onClick={() =>
              downloadCsv(
                "ozone-money.csv",
                ["Client", "Event or campaign", "Type", "Customers paid", `Weflexfy ${r.shares.gateway}%`, `Developer ${r.shares.developer}%`, "Client keeps"],
                r.items.map((i) => [i.company, i.title, i.type, i.gross, i.gateway, i.developer, i.host]),
              )
            }
          >
            Download report
          </Button>
        </>
      }
    >
      <section className="bg-white border border-[#E5E7EB] rounded-2xl grid overflow-hidden" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Cell label="Customers paid" value={rwf(t.gross)} note={`Weflexfy ${rwf(viaWeflexfy)} · old LMB ${rwf(oldLmb)}`} />
        <Cell label={`Weflexfy fee (${Number(r.shares.gateway)}%)`} value={rwf(t.gateway)} note="Taken by Weflexfy" />
        <Cell label={`Developer (${Number(r.shares.developer)}%)`} value={rwf(t.developer)} note="Not collected automatically yet" dark />
        <Cell label="Clients keep" value={rwf(t.host)} note={`${Number(r.shares.host)}% of Weflexfy + all LMB`} />
      </section>

      <Card padded={false} title="By client">
        <Table head={["Client", "Customers paid", `Weflexfy ${Number(r.shares.gateway)}%`, `Developer ${Number(r.shares.developer)}%`, "Client keeps"]} minWidth={760}>
          {rows.map(([name, c]) => (
            <tr key={name}>
              <Td first><b>{name}</b><br /><span className="text-xs text-[#5B6472]">{c.items.join(" · ")}</span></Td>
              <Td className="text-right font-semibold tabular-nums">{rwf(c.gross)}</Td>
              <Td className="text-right tabular-nums text-[#374151]">{rwf(c.gateway)}</Td>
              <Td className="text-right tabular-nums font-semibold text-[#0B6B43]">{rwf(c.developer)}</Td>
              <Td last className="text-right tabular-nums">{rwf(c.host)}</Td>
            </tr>
          ))}
        </Table>
        {!rows.length && <Empty>No money in this period.</Empty>}
      </Card>

      <Card padded={false} title="By event and campaign">
        <Table head={["Event or campaign", "Client", "Customers paid", "Weflexfy", "Developer", "Client keeps"]} minWidth={820}>
          {r.items.map((i) => (
            <tr key={`${i.type}-${i.id}`}>
              <Td first><b>{i.title}</b><br /><span className="text-xs text-[#5B6472]">{i.type === "campaign" ? "Voting" : `Tickets · ${i.tickets} sold online`}</span></Td>
              <Td>{i.company}</Td>
              <Td className="text-right font-semibold tabular-nums">{rwf(i.gross)}</Td>
              <Td className="text-right tabular-nums text-[#374151]">{rwf(i.gateway)}</Td>
              <Td className="text-right tabular-nums text-[#0B6B43]">{rwf(i.developer)}</Td>
              <Td last className="text-right tabular-nums">{rwf(i.host)}</Td>
            </tr>
          ))}
        </Table>
        {!r.items.length && <Empty>No money in this period.</Empty>}
      </Card>

      <Card title="By month" actions={<span className="text-[13px] text-[#5B6472]">RWF customers paid</span>}>
        {byMonth.map((m) => (
          <div key={m.from} className="grid items-center gap-3.5" style={{ gridTemplateColumns: "90px minmax(0,1fr) 100px" }}>
            <span className="text-sm text-[#374151]">{m.label}</span>
            <Bar pct={(m.gross / maxMonth) * 100} height={14} color={m.gateway > 0 ? "#F39C12" : "#08283B"} />
            <span className="text-sm font-semibold text-right tabular-nums">{rwf(m.gross)}</span>
          </div>
        ))}
        <div className="flex gap-4 text-xs text-[#5B6472]">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#F39C12]" />Through Weflexfy</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#08283B]" />Old LMB only</span>
        </div>
      </Card>

    </Page>
  );
}

function Cell({ label, value, note, dark }: { label: string; value: string; note: string; dark?: boolean }) {
  return (
    <div className={`p-[22px] flex flex-col gap-1.5 border-r border-[#F1F2F4] ${dark ? "bg-[#08283B] text-white" : ""}`}>
      <span className={`text-[13px] ${dark ? "text-[#C9D4DC]" : "text-[#5B6472]"}`}>{label}</span>
      <span className={`font-heading text-[28px] font-bold tabular-nums ${dark ? "text-[#6EE7B7]" : "text-[#08283B]"}`}>{value}</span>
      <span className={`text-xs ${dark ? "text-[#C9D4DC]" : "text-[#5B6472]"}`}>{note}</span>
    </div>
  );
}
