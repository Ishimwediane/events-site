"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { API_URL, api } from "@/platform/lib/api";
import { getImageUrl } from "@/platform/lib/images";
import { day, downloadCsv, errorText, rwfLabel, statusLabel, when } from "@/platform/v2/format";
import { tierCounts, type EventItem, type TicketTier } from "@/platform/v2/org/types";
import { RoleGate, useSession } from "@/platform/v2/Shell";
import {
  Badge, Bar, Button, Card, Empty, ErrorNote, Field, LinkButton, Loading, Modal, Page, Stat, StatGrid, Table, Td,
  inputClass, statusTone,
} from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";

type Attendee = {
  id: string; ticket_type_name: string; customer_name: string; customer_email: string; purchase_date: string;
  ticket_code: string; is_hard: boolean; email_sent: boolean; email_sent_at: string | null; checked_in_at: string | null;
};

/** "2026-10-26T18:00" for a datetime-local input, in the browser's time. */
const localInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function TierModal({ event, tier, open, onClose, onSaved }: {
  event: EventItem; tier: TicketTier | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(() => ({
    name: tier?.name ?? "", price: tier ? String(Number(tier.price)) : "", quantity: tier ? String(tier.quantity) : "",
    sale_start: localInput(tier?.sale_start ?? new Date().toISOString()), sale_end: localInput(tier?.sale_end ?? event.start_date),
  }));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("event", event.id);
      data.append("name", form.name);
      data.append("price", form.price || "0");
      data.append("quantity", form.quantity);
      data.append("sale_start", new Date(form.sale_start).toISOString());
      data.append("sale_end", new Date(form.sale_end).toISOString());
      if (file) data.append("ticket_template", file);
      const headers = { "Content-Type": "multipart/form-data" };
      if (tier) await api.patch(`/tickets/types/${tier.id}/`, data, { headers });
      else await api.post("/tickets/types/", data, { headers });
      onSaved();
      onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tier ? `Edit ${tier.name}` : "Add a ticket type"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button kind="primary" busy={busy} onClick={save} disabled={!form.name || !form.quantity}>Save ticket type</Button></>}
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field label="Name"><input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. VIP" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (RWF, 0 = free)"><input className={inputClass} inputMode="numeric" value={form.price} onChange={set("price")} /></Field>
        <Field label="How many"><input className={inputClass} inputMode="numeric" value={form.quantity} onChange={set("quantity")} /></Field>
        <Field label="Sale starts"><input type="datetime-local" className={inputClass} value={form.sale_start} onChange={set("sale_start")} /></Field>
        <Field label="Sale ends"><input type="datetime-local" className={inputClass} value={form.sale_end} onChange={set("sale_end")} /></Field>
      </div>
      <Field label="Ticket design (picture printed on the ticket and in the email)" hint={tier?.ticket_template ? "Choosing a new picture replaces the current one." : undefined}>
        <input type="file" accept="image/*" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>
    </Modal>
  );
}

