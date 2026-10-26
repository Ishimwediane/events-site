"use client";

import { ScanLine, Ticket } from "lucide-react";

import { api } from "@/platform/lib/api";
import { day, rwfLabel, statusLabel } from "@/platform/v2/format";
import { tierCounts, type EventItem } from "@/platform/v2/org/types";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Card, Empty, ErrorNote, LinkButton, Loading, Page, Table, Td, statusTone } from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";

function EventCard({ event }: { event: EventItem }) {
  const tiers = event.tickets ?? [];
  const online = tiers.reduce((s, t) => s + tierCounts(t).paid * Number(t.price), 0);
  const out = tiers.reduce((s, t) => s + tierCounts(t).out, 0);
  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-[22px]">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold text-[#111827]">{event.title}</h3>
          <span className="text-[13px] text-[#5B6472]">
            {day(event.start_date)} · <Badge tone={statusTone(event.status)}>{statusLabel[event.status] ?? event.status}</Badge>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-[13px] text-[#5B6472]">
          <span>Sold online <b className="text-[15px] text-[#0B6B43] tabular-nums">{rwfLabel(online)}</b></span>
          <span>Tickets out <b className="text-[15px] text-[#08283B] tabular-nums">{out}</b></span>
          <LinkButton small kind="dark" href={`/dashboard/events/${event.id}`}>Manage event</LinkButton>
        </div>
      </div>
      <Table head={["Ticket type", "Price", "Paid online", "Printed / door", "Left"]} minWidth={600} empty={tiers.length === 0 && <Empty>No ticket types yet.</Empty>}>
        {tiers.map((t) => {
          const c = tierCounts(t);
          return (
            <tr key={t.id}>
              <Td first className="font-semibold">{t.name}</Td>
              <Td className="tabular-nums">{Number(t.price) ? rwfLabel(t.price) : "Free"}</Td>
              <Td className="tabular-nums">{c.paid}</Td>
              <Td className="tabular-nums">{c.printed}</Td>
              <Td last className="text-right text-[#5B6472] tabular-nums">{c.left} of {t.quantity}</Td>
            </tr>
          );
        })}
      </Table>
    </Card>
  );
}

function Tickets() {
  const { data, error, loading } = useLoad(() => api.get("/events/mine/").then((r) => listOf<EventItem>(r.data)));
  if (loading) return <Loading />;
  const events = data ?? [];
  const current = events.filter((e) => e.status !== "FINISHED" && e.status !== "CANCELLED");
  const past = events.filter((e) => e.status === "FINISHED" || e.status === "CANCELLED");

  return (
    <Page
      title="Tickets"
      subtitle="Sell tickets online and check them in at the door."
      actions={
        <>
          <LinkButton href="/dashboard/checkins"><ScanLine className="w-4 h-4" /> Scan at the door</LinkButton>
          <LinkButton kind="primary" href="/dashboard/events/new">+ New event</LinkButton>
        </>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}

      {current.length === 0 ? (
        <section className="bg-white border border-dashed border-[#C7CDD4] rounded-2xl p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[14px] bg-[#FEF3E2] text-[#B86E00] flex items-center justify-center"><Ticket className="w-6 h-6" /></div>
            <div>
              <h2 className="m-0 font-heading text-xl text-[#08283B]">No tickets on sale right now</h2>
              <p className="mt-1.5 mb-0 text-sm text-[#5B6472] max-w-[520px]">
                Add your next event, set ticket types (Regular, VIP, Table) and their prices. Buyers pay by MoMo and get a QR ticket by email.
              </p>
            </div>
          </div>
          <LinkButton kind="dark" href="/dashboard/events/new">Set up an event</LinkButton>
        </section>
      ) : (
        <section className="flex flex-col gap-3.5">
          <h2 className="m-0 font-heading text-lg font-semibold text-[#08283B]">Current events</h2>
          {current.map((e) => <EventCard key={e.id} event={e} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <h2 className="m-0 font-heading text-lg font-semibold text-[#08283B]">Past events</h2>
          {past.map((e) => <EventCard key={e.id} event={e} />)}
        </section>
      )}
    </Page>
  );
}

export default function TicketsPage() {
  return <RoleGate roles={["COMPANY"]}><Tickets /></RoleGate>;
}
