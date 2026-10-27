"use client";

import { api } from "@/platform/lib/api";
import { RoleGate } from "@/platform/v2/Shell";
import { problems, type Health } from "@/platform/v2/dev/health";
import { num, rwf, when } from "@/platform/v2/format";
import { Bar, Button, Card, ErrorNote, Loading, Page, Table, Td } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? "bg-[#10A35C]" : "bg-[#EF4444]"}`} />;
}

function System() {
  const { data: h, error, loading, reload } = useLoad<Health>(() => api.get("/dashboard/health/").then((r) => r.data));

  if (loading) return <Loading />;
  if (error || !h) return <Page title="System health"><ErrorNote>{error || "No data."}</ErrorNote></Page>;

  const issues = problems(h);
  const paid = h.week.SUCCESS;
  const methodMax = Math.max(1, paid, h.week.FAILED, h.stuck_pending);
  const services = [
    { name: "Database", ok: h.database, state: h.database ? "Up" : "Down", note: "Every page and payment" },
    { name: "Cache (Redis)", ok: h.cache, state: h.cache ? "Up" : "Down", note: "Fast vote counts and pages" },
    {
      name: "MoMo and card payments",
      ok: h.payouts.failed === 0 && h.stuck_pending === 0,
      state: paid > 0 ? "Working" : "Quiet",
      note: h.last_payment ? `Last payment ${when(h.last_payment.date)} · ${rwf(h.last_payment.amount)} RWF` : "No payments yet",
    },
    { name: "Payouts to clients (30 days)", ok: h.payouts.failed === 0, state: `${num(h.payouts.sent)} sent`, note: `${num(h.payouts.failed)} failed` },
  ];

  return (
    <Page
      title="System health"
      subtitle={`Server and payments at a glance · checked ${when(new Date().toISOString())}`}
      actions={<Button onClick={reload}>Check again</Button>}
    >
      {issues.length > 0 ? (
        <section className="bg-[#FFF4F2] border border-[#F3C4BF] rounded-2xl px-[22px] py-[18px] flex flex-col gap-2.5">
          <h2 className="m-0 font-heading text-[17px] font-semibold text-[#912018]">Needs attention · {issues.length}</h2>
          {issues.map((i) => (
            <div key={i.title} className="flex flex-wrap justify-between gap-2.5 text-sm text-[#3B1210]">
              <span><b>{i.title}</b> · {i.text}</span>
              <span className="text-[13px] font-semibold text-[#912018]">{i.who}</span>
            </div>
          ))}
        </section>
      ) : (
        <section className="bg-[#E7F6EE] rounded-2xl px-[22px] py-[18px] text-sm font-semibold text-[#0B6B43]">Everything looks fine.</section>
      )}

      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {services.map((s) => (
          <div key={s.name} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2"><Dot ok={s.ok} /><span className="text-[13px] text-[#5B6472]">{s.name}</span></div>
            <span className="font-heading text-[22px] font-bold text-[#08283B]">{s.state}</span>
            <span className="text-xs text-[#5B6472]">{s.note}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
        <Card title="Payments, last 7 days">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#E7F6EE]"><div className="text-xs text-[#0B6B43]">Paid</div><div className="font-heading text-2xl font-bold text-[#0B6B43] tabular-nums">{num(paid)}</div></div>
            <div className="p-3.5 rounded-xl bg-[#FFF4F2]"><div className="text-xs text-[#912018]">Failed</div><div className="font-heading text-2xl font-bold text-[#912018] tabular-nums">{num(h.week.FAILED)}</div></div>
            <div className="p-3.5 rounded-xl bg-[#FEF3E2]"><div className="text-xs text-[#8A5300]">Stuck waiting</div><div className="font-heading text-2xl font-bold text-[#8A5300] tabular-nums">{num(h.stuck_pending)}</div></div>
          </div>
          <p className="m-0 text-[13px] text-[#5B6472]">
            {num(h.week.EXPIRED)} checkouts were opened and left without paying (they expire after an hour). {num(h.week.PENDING)} are pending right now.
          </p>
          {[["Paid", paid, "#08283B"], ["Failed", h.week.FAILED, "#B42318"], ["Stuck", h.stuck_pending, "#F39C12"]].map(([label, n, color]) => (
            <div key={label as string} className="grid items-center gap-3 text-sm" style={{ gridTemplateColumns: "110px minmax(0,1fr) 48px" }}>
              <span>{label}</span>
              <Bar pct={(Number(n) / methodMax) * 100} color={color as string} height={10} />
              <span className="text-right font-semibold tabular-nums">{num(n as number)}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Money moving through Weflexfy (last 30 days)" padded={false}>
        <div className="grid gap-3 px-[22px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="p-3.5 border border-[#E5E7EB] rounded-xl flex flex-col gap-1">
            <span className="text-[13px] text-[#5B6472]">Payouts to clients</span>
            <span className="font-bold text-lg tabular-nums">{num(h.payouts.sent)} sent · <span className={h.payouts.failed ? "text-[#912018]" : ""}>{num(h.payouts.failed)} failed</span></span>
          </div>
          <div className="p-3.5 border border-[#E5E7EB] rounded-xl flex flex-col gap-1">
            <span className="text-[13px] text-[#5B6472]">Weflexfy fee transfers</span>
            <span className="font-bold text-lg tabular-nums">{num(h.payouts.fee_ok)} ok · <span className={h.payouts.fee_failed ? "text-[#8A5300]" : ""}>{num(h.payouts.fee_failed)} failed</span></span>
          </div>
          <div className="p-3.5 border border-[#E5E7EB] rounded-xl flex flex-col gap-1">
            <span className="text-[13px] text-[#5B6472]">Last payment</span>
            <span className="font-bold text-lg tabular-nums">{h.last_payment ? `${when(h.last_payment.date)} · ${rwf(h.last_payment.amount)} RWF` : "None yet"}</span>
          </div>
        </div>
        {h.failed_payouts.length > 0 && (
          <Table head={["When", "Payment", "Weflexfy transfer", "Amount"]} minWidth={560}>
            {h.failed_payouts.map((p) => (
              <tr key={p.transfer}>
                <Td first className="text-[#5B6472] whitespace-nowrap">{when(p.date)}</Td>
                <Td className="font-mono text-[13px]">{p.ref}</Td>
                <Td className="font-mono text-[13px]">{p.transfer}</Td>
                <Td last className="text-right tabular-nums font-semibold">{rwf(p.amount)} RWF</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}

export default function DevSystemPage() {
  return (
    <RoleGate roles={["DEVELOPER"]}>
      <System />
    </RoleGate>
  );
}
