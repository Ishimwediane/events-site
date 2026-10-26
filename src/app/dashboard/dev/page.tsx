"use client";

import { api } from "@/platform/lib/api";
import { RoleGate } from "@/platform/v2/Shell";
import { methodLabel, num, rwf } from "@/platform/v2/format";
import { Bar, Card, Empty, ErrorNote, Loading, NotBuilt, Page, Stat, StatGrid, Table, Td } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

type Earnings = {
  shares: { gateway: string; developer: string; host: string };
  totals: { gross: string; developer: string };
  payments: number;
  collected: string;
  by_client: { title: string; type: string; client: string; gross: string; developer: string; transactions: number }[];
  by_method: Record<string, { paid: string; developer: string }>;
  by_day: { date: string; developer: string }[];
};

const shortDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Earnings() {
  // "Last 7 days" is fixed when the data arrives, not on every render.
  const { data, error, loading } = useLoad<Earnings & { weekAgo: string }>(() =>
    api.get("/dashboard/developer/").then((r) => ({ ...r.data, weekAgo: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10) })),
  );

  if (loading) return <Loading />;
  if (error || !data) return <Page title="My earnings"><ErrorNote>{error || "No data."}</ErrorNote></Page>;

  const pct = Number(data.shares.developer);
  const earned = Number(data.totals.developer);
  const collected = Number(data.collected);
  const week = data.by_day.filter((d) => d.date > data.weekAgo).reduce((s, d) => s + Number(d.developer), 0);
  const days = data.by_day.slice(-14);
  const maxDay = Math.max(1, ...days.map((d) => Number(d.developer)));
  const best = data.by_day.reduce<{ date: string; developer: string } | null>(
    (b, d) => (!b || Number(d.developer) > Number(b.developer) ? d : b), null,
  );
  const methods = Object.entries(data.by_method).filter(([, m]) => Number(m.paid) > 0)
    .sort((a, b) => Number(b[1].developer) - Number(a[1].developer));
  const maxMethod = Math.max(1, ...methods.map(([, m]) => Number(m.developer)));
  const weflexfyGross = Object.values(data.by_method).reduce((s, m) => s + Number(m.paid), 0);

  return (
    <Page title="My earnings" subtitle={`${pct}% of every payment that goes through the platform with Weflexfy.`}>
      <StatGrid min={220}>
        <Stat dark label="Earned, all time" value={rwf(earned)} unit="RWF" note={`${pct}% of ${rwf(weflexfyGross)} RWF · ${num(data.payments)} payments`} />
        <Stat label="Last 7 days" value={rwf(week)} unit="RWF" />
        <Stat label="Received so far" value={rwf(collected)} unit="RWF" note={collected ? undefined : "Nothing collected yet"} />
        <Stat label="Still to collect" value={rwf(earned - collected)} unit="RWF" tone="amber" note="Held by clients until paid to you" />
      </StatGrid>

      <Card title={`My ${pct}% per day`} actions={<span className="text-[13px] text-[#5B6472]">RWF · last {days.length} days with payments</span>}>
        {days.length === 0 ? (
          <Empty>No payments in the last 30 days.</Empty>
        ) : (
          <>
            <div className="flex items-end gap-3 h-[220px] border-b border-[#E5E7EB]">
              {days.map((d, i) => {
                const v = Number(d.developer);
                return (
                  <div key={d.date} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5 h-full">
                    <span className="text-xs font-semibold text-[#08283B] tabular-nums">{rwf(v)}</span>
                    <div
                      className="w-full max-w-12 rounded-t-lg"
                      style={{ height: `${Math.max(4, Math.round((v / maxDay) * 170))}px`, background: i === days.length - 1 ? "#F39C12" : "#08283B" }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              {days.map((d) => <span key={d.date} className="flex-1 min-w-0 text-center text-xs text-[#5B6472] truncate">{shortDay(d.date)}</span>)}
            </div>
            {best && <p className="m-0 text-[13px] text-[#5B6472]">Biggest day: {shortDay(best.date)}, {rwf(best.developer)} RWF.</p>}
          </>
        )}
      </Card>

      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Card title="By client" padded={false}>
          <Table head={["Client", "Customers paid", `My ${pct}%`]} minWidth={420}>
            {data.by_client.map((c) => (
              <tr key={`${c.type}-${c.title}`}>
                <Td first>
                  <b>{c.client}</b>
                  <br />
                  <span className="text-xs text-[#5B6472]">{c.type === "campaign" ? "Voting" : "Tickets"} · {c.title} · {num(c.transactions)} payments</span>
                </Td>
                <Td className="text-right tabular-nums">{rwf(c.gross)}</Td>
                <Td last className="text-right tabular-nums font-bold text-[#0B6B43]">{rwf(c.developer)}</Td>
              </tr>
            ))}
          </Table>
          {data.by_client.length === 0 && <Empty>No earnings yet.</Empty>}
        </Card>

        <Card title="How customers paid">
          {methods.length === 0 && <Empty>No payments yet.</Empty>}
          {methods.map(([m, v]) => (
            <div key={m} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-sm">
                <span><b>{methodLabel[m] ?? m}</b> <span className="text-[#5B6472]">· {rwf(v.paid)} paid</span></span>
                <span className="font-bold text-[#0B6B43] tabular-nums">{rwf(v.developer)} RWF</span>
              </div>
              <Bar pct={(Number(v.developer) / maxMethod) * 100} />
            </div>
          ))}
        </Card>
      </div>

      <Card title={`Get my ${pct}% automatically`}>
        <p className="m-0 text-sm text-[#5B6472]">
          Weflexfy can split each payment: {pct}% straight to your MoMo, the rest to the client. Nothing to collect by hand.
        </p>
        <NotBuilt>Weflexfy currently sends 100% to the client&apos;s number. Splitting needs your MoMo number added to the payment set-up on the server.</NotBuilt>
      </Card>
    </Page>
  );
}

export default function DevEarningsPage() {
  return (
    <RoleGate roles={["DEVELOPER"]}>
      <Earnings />
    </RoleGate>
  );
}
