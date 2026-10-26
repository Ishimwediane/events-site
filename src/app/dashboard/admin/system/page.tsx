"use client";

import { api } from "@/platform/lib/api";
import type { Health } from "@/platform/v2/admin/data";
import { healthChecks } from "@/platform/v2/admin/HealthChecks";
import { num, rwfLabel, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Button, Card, ErrorNote, Loading, NotBuilt, Page, Stat, StatGrid, Table, Td } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function AdminSystemPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <System />
    </RoleGate>
  );
}

type Issue = { title: string; text: string; who: "Ask Weflexfy" | "Developer" };

function issuesOf(h: Health): Issue[] {
  const out: Issue[] = [];
  if (!h.database || !h.cache) out.push({ title: "The server is not healthy", text: !h.database ? "The database is not answering." : "The cache is not answering.", who: "Developer" });
  if (h.payouts.failed) out.push({ title: `${h.payouts.failed} ${h.payouts.failed === 1 ? "payout" : "payouts"} did not reach the client`, text: "A buyer paid, but Weflexfy could not send the money on (last 30 days).", who: "Ask Weflexfy" });
  if (h.stuck_pending) out.push({ title: `${h.stuck_pending} ${h.stuck_pending === 1 ? "payment" : "payments"} still waiting`, text: "Started over an hour ago and Weflexfy has not said whether they were paid.", who: "Ask Weflexfy" });
  if (h.payouts.fee_failed) out.push({ title: "Weflexfy fee transfers are failing", text: `${h.payouts.fee_failed} in the last 30 days, on Weflexfy's side. Clients still get paid.`, who: "Ask Weflexfy" });
  return out;
}

function System() {
  const { data: h, error, loading, reload } = useLoad(() => api.get<Health>("/dashboard/health/").then((r) => r.data));

  if (loading) return <Loading />;
  if (error || !h) return <Page title="System"><ErrorNote>{error}</ErrorNote></Page>;

  const issues = issuesOf(h);
  const checks = healthChecks(h);

  return (
    <Page
      title="System"
      subtitle="Is everything working for your clients and their buyers?"
      actions={
        <>
          {issues.length ? <Badge tone="amber">Working, {issues.length} {issues.length === 1 ? "thing" : "things"} to look at</Badge> : <Badge tone="green">All good</Badge>}
          <Button onClick={reload}>Check again</Button>
        </>
      }
    >
      <StatGrid min={220}>
        {checks.map((c) => (
          <div key={c.name} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.state === "ok" ? "#10A35C" : c.state === "warn" ? "#F39C12" : "#E02424" }} />
              <span className="text-[13px] text-[#5B6472]">{c.name}</span>
            </div>
            <span className="font-heading text-[22px] font-bold text-[#08283B]">{c.state === "ok" ? "Working" : c.state === "warn" ? "Look at it" : "Problem"}</span>
            <span className="text-xs text-[#5B6472]">{c.note}</span>
          </div>
        ))}
      </StatGrid>

      <StatGrid min={180}>
        <Stat label="Paid, last 7 days" value={num(h.week.SUCCESS)} tone="green" />
        <Stat label="Failed, last 7 days" value={num(h.week.FAILED)} tone={h.week.FAILED ? "red" : undefined} />
        <Stat label="Still waiting" value={num(h.stuck_pending)} tone={h.stuck_pending ? "amber" : undefined} note="Over an hour old" />
        <Stat label="Opened, not paid" value={num(h.week.EXPIRED)} note="Normal: people looked and left" />
      </StatGrid>

      <Card title="To look at">
        {issues.map((i) => (
          <div key={i.title} className="flex flex-wrap justify-between items-center gap-3 p-3.5 border border-[#E5E7EB] rounded-xl">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{i.title}</span>
              <span className="text-[13px] text-[#5B6472]">{i.text}</span>
            </div>
            <Badge tone={i.who === "Developer" ? "blue" : "amber"}>{i.who}</Badge>
          </div>
        ))}
        {!issues.length && <p className="m-0 text-sm text-[#5B6472]">Nothing needs attention.</p>}
      </Card>

      {h.failed_payouts.length > 0 && (
        <Card padded={false} title="Payouts that failed (last 30 days)">
          <Table head={["When", "Payment", "Weflexfy transfer", "Amount"]} minWidth={620}>
            {h.failed_payouts.map((f) => (
              <tr key={f.transfer}>
                <Td first className="text-[#5B6472] whitespace-nowrap">{when(f.date)}</Td>
                <Td className="font-mono text-[13px]">{f.ref}</Td>
                <Td className="font-mono text-[13px]">{f.transfer}</Td>
                <Td last className="text-right font-semibold tabular-nums">{rwfLabel(f.amount)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <NotBuilt>A log of recent changes (who renamed what, payout number changes, deploys).</NotBuilt>
    </Page>
  );
}