function PrintModal({ tiers, open, onClose, onDone }: { tiers: TicketTier[]; open: boolean; onClose: () => void; onDone: () => void }) {
  const sellable = tiers.filter((t) => t.remaining > 0);
  const [tierId, setTierId] = useState(sellable[0]?.id ?? "");
  const [count, setCount] = useState("50");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState<string[]>([]);
  const tier = tiers.find((t) => t.id === tierId);

  const download = async (ids: string[]) => {
    const res = await api.post("/tickets/list/hard_sheet/", { ticket_ids: ids }, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "door-tickets.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const make = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/tickets/list/generate_hard/", { ticket_type_id: tierId, quantity: Number(count) });
      setLast(res.data.ticket_ids);
      await download(res.data.ticket_ids);
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Print tickets for the door"
      footer={
        <>
          {last.length > 0 && <Button busy={busy} onClick={() => download(last)}>Download this batch again</Button>}
          <Button kind="dark" busy={busy} disabled={!tier || Number(count) < 1 || Number(count) > (tier?.remaining ?? 0)} onClick={make}>Make PDF to print</Button>
        </>
      }
    >
      <p className="m-0 text-[13px] text-[#5B6472]">Makes a PDF of QR tickets to print and sell by hand. Each one is scanned at the door like an online ticket, and uses up a place.</p>
      {error && <ErrorNote>{error}</ErrorNote>}
      {sellable.length === 0 ? (
        <ErrorNote>Every ticket type is sold out.</ErrorNote>
      ) : (
        <>
          <Field label="Ticket type">
            <select className={inputClass} value={tierId} onChange={(e) => setTierId(e.target.value)}>
              {sellable.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.remaining} left</option>)}
            </select>
          </Field>
          <Field label="How many" hint={tier ? `Up to ${tier.remaining}.` : undefined}>
            <input className={inputClass} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
          </Field>
        </>
      )}
    </Modal>
  );
}

