"use client";

import { api } from "@/platform/lib/api";
import { type Overview } from "@/platform/v2/admin/data";
import { methodLabel, rwf, rwfLabel, statusLabel, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Card, Empty, ErrorNote, LinkButton, Loading, Page, Stat, StatGrid, Table, Td, statusTone } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function AdminOverviewPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Overview />
    </RoleGate>
  );
}

function Overview() {
  const { data, error, loading } = useLoad(async () => {
    const overview = await api.get<Overview>("/dashboard/admin/overview/").then((r) => r.data);
    return { overview };
  });

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Platform overview"><ErrorNote>{error}</ErrorNote></Page>;
  const { overview: o } = data;

  return (
    <Page title="Platform overview" subtitle="All organisers, all events and voting, in one place.">
      <StatGrid min={240}>
        <Stat dark label="Money through the platform" value={rwf(o.totals.gross)} unit="RWF" note={`All time · ${o.clients} ${o.clients === 1 ? "organiser" : "organisers"}`} />
        <Stat label={`Developer share (${Number(o.shares.developer)}%)`} value={rwf(o.totals.developer)} unit="RWF" tone="green" note="From Weflexfy payments only" />
        <Stat label={`Weflexfy share (${Number(o.shares.gateway)}%)`} value={rwf(o.totals.gateway)} unit="RWF" note="Weflexfy's fee on its payments" />
      </StatGrid>

      <Card padded={false} title="Live now">
        <Table head={["Voting or event", "Organiser", "Status", ""]} minWidth={640} empty={!o.live.length && <Empty>Nothing is live right now.</Empty>}>
          {o.live.map((l) => (
            <tr key={`${l.type}-${l.id}`}>
              <Td first><b>{l.title}</b><br /><span className="text-xs text-[#5B6472]">{l.type === "campaign" ? "Voting" : "Event"}</span></Td>
              <Td>{l.client}</Td>
              <Td><Badge tone={statusTone(l.status)}>{statusLabel[l.status] ?? l.status}</Badge></Td>
              <Td last className="text-right">
                <LinkButton small href={l.type === "campaign" ? `/dashboard/voting/${l.id}` : `/dashboard/events/${l.id}`}>Open</LinkButton>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card padded={false} title="Latest payments, all organisers" actions={<LinkButton href="/dashboard/admin/history" kind="ghost" small>Full history</LinkButton>}>
        <Table head={["When", "Client", "For", "Paid by", "Amount"]} minWidth={680}>
          {o.latest_payments.map((p) => (
            <tr key={p.ref}>
              <Td first className="text-[#5B6472] whitespace-nowrap tabular-nums">{when(p.date)}</Td>
              <Td>{p.client || "—"}</Td>
              <Td>{p.service === "VOTE" ? "Vote" : "Ticket"}{p.item ? ` · ${p.item}` : ""}<br /><span className="text-xs text-[#5B6472]">{p.title}</span></Td>
              <Td><Badge>{methodLabel[p.method] || p.method}</Badge></Td>
              <Td last className="text-right font-semibold tabular-nums whitespace-nowrap">{rwfLabel(p.amount)}</Td>
            </tr>
          ))}
        </Table>
        {!o.latest_payments.length && <Empty>No payments yet.</Empty>}
      </Card>
    </Page>
  );
}
