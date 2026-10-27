"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { api } from "@/platform/lib/api";
import { getImageUrl } from "@/platform/lib/images";
import { fetchAll, type Earnings } from "@/platform/v2/admin/data";
import { day, errorText, num, rwfLabel, statusLabel } from "@/platform/v2/format";
import { Badge, Button, Card, ErrorNote, Field, inputClass, LinkButton, Loading, Page, statusTone } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

type Campaign = {
  id: string; title: string; organizer: string; organizer_name: string; status: string; cover_image?: string | null;
  start_date: string | null; end_date: string | null; category_count: number; nominee_count: number;
};
type TicketType = { quantity: number; remaining: number };
type EventRow = {
  id: string; title: string; organizer: string; organizer_name: string; status: string; flyer?: string | null;
  start_date: string; location: string; tickets?: TicketType[];
};
type Company = { id: string; name: string };

const STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "FINISHED", "CANCELLED"];

/** One card: picture, title and status, details, then the admin's controls. */
function ItemCard({ href, image, title, status, organiser, children, controls }: {
  href: string; image?: string | null; title: string; status: string; organiser: string; children: ReactNode; controls: ReactNode;
}) {
  return (
    <article className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <Link href={href} className="no-underline flex flex-col flex-1">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getImageUrl(image)} alt="" className="h-36 w-full object-cover" />
        ) : (
          <div className="h-36 bg-[#0F3A52]" />
        )}
        <div className="p-5 pb-3 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="m-0 font-heading text-base font-semibold text-[#08283B]">{title}</h2>
            <Badge tone={statusTone(status)}>{statusLabel[status] ?? status}</Badge>
          </div>
          <span className="text-xs text-[#5B6472]">{organiser}</span>
          {children}
        </div>
      </Link>
      <div className="mt-auto px-5 pb-5 pt-2 flex flex-wrap items-center gap-2">{controls}</div>
    </article>
  );
}

/** One admin list: every organiser's voting campaigns, or every organiser's events. */
export function Catalog({ show }: { show: "voting" | "events" }) {
  const voting = show === "voting";
  const { data, error, loading, reload } = useLoad(async () => {
    const [campaigns, events, companies, earnings] = await Promise.all([
      voting ? fetchAll<Campaign>("/voting/campaigns/admin_all/?page_size=100") : Promise.resolve([] as Campaign[]),
      voting ? Promise.resolve([] as EventRow[]) : fetchAll<EventRow>("/events/?page_size=100"),
      fetchAll<Company>("/companies/list/"),
      api.get<Earnings>("/payments/earnings/").then((r) => r.data),
    ]);
    const money: Record<string, string> = {};
    for (const i of earnings.items) money[`${i.type}:${i.id}`] = i.gross;
    return { campaigns, events, companies, money };
  }, [show]);
  const [client, setClient] = useState(useSearchParams().get("client") || "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setActionError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setActionError(errorText(e));
    } finally {
      setBusy("");
    }
  };

  const title = voting ? "Voting" : "Events";
  if (loading) return <Loading />;
  if (error || !data) return <Page title={title}><ErrorNote>{error}</ErrorNote></Page>;

  const keep = (organizer: string, s: string) => (!client || organizer === client) && (!status || s === status);
  const campaigns = data.campaigns.filter((c) => keep(c.organizer_name, c.status));
  const events = data.events.filter((e) => keep(e.organizer_name, e.status));
  const forCompany = data.companies.find((c) => c.name === client);

  const statusSelect = (value: string, onChange: (s: string) => void, key: string) => (
    <select
      aria-label="Status"
      value={value}
      disabled={busy === key}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[13px] font-semibold"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
    </select>
  );

  const remove = (key: string, what: string, url: string) => (
    <Button
      kind="danger"
      small
      busy={busy === key}
      onClick={() => {
        if (!window.confirm(`Delete "${what}"? Everything in it is deleted too. This cannot be undone.`)) return;
        act(key, () => api.delete(url));
      }}
    >
      Delete
    </Button>
  );

  const empty = (voting ? campaigns : events).length === 0;

  return (
    <Page
      title={title}
      subtitle={voting ? "Every organiser's voting campaigns. Open one to manage it." : "Every organiser's events and tickets. Open one to manage it."}
      actions={
        <>
          <Field label="Organiser">
            <select className={inputClass} value={client} onChange={(e) => setClient(e.target.value)}>
              <option value="">All organisers</option>
              {data.companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </Field>
          {voting && <LinkButton href={`/dashboard/voting/new${forCompany ? `?organizer=${forCompany.id}` : ""}`} kind="primary">+ Campaign for an organiser</LinkButton>}
        </>
      }
    >
      {actionError && <ErrorNote>{actionError}</ErrorNote>}
      {empty && <Card><p className="m-0 text-sm text-[#5B6472]">Nothing matches.</p></Card>}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {voting && campaigns.map((c) => (
          <ItemCard
            key={c.id}
            href={`/dashboard/voting/${c.id}`}
            image={c.cover_image}
            title={c.title}
            status={c.status}
            organiser={c.organizer_name}
            controls={<>{statusSelect(c.status, (s) => act(`c-${c.id}`, () => api.patch(`/voting/campaigns/${c.id}/`, { status: s })), `c-${c.id}`)}{remove(`dc-${c.id}`, c.title, `/voting/campaigns/${c.id}/`)}</>}
          >
            <span className="text-[13px] text-[#5B6472]">{c.start_date ? day(c.start_date) : "—"}{c.end_date ? ` – ${day(c.end_date)}` : ""}</span>
            <span className="text-[13px] text-[#374151]">{num(c.category_count)} categories · {num(c.nominee_count)} nominees</span>
            <span className="text-[13px] font-semibold text-[#08283B]">{rwfLabel(data.money[`campaign:${c.id}`] || 0)} in</span>
          </ItemCard>
        ))}

        {!voting && events.map((e) => {
          const tiers = e.tickets ?? [];
          const out = tiers.reduce((s, t) => s + (t.quantity - t.remaining), 0);
          const cap = tiers.reduce((s, t) => s + t.quantity, 0);
          return (
            <ItemCard
              key={e.id}
              href={`/dashboard/events/${e.id}`}
              image={e.flyer}
              title={e.title}
              status={e.status}
              organiser={e.organizer_name}
              controls={<>{statusSelect(e.status, (s) => act(`e-${e.id}`, () => api.patch(`/events/${e.id}/`, { status: s })), `e-${e.id}`)}{remove(`de-${e.id}`, e.title, `/events/${e.id}/`)}</>}
            >
              <span className="text-[13px] text-[#5B6472]">{day(e.start_date)}{e.location ? ` · ${e.location}` : ""}</span>
              <span className="text-[13px] text-[#374151]">{num(out)} of {num(cap)} tickets out</span>
              <span className="text-[13px] font-semibold text-[#08283B]">{rwfLabel(data.money[`event:${e.id}`] || 0)} online</span>
            </ItemCard>
          );
        })}
      </div>
    </Page>
  );
}
