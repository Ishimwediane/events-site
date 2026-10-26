"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { api } from "@/platform/lib/api";
import { downloadCsv, num, rwf, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Button, Card, Empty, ErrorNote, Loading, Page, Stat, StatGrid, Table, Td, inputClass } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";
import VotesModal from "@/platform/v2/voting/VotesModal";
import { CampaignTabs, StatusSelect, allNominees, campaignDates, fetchAll, type Campaign } from "@/platform/v2/voting/shared";

type Paid = {
  id: string; nominee: string; nominee_name: string; package: string | null; amount_paid: string;
  votes_cast: number; payment_status: string; created_at: string;
};
type Manual = {
  id: string; nominee: string; nominee_name: string; adjusted_by_email?: string | null; votes_added: number;
  reason: string; created_at: string;
};
type Row = { id: string; date: string; nominee: string; votes: number; kind: "paid" | "hand"; note: string; amount: number };

function VoteLog() {
  const id = useParams().id as string;
  const campaign = useLoad(() => api.get(`/voting/campaigns/${id}/`).then((r) => r.data as Campaign), [id]);
  const log = useLoad(
    async () => {
      const [paid, manual] = await Promise.all([
        fetchAll<Paid>("/voting/vote-transactions/", { campaign: id }),
        fetchAll<Manual>("/voting/manual-adjustments/", { campaign: id }),
      ]);
      return { paid: paid.filter((p) => p.payment_status === "SUCCESS"), manual };
    },
    [id],
  );
  const [show, setShow] = useState<"all" | "paid" | "hand">("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);

  const c = campaign.data;
  const packages = useMemo(() => new Map((c?.packages ?? []).map((p) => [p.id, p.name])), [c]);
  const rows: Row[] = useMemo(() => {
    if (!log.data) return [];
    const paid: Row[] = log.data.paid.map((p) => ({
      id: p.id, date: p.created_at, nominee: p.nominee_name, votes: p.votes_cast, kind: "paid", amount: Number(p.amount_paid),
      note: `${(p.package && packages.get(p.package)) || "Package"} · ${rwf(p.amount_paid)} RWF`,
    }));
    const hand: Row[] = log.data.manual.map((m) => ({
      id: m.id, date: m.created_at, nominee: m.nominee_name, votes: m.votes_added, kind: "hand", amount: 0,
      note: `${m.reason}${m.adjusted_by_email ? ` · by ${m.adjusted_by_email}` : ""}`,
    }));
    return [...paid, ...hand].sort((a, b) => b.date.localeCompare(a.date));
  }, [log.data, packages]);

  const shown = rows
    .filter((r) => show === "all" || r.kind === show)
    .filter((r) => !search.trim() || r.nominee.toLowerCase().includes(search.trim().toLowerCase()));

  if (campaign.loading || log.loading) return <Loading />;
  if (!c) return <Page title="Voting"><ErrorNote>{campaign.error || "Campaign not found."}</ErrorNote></Page>;

  const paidRows = rows.filter((r) => r.kind === "paid");
  const handRows = rows.filter((r) => r.kind === "hand");
  const reload = () => { log.reload(); campaign.reload(); };

  return (
    <Page
      title={c.title}
      subtitle={`${campaignDates(c)} · Every vote: paid by MoMo, card or USSD, or added by hand.`}
      back={{ href: "/dashboard/voting", label: "Voting" }}
      actions={<StatusSelect campaign={c} onSaved={campaign.reload} />}
    >
      <CampaignTabs id={id} active="log" />
      {log.error && <ErrorNote>{log.error}</ErrorNote>}

      <StatGrid>
        <Stat dark label="Paid votes" value={rwf(paidRows.reduce((s, r) => s + r.amount, 0))} unit="RWF" note={`${num(paidRows.length)} payments · ${num(paidRows.reduce((s, r) => s + r.votes, 0))} votes`} />
        <Stat label="Added by hand" value={`${handRows.reduce((s, r) => s + r.votes, 0) >= 0 ? "+" : ""}${num(handRows.reduce((s, r) => s + r.votes, 0))}`} note={`${num(handRows.length)} changes`} />
        <Stat label="Votes now" value={num(allNominees(c).reduce((s, n) => s + (n.votes || 0), 0))} note="Paid and by hand together" />
      </StatGrid>

      <Card
        padded={false}
        title="Vote log"
        actions={
          <>
            <Button
              onClick={() => downloadCsv(`vote-log-${c.title}.csv`, ["Date", "Nominee", "Votes", "How", "Package or reason"],
                shown.map((r) => [when(r.date), r.nominee, r.votes, r.kind === "paid" ? "Paid" : "By hand", r.note]))}
            >
              Download CSV
            </Button>
            <Button kind="primary" onClick={() => setModal(true)}>± Votes by hand</Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2.5 px-[22px] items-end">
          <label className="flex flex-col gap-1 text-xs text-[#5B6472]">
            Show
            <select value={show} onChange={(e) => setShow(e.target.value as typeof show)} className={inputClass}>
              <option value="all">All votes</option>
              <option value="paid">Paid</option>
              <option value="hand">Added by hand</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#5B6472]">
            Nominee
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Any nominee" className={inputClass} />
          </label>
        </div>
        <Table head={["When", "Nominee", "Votes", "How", "Package or reason"]} minWidth={720} empty={!shown.length && <Empty>No votes yet.</Empty>}>
          {shown.map((r) => (
            <tr key={`${r.kind}-${r.id}`}>
              <Td first className="text-[#5B6472] whitespace-nowrap tabular-nums">{when(r.date)}</Td>
              <Td className="font-semibold">{r.nominee}</Td>
              <Td className="font-bold text-[#08283B] tabular-nums">{r.votes > 0 ? "+" : ""}{num(r.votes)}</Td>
              <Td>{r.kind === "paid" ? <Badge tone="green">Paid</Badge> : <Badge tone="amber">By hand</Badge>}</Td>
              <Td last className="text-[#374151]">{r.note}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <VotesModal open={modal} nominees={allNominees(c)} onClose={() => setModal(false)} onSaved={reload} />
    </Page>
  );
}

export default function VoteLogPage() {
  return (
    <RoleGate roles={["COMPANY", "ADMIN"]}>
      <VoteLog />
    </RoleGate>
  );
}
