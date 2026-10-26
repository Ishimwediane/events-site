"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { brand } from "@/config/site";
import { campaignPath, ussdVote } from "@/lib/slug";
import { api } from "@/platform/lib/api";
import { num, rwf } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Bar, Card, LinkButton, Empty, ErrorNote, Loading, Page, Stat, StatGrid, Table, Td, inputClass } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";
import { CampaignTabs, StatusSelect, allNominees, campaignDates, type Campaign } from "@/platform/v2/voting/shared";

const DAY = 24 * 60 * 60 * 1000;

function Results() {
  const id = useParams().id as string;
  const { data: c, error, loading, reload } = useLoad(
    () => api.get(`/voting/campaigns/${id}/`).then((r) => r.data as Campaign),
    [id],
  );
  const money = useLoad(
    () => api.get("/payments/earnings/", { params: { campaign: id } }).then((r) => r.data?.totals?.gross as string).catch(() => null),
    [id],
  );
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  // "Days left" is worked out once when the page opens.
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => {
    if (!c) return [];
    const q = search.trim().toLowerCase();
    return allNominees(c)
      .filter((n) => category === "all" || n.category === category)
      .filter((n) => !q || n.name.toLowerCase().includes(q))
      .sort((a, b) => b.votes - a.votes);
  }, [c, category, search]);

  if (loading) return <Loading />;
  if (!c) return <Page title="Voting"><ErrorNote>{error || "Campaign not found."}</ErrorNote></Page>;

  const nominees = allNominees(c);
  const totalVotes = nominees.reduce((s, n) => s + (n.votes || 0), 0);
  const top = Math.max(1, ...rows.map((n) => n.votes || 0));
  const opens = new Date(c.start_date).getTime();
  const closes = c.end_date ? new Date(c.end_date).getTime() : null;
  const open = c.status === "PUBLISHED" || c.status === "ONGOING";
  const state = !open
    ? "Voting is closed"
    : now < opens
      ? `Opens in ${Math.ceil((opens - now) / DAY)} days`
      : closes
        ? now < closes ? `${Math.ceil((closes - now) / DAY)} days left to vote` : "Voting has ended"
        : "Voting is open";
  const link = typeof window !== "undefined" ? `${window.location.origin}${campaignPath(c)}` : campaignPath(c);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link stays visible to copy by hand */
    }
  };

  return (
    <Page
      title={c.title}
      subtitle={`${campaignDates(c)} · ${num(c.categories.length)} categories · ${num(nominees.length)} nominees`}
      back={{ href: "/dashboard/voting", label: "Voting" }}
      actions={<StatusSelect campaign={c} onSaved={reload} />}
    >
      <CampaignTabs id={id} active="results" />

      <section className="bg-[#08283B] text-white rounded-2xl p-6 flex flex-wrap gap-6 justify-between items-center">
        <div className="flex flex-col gap-1.5">
          <span className={`inline-flex items-center gap-2 text-[13px] font-semibold ${open ? "text-[#9BE7C1]" : "text-[#C9D4DC]"}`}>
            <span className={`w-2 h-2 rounded-full ${open ? "bg-[#34D399]" : "bg-[#C9D4DC]"}`} />
            {open ? "Open" : "Closed"} · {campaignDates(c)}
          </span>
          <span className="font-heading text-[22px] font-semibold">{state}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#0F3A52] flex flex-col gap-0.5">
            <span className="text-xs text-[#C9D4DC]">Vote by phone</span>
            <span className="font-heading text-lg font-semibold text-[#F7B84B] tabular-nums">{brand.ussdCode}</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-[#0F3A52] flex flex-col gap-0.5 min-w-0 max-w-[340px]">
            <span className="text-xs text-[#C9D4DC]">Vote online</span>
            <span className="text-sm font-semibold truncate">{link.replace(/^https?:\/\/(www\.)?/, "")}</span>
          </div>
          <button type="button" onClick={copy} className="self-center px-4 py-2.5 rounded-[10px] border border-[#3B5B6E] bg-transparent text-white text-sm font-semibold hover:bg-[#0F3A52]">
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </section>

      <StatGrid min={180}>
        <Stat label="Votes cast" value={num(totalVotes)} />
        <Stat label="Money from votes" value={money.data == null ? "…" : rwf(money.data)} unit="RWF" tone="green" />
        <Stat label="Categories" value={num(c.categories.length)} />
        <Stat label="Nominees" value={num(nominees.length)} />
      </StatGrid>

      <Card
        padded={false}
        title="Results"
        actions={
          <div className="flex flex-wrap gap-2.5 items-end">
            <label className="flex flex-col gap-1 text-xs text-[#5B6472]">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} min-w-[220px]`}>
                <option value="all">All categories</option>
                {c.categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[#5B6472]">
              Search
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nominee name" className={`${inputClass} min-w-[200px]`} />
            </label>
          </div>
        }
      >
        <Table head={["#", "Nominee", "Category", "USSD code", "Votes"]} minWidth={760} empty={!rows.length && <Empty>No nominees match.</Empty>}>
          {rows.map((n, i) => (
            <tr key={n.id}>
              <Td first className="text-[#5B6472] font-semibold tabular-nums">{i + 1}</Td>
              <Td className="font-semibold">{n.name}</Td>
              <Td className="text-[#374151]">{n.categoryName}</Td>
              <Td className="text-[#374151] tabular-nums">{ussdVote(brand.ussdCode, n.public_id).steps}</Td>
              <Td last className="w-[240px]">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1"><Bar pct={((n.votes || 0) / top) * 100} /></div>
                  <span className="w-12 text-right font-semibold text-[#08283B] tabular-nums">{num(n.votes)}</span>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Vote packages" actions={<LinkButton small href={`/dashboard/voting/${id}/details`}>Edit prices</LinkButton>}>
        {c.packages.length ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {[...c.packages].sort((a, b) => Number(a.price) - Number(b.price)).map((p) => (
              <div key={p.id} className="border border-[#E5E7EB] rounded-xl p-3.5 flex flex-col gap-1">
                <span className="text-[13px] text-[#5B6472]">{p.name}</span>
                <span className="font-heading text-lg font-semibold text-[#08283B] tabular-nums">{num(p.number_of_votes)} {p.number_of_votes === 1 ? "vote" : "votes"}</span>
                <span className="text-[13px] text-[#374151] tabular-nums">{rwf(p.price)} RWF</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="m-0 text-sm text-[#5B6472]">No packages yet. Voters cannot pay until you add at least one.</p>
        )}
      </Card>
    </Page>
  );
}

export default function CampaignResultsPage() {
  return (
    <RoleGate roles={["COMPANY", "ADMIN"]}>
      <Results />
    </RoleGate>
  );
}