function TicketModal({ ticket, onClose, onSent }: { ticket: Attendee | null; onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState(ticket?.customer_email ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  if (!ticket) return null;
  const send = async () => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await api.post("/tickets/list/resend_email/", {
        ticket_code: ticket.ticket_code,
        ...(email.trim() && email.trim() !== ticket.customer_email ? { new_email: email.trim() } : {}),
      });
      setMsg(`Ticket sent to ${email.trim()}.`);
      onSent();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`${ticket.customer_name || "Ticket"} · ${ticket.ticket_type_name}`} footer={<Button kind="primary" busy={busy} onClick={send}>Send ticket again</Button>}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${API_URL}/tickets/list/qr/?code=${encodeURIComponent(ticket.ticket_code)}`} alt={`QR code ${ticket.ticket_code}`} className="w-56 h-56 self-center" />
      <p className="m-0 text-center font-mono text-sm">{ticket.ticket_code}</p>
      <p className="m-0 text-[13px] text-[#5B6472]">
        {ticket.email_sent ? `Emailed ${when(ticket.email_sent_at)}.` : "The email has not been sent yet."}
        {ticket.checked_in_at ? ` Came in ${when(ticket.checked_in_at)}.` : ""}
      </p>
      {error && <ErrorNote>{error}</ErrorNote>}
      {msg && <p className="m-0 text-sm text-[#0B6B43] font-semibold">{msg}</p>}
      <Field label="Email" hint="Fix a wrong address, then send again."><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
    </Modal>
  );
}

function EventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const admin = user.role === "ADMIN";
  const ev = useLoad(() => api.get<EventItem>(`/events/${id}/`).then((r) => r.data), [id]);
  const people = useLoad(() => api.get(`/tickets/list/event_attendees/?event_id=${id}`).then((r) => listOf<Attendee>(r.data).filter((t) => !t.is_hard)), [id]);
  const door = useLoad(() => api.get(`/tickets/gate/stats/?event_id=${id}`).then((r) => r.data as { total: number; checked_in: number }).catch(() => null), [id]);

  const [tierModal, setTierModal] = useState<{ tier: TicketTier | null } | null>(null);
  const [printing, setPrinting] = useState(false);
  const [ticket, setTicket] = useState<Attendee | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (people.data ?? []).filter((t) =>
      !q || [t.customer_name, t.customer_email, t.ticket_code, t.ticket_type_name].some((v) => (v || "").toLowerCase().includes(q)));
  }, [people.data, search]);

  if (ev.loading) return <Loading />;
  if (!ev.data) return <Page title="Event" back={{ href: "/dashboard/tickets", label: "All events" }}><ErrorNote>{ev.error || "Event not found."}</ErrorNote></Page>;
  const event = ev.data;
  const tiers = event.tickets ?? [];
  const online = tiers.reduce((s, t) => s + tierCounts(t).paid * Number(t.price), 0);
  const paid = tiers.reduce((s, t) => s + tierCounts(t).paid, 0);
  const printed = tiers.reduce((s, t) => s + tierCounts(t).printed, 0);
  const out = tiers.reduce((s, t) => s + tierCounts(t).out, 0);
  const capacity = tiers.reduce((s, t) => s + t.quantity, 0);

  const setStatus = async (status: string) => {
    setError("");
    try {
      await api.patch(`/events/${event.id}/`, { status });
      ev.reload();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const removeTier = async (t: TicketTier) => {
    if (!window.confirm(`Delete the ticket type "${t.name}"?`)) return;
    try {
      await api.delete(`/tickets/types/${t.id}/`);
      ev.reload();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const removeEvent = async () => {
    if (!window.confirm(`Delete "${event.title}" with all its ticket types and tickets? This cannot be undone.`)) return;
    try {
      await api.delete(`/events/${event.id}/`);
      router.replace(admin ? "/dashboard/admin/events" : "/dashboard/tickets");
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Page
      back={admin ? { href: "/dashboard/admin/events", label: "All events and voting" } : { href: "/dashboard/tickets", label: "All events" }}
      title={
        <span className="flex items-center gap-4">
          {event.flyer && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getImageUrl(event.flyer)} alt="" className="w-[64px] h-[84px] rounded-xl object-cover shrink-0" />
          )}
          <span>{event.title}</span>
        </span>
      }
      subtitle={`${when(event.start_date)} · ${event.location}${event.category_name ? ` · ${event.category_name}` : ""}`}
      actions={
        <>
          <Field label={<span className="text-xs text-[#5B6472]">Status</span>}>
            <select className={inputClass} value={event.status} onChange={(e) => setStatus(e.target.value)}>
              {["DRAFT", "PUBLISHED", "ONGOING", "FINISHED", "CANCELLED"].map((s) => (
                <option key={s} value={s}>{s === "DRAFT" ? "Draft (hidden)" : s === "PUBLISHED" ? "Published (on sale)" : statusLabel[s]}</option>
              ))}
            </select>
          </Field>
          <LinkButton href={`/dashboard/events/${event.id}/edit`}>Edit event</LinkButton>
        </>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <div><Badge tone={statusTone(event.status)}>{statusLabel[event.status] ?? event.status}</Badge></div>

      <StatGrid>
        <Stat dark label="Sold online" value={rwfLabel(online).replace(" RWF", "")} unit="RWF" note={`${paid} tickets paid by MoMo or card`} />
        <Stat label="Printed tickets" value={printed} note="Sold at the door, not counted as online money" />
        <Stat label="Tickets out" value={out} unit={`of ${capacity}`} note={`${capacity - out} places left`} />
        <Stat label="Came in" value={door.data?.checked_in ?? "–"} note={<a href="/dashboard/checkins" className="font-semibold text-[#08283B]">See door check-ins</a>} />
      </StatGrid>

      <Card
        padded={false}
        title="Ticket types"
        actions={
          <>
            <Button onClick={() => setPrinting(true)} disabled={tiers.length === 0}>Print tickets for the door</Button>
            <Button kind="primary" onClick={() => setTierModal({ tier: null })}>+ Add ticket type</Button>
          </>
        }
      >
        <Table head={["Design", "Type", "Price", "Out of", "On sale", "Action"]} minWidth={860} empty={tiers.length === 0 && <Empty>No ticket types yet. Add one to start selling.</Empty>}>
          {tiers.map((t) => {
            const c = tierCounts(t);
            return (
              <tr key={t.id}>
                <Td first>
                  {t.ticket_template ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(t.ticket_template)} alt="" className="w-[72px] h-10 rounded-md object-cover" />
                  ) : (
                    <span className="inline-flex w-[72px] h-10 items-center justify-center rounded-md border border-dashed border-[#F8D9A8] bg-[#FEF3E2] text-[10px] text-[#8A5300]">No design</span>
                  )}
                </Td>
                <Td className="font-semibold">{t.name}</Td>
                <Td className="tabular-nums">{Number(t.price) ? rwfLabel(t.price) : "Free"}</Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1"><Bar pct={t.quantity ? (c.out / t.quantity) * 100 : 0} /></div>
                    <span className="text-[13px] text-[#374151] whitespace-nowrap tabular-nums">{c.out} of {t.quantity}</span>
                  </div>
                  <span className="text-xs text-[#5B6472]">{c.paid} online · {c.printed} printed</span>
                </Td>
                <Td className="text-[13px] text-[#5B6472]">{day(t.sale_start)} – {day(t.sale_end)}</Td>
                <Td last className="text-right whitespace-nowrap">
                  <Button small onClick={() => setTierModal({ tier: t })}>Edit</Button>
                  {admin && <Button small kind="danger" className="ml-2" onClick={() => removeTier(t)}>Delete</Button>}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card
        padded={false}
        title="Attendees who bought online"
        actions={
          <>
            <input type="search" aria-label="Search attendees" placeholder="Name, email or ticket code" className={`${inputClass} min-w-[240px]`} value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button
              onClick={() =>
                downloadCsv(`${event.slug || "event"}-attendees.csv`, ["Name", "Email", "Ticket", "Code", "Email sent", "Came in", "Bought"],
                  visible.map((t) => [t.customer_name, t.customer_email, t.ticket_type_name, t.ticket_code, t.email_sent ? "yes" : "no", t.checked_in_at ? when(t.checked_in_at) : "", when(t.purchase_date)]))
              }
            >
              Download list
            </Button>
          </>
        }
      >
        {people.error && <div className="px-[22px]"><ErrorNote>{people.error}</ErrorNote></div>}
        <Table head={["Buyer", "Ticket", "Code", "Email", "Came in", "Action"]} minWidth={900} empty={!people.loading && visible.length === 0 && <Empty>No online buyers yet.</Empty>}>
          {visible.map((t) => (
            <tr key={t.id}>
              <Td first><b>{t.customer_name || "—"}</b><br /><span className="text-xs text-[#5B6472]">{t.customer_email}</span></Td>
              <Td>{t.ticket_type_name}</Td>
              <Td className="font-mono text-[13px]">{t.ticket_code}</Td>
              <Td>{t.email_sent ? <Badge tone="green">Sent</Badge> : <Badge tone="red">Not sent</Badge>}</Td>
              <Td className="text-[13px] text-[#374151]">{t.checked_in_at ? `Yes, ${when(t.checked_in_at)}` : "Not yet"}</Td>
              <Td last className="text-right whitespace-nowrap">
                <Button small onClick={() => setTicket(t)}>Show QR</Button>
                <Button small className="ml-2" onClick={() => setTicket(t)}>Send again</Button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      {admin && (
        <section className="bg-[#FFF4F2] border border-[#F3C4BF] rounded-2xl p-[22px] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 font-heading text-lg text-[#912018]">Delete this event</h2>
            <p className="mt-1 mb-0 text-[13px] text-[#3B1210]">Admins only. Removes the event, its ticket types and tickets.</p>
          </div>
          <Button kind="danger" onClick={removeEvent}>Delete event</Button>
        </section>
      )}

      {tierModal && <TierModal key={tierModal.tier?.id ?? "new"} event={event} tier={tierModal.tier} open onClose={() => setTierModal(null)} onSaved={ev.reload} />}
      {printing && <PrintModal tiers={tiers} open onClose={() => setPrinting(false)} onDone={ev.reload} />}
      {ticket && <TicketModal key={ticket.id} ticket={ticket} onClose={() => setTicket(null)} onSent={people.reload} />}
    </Page>
  );
}

export default function EventManagePage() {
  return <RoleGate roles={["COMPANY", "ADMIN"]}><EventPage /></RoleGate>;
}
