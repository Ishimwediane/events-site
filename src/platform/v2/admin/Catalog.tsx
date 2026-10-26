"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { api } from "@/platform/lib/api";
import { fetchAll, type Earnings } from "@/platform/v2/admin/data";
import { day, errorText, num, rwfLabel, statusLabel } from "@/platform/v2/format";
import { Button, Card, Empty, ErrorNote, Field, inputClass, LinkButton, Loading, Page, Table, Td } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

type Campaign = {
  id: string; title: string; organizer: string; organizer_name: string; status: string;
  start_date: string | null; end_date: string | null; category_count: number; nominee_count: number;
};
type TicketType = { quantity: number; remaining: number };
type EventRow = {
  id: string; title: string; organizer: string; organizer_name: string; status: string;
  start_date: string; location: string; ticket_types: TicketType[];
};
type Company = { id: string; name: string };

const STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "FINISHED", "CANCELLED"];

/** One admin list: every client's voting campaigns, or every client's events. */
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

  return (
    <Page
      title={title}
      subtitle={voting ? "Every client's voting campaigns. Open one to manage it exactly as the client would." : "Every client's events and tickets. Open one to manage it exactly as the client would."}
      actions={
        <>
          <Field label="Client">
            <select className={inputClass} value={client} onChange={(e) => setClient(e.target.value)}>
              <option value="">All clients</option>
              {data.companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </Field>
          {voting && <LinkButton href={`/dashboard/voting/new${forCompany ? `?organizer=${forCompany.id}` : ""}`} kind="primary">+ Campaign for a client</LinkButton>}
        </>
      }
    >
      {actionError && <ErrorNote>{actionError}</ErrorNote>}

      {voting && <Card padded={false} title="Voting campaigns">
        <Table head={["Campaign", "Client", "Dates", "Money in", "Status", "Action"]} minWidth={940}>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <Td first><b>{c.title}</b><br /><span className="text-xs text-[#5B6472]">{num(c.category_count)} categories · {num(c.nominee_count)} nominees</span></Td>
              <Td>{c.organizer_name}</Td>
              <Td className="text-[#374151] whitespace-nowrap">{c.start_date ? day(c.start_date) : "—"}{c.end_date ? ` – ${day(c.end_date)}` : ""}</Td>
              <Td className="text-right font-semibold tabular-nums whitespace-nowrap">{rwfLabel(data.money[`campaign:${c.id}`] || 0)}</Td>
              <Td>{statusSelect(c.status, (s) => act(`c-${c.id}`, () => api.patch(`/voting/campaigns/${c.id}/`, { status: s })), `c-${c.id}`)}</Td>
              <Td last className="text-right whitespace-nowrap">
                <span className="inline-flex gap-1.5">
                  <LinkButton href={`/dashboard/voting/${c.id}`} small>Open</LinkButton>
                  <LinkButton href={`/dashboard/voting/${c.id}/log`} small>Votes</LinkButton>
                  <Button
                    kind="danger"
                    small
                    busy={busy === `dc-${c.id}`}
                    onClick={() => {
                      if (!window.confirm(`Delete "${c.title}" with all its categories, nominees and votes? This cannot be undone.`)) return;
                      act(`dc-${c.id}`, () => api.delete(`/voting/campaigns/${c.id}/`));
                    }}
                  >
                    Delete
                  </Button>
                </span>
              </Td>
            </tr>
          ))}
        </Table>
        {!campaigns.length && <Empty>No campaigns match.</Empty>}
      </Card>}

      {!voting && <Card padded={false} title="Events with tickets">
        <Table head={["Event", "Client", "Date", "Tickets out", "Status", "Action"]} minWidth={940}>
          {events.map((e) => {
            const out = e.ticket_types.reduce((s, t) => s + (t.quantity - t.remaining), 0);
            const cap = e.ticket_types.reduce((s, t) => s + t.quantity, 0);
            return (
              <tr key={e.id}>
                <Td first><b>{e.title}</b><br /><span className="text-xs text-[#5B6472]">{e.location}</span></Td>
                <Td>{e.organizer_name}</Td>
                <Td className="text-[#374151] whitespace-nowrap">{day(e.start_date)}</Td>
                <Td className="text-right font-semibold tabular-nums whitespace-nowrap">{num(out)} of {num(cap)}<br /><span className="text-xs font-normal text-[#5B6472]">{rwfLabel(data.money[`event:${e.id}`] || 0)} online</span></Td>
                <Td>{statusSelect(e.status, (s) => act(`e-${e.id}`, () => api.patch(`/events/${e.id}/`, { status: s })), `e-${e.id}`)}</Td>
                <Td last className="text-right whitespace-nowrap">
                  <span className="inline-flex gap-1.5">
                    <LinkButton href={`/dashboard/events/${e.id}`} small>Open</LinkButton>
                    <Button
                      kind="danger"
                      small
                      busy={busy === `de-${e.id}`}
                      onClick={() => {
                        if (!window.confirm(`Delete "${e.title}" with its ticket types and tickets? This cannot be undone.`)) return;
                        act(`de-${e.id}`, () => api.delete(`/events/${e.id}/`));
                      }}
                    >
                      Delete
                    </Button>
                  </span>
                </Td>
              </tr>
            );
          })}
        </Table>
        {!events.length && <Empty>No events match.</Empty>}
      </Card>}
    </Page>
  );
}
