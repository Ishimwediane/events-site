"use client";

import { api } from "@/platform/lib/api";
import { type Client, type Overview } from "@/platform/v2/admin/data";
import { HealthChecks } from "@/platform/v2/admin/HealthChecks";
import { methodLabel, rwf, rwfLabel, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Card, Empty, ErrorNote, LinkButton, Loading, Page, Stat, StatGrid, Table, Td } from "@/platform/v2/ui";
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
    const [overview, clients] = await Promise.all([
      api.get<Overview>("/dashboard/admin/overview/").then((r) => r.data),
      api.get<{ clients: Client[] }>("/dashboard/admin/clients/").then((r) => r.data.clients),
    ]);
    return { overview, clients };
  });

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Platform overview"><ErrorNote>{error}</ErrorNote></Page>;
  const { overview: o, clients } = data;
  const liveCampaign = o.live.find((l) => l.type === "campaign");

  return (
    <Page
      title="Platform overview"
      subtitle="All clients, all events, in one place."
      actions={<LinkButton href="/dashboard/admin/clients" kind="primary">+ Add client</LinkButton>}
    >
      <StatGrid min={210}>
        <Stat dark label="Money through the platform" value={rwf(o.totals.gross)} unit="RWF" note={`All time · ${o.clients} ${o.clients === 1 ? "client" : "clients"}`} />
        <Stat label={`Developer share (${Number(o.shares.developer)}%)`} value={rwf(o.totals.developer)} unit="RWF" tone="green" note="From Weflexfy payments only" />
        <Stat label="Live right now" value={o.live.length} note={liveCampaign ? `${liveCampaign.client} · ${liveCampaign.title}` : o.live[0]?.title || "Nothing live"} />
        <Stat
          label="Waiting for you"
          value={o.pending_applications}
          tone={o.pending_applications ? "amber" : undefined}
          note={o.pending_applications ? "Sign-ups to approve" : "No sign-ups waiting"}
        />
      </StatGrid>

      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
        <Card padded={false} title="Clients" actions={<LinkButton href="/dashboard/admin/clients" kind="ghost" small>Manage</LinkButton>}>
          <Table head={["Client", "Now", "Money in"]} minWidth={460}>
            {clients.map((c) => (
              <tr key={c.id}>
                <Td first>
                  <b>{c.name}</b>
                  <br />
                  <span className="text-xs text-[#5B6472]">{c.events} {c.events === 1 ? "event" : "events"} · {c.campaigns} voting</span>
                </Td>
                <Td>
                  {!c.is_active ? <Badge tone="red">Paused</Badge> : c.live ? <Badge tone="green">Live</Badge> : <Badge>Quiet</Badge>}
                </Td>
                <Td last className="text-right font-semibold tabular-nums">{rwf(c.gross)}</Td>
              </tr>
            ))}
          </Table>
          {!clients.length && <Empty>No clients yet.</Empty>}
        </Card>

        <Card title="Is everything working?">
          <HealthChecks health={o.health} />
        </Card>
      </div>

      <Card padded={false} title="Latest payments, all clients" actions={<LinkButton href="/dashboard/admin/money" kind="ghost" small>All money</LinkButton>}>
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
