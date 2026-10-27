"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { campaignPath } from "@/lib/slug";
import { api } from "@/platform/lib/api";
import { day, methodLabel, rwf, rwfLabel, when } from "@/platform/v2/format";
import { isLive, type Campaign, type Earnings } from "@/platform/v2/org/types";
import { useSession } from "@/platform/v2/Shell";
import { Badge, Bar, Card, Empty, ErrorNote, LinkButton, Loading, Page, Stat, StatGrid, Table, Td } from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";

/** The last seven days, oldest first, as YYYY-MM-DD in Kigali. */
const lastWeek = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toLocaleDateString("en-CA", { timeZone: "Africa/Kigali" });
  });

function Overview() {
  const { company } = useSession();
  const { data, error, loading } = useLoad(async () => {
    const days = lastWeek();
    const [earnings, campaigns, ...daily] = await Promise.all([
      api.get<Earnings>("/payments/earnings/").then((r) => r.data),
      api.get("/voting/campaigns/mine/").then((r) => listOf<Campaign>(r.data)).catch(() => [] as Campaign[]),
      ...days.map((d) => api.get<Earnings>(`/payments/earnings/?from=${d}&to=${d}`).then((r) => Number(r.data.totals.gross))),
    ]);
    // The campaign list carries no nominees; load the full live campaign for votes and leaders.
    const pick = campaigns.find((c) => isLive(c.status)) ?? campaigns[0];
    const full = pick
      ? await api.get<Campaign>(`/voting/campaigns/${pick.id}/`).then((r) => r.data).catch(() => pick)
      : undefined;
    return {
      earnings,
      campaigns: full ? campaigns.map((c) => (c.id === full.id ? full : c)) : campaigns,
      days: days.map((d, i) => ({ date: d, gross: daily[i] as number })),
    };
  });

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Overview"><ErrorNote>{error}</ErrorNote></Page>;

  const { earnings, campaigns, days } = data;
  const live = campaigns.find((c) => isLive(c.status)) ?? campaigns[0];
  const nominees = (live?.categories ?? []).flatMap((c) => c.nominees.map((n) => ({ ...n, category: c.name })));
  const votes = nominees.reduce((s, n) => s + (n.votes || 0), 0);
  const handVotes = nominees.reduce((s, n) => s + (n.manual_votes || 0), 0);
  const leaders = [...nominees].sort((a, b) => b.votes - a.votes).slice(0, 5);
  const top = Math.max(1, leaders[0]?.votes ?? 1);
  const maxDay = Math.max(1, ...days.map((d) => d.gross));
  const greet = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <Page
      title={`${greet}, ${company?.name ?? ""}`}
      subtitle="Here is how your events and voting are doing."
      actions={
        live && (
          <>
            <Badge tone={isLive(live.status) ? "green" : "gray"}>
              {isLive(live.status) ? "Voting open" : "Voting closed"}
              {live.end_date ? ` · closes ${day(live.end_date)}` : ""}
            </Badge>
            <a
              href={campaignPath(live)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2.5 rounded-[10px] bg-[#08283B] text-white text-sm font-semibold no-underline hover:bg-[#0F3A52]"
            >
              Open public page
            </a>
          </>
        )
      }
    >
      <StatGrid min={220}>
        <Stat dark label="Money received" value={rwf(earnings.totals.gross)} unit="RWF" note={`${earnings.totals.transactions} payments`} />
        <Stat
          label="Your revenue"
          value={rwf(earnings.totals.organiser)}
          unit="RWF"
          tone="green"
          note={`Your ${earnings.shares.organiser}% · Ozone team ${rwfLabel(earnings.totals.ozone_team)}`}
        />
        <Stat label="Votes cast" value={votes.toLocaleString("en-GB")} note={live ? `${handVotes.toLocaleString("en-GB")} added by hand` : "No campaign yet"} />
        <Stat label="Tickets sold online" value={earnings.totals.tickets.toLocaleString("en-GB")} />
      </StatGrid>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Card title="Money in, last 7 days" actions={<span className="text-[13px] text-[#5B6472]">RWF</span>}>
          <div className="flex items-end gap-3 h-[200px] pt-2 border-b border-[#E5E7EB]">
            {days.map((d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <span className="text-xs font-semibold text-[#08283B] tabular-nums">{rwf(d.gross)}</span>
                <div
                  className="w-full max-w-[44px] rounded-t-lg"
                  style={{
                    height: `${Math.max(4, Math.round((d.gross / maxDay) * 150))}px`,
                    background: i === days.length - 1 ? "#F39C12" : d.gross ? "#08283B" : "#E5E7EB",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            {days.map((d) => (
              <span key={d.date} className="flex-1 text-center text-xs text-[#5B6472]">
                {new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Leading nominees" actions={live && <LinkButton small kind="ghost" href={`/dashboard/voting/${live.id}`}>See all</LinkButton>}>
          {leaders.length === 0 && <Empty>No votes yet.</Empty>}
          {leaders.map((n) => (
            <div key={n.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate"><b>{n.name}</b> <span className="text-[#5B6472]">· {n.category}</span></span>
                <span className="font-semibold text-[#08283B] tabular-nums">{n.votes.toLocaleString("en-GB")}</span>
              </div>
              <Bar pct={(n.votes / top) * 100} />
            </div>
          ))}
        </Card>
      </div>

      <Card padded={false} title="Latest payments" actions={<LinkButton small kind="ghost" href="/dashboard/money">All money</LinkButton>}>
        <Table head={["When", "For", "Paid by", "Amount"]} minWidth={620} empty={earnings.transactions.length === 0 && <Empty>No payments yet.</Empty>}>
          {earnings.transactions.slice(0, 8).map((t) => (
            <tr key={t.ref}>
              <Td first className="text-[#5B6472] whitespace-nowrap">{when(t.date)}</Td>
              <Td>{t.service === "VOTE" ? "Vote" : "Ticket"} · {t.title}</Td>
              <Td><Badge>{methodLabel[t.method] ?? t.method}</Badge></Td>
              <Td last className="text-right font-semibold tabular-nums">{rwfLabel(t.gross)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </Page>
  );
}

export default function DashboardHome() {
  const { user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (user.role === "ADMIN") router.replace("/dashboard/admin");
    else if (user.role === "DEVELOPER") router.replace("/dashboard/dev");
  }, [user.role, router]);
  return user.role === "COMPANY" ? <Overview /> : <Loading />;
}
