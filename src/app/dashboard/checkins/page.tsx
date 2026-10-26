"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/platform/lib/api";
import { day, downloadCsv, errorText, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import {
  Badge, Bar, Button, Card, Empty, ErrorNote, Field, LinkButton, Loading, Notice, Page, Stat, StatGrid, Table, Td, inputClass,
} from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";

type GateEvent = { id: string; title: string; location: string; start_date: string | null; status: string };
type Scan = {
  id: string; code: string; result: string; full_name: string; email: string; ticket_type: string;
  is_hard: boolean; scanned_by: string; created_at: string;
};
type Report = {
  event: { id: string; title: string };
  stats: { total: number; checked_in: number; remaining: number };
  tiers: { name: string; total: number; checked_in: number; remaining: number }[];
  result_counts: Record<string, number>;
  total_scans: number;
  scans: Scan[];
};
type Staff = { id: string; email: string; name: string };

const RESULT: Record<string, { label: string; tone: "green" | "red" | "amber" | "gray" | "blue" }> = {
  ADMITTED: { label: "Let in", tone: "green" },
  ALREADY_USED: { label: "Already used", tone: "red" },
  WRONG_EVENT: { label: "Other event", tone: "amber" },
  NOT_FOUND: { label: "Unknown code", tone: "gray" },
  UNDONE: { label: "Check-in undone", tone: "blue" },
};
const FILTERS = ["", "ADMITTED", "ALREADY_USED", "WRONG_EVENT", "NOT_FOUND"];

function Checkins() {
  const events = useLoad(() => api.get("/tickets/gate/events/").then((r) => listOf<GateEvent>(r.data)));
  const [picked, setEventId] = useState("");
  // Until one is picked, the most recent event.
  const eventId = picked || events.data?.[0]?.id || "";
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [undoing, setUndoing] = useState("");

  const report = useLoad(
    () => (eventId ? api.get<Report>(`/tickets/gate/report/?event_id=${eventId}&limit=300`).then((r) => r.data) : Promise.resolve(null)),
    [eventId],
  );
  const reloadReport = report.reload;
  const staff = useLoad(
    () => (eventId ? api.get(`/dashboard/gate-staff/?event=${eventId}`).then((r) => listOf<Staff>(r.data)) : Promise.resolve([] as Staff[])),
    [eventId],
  );

  // Live: refresh the numbers every 15 seconds while the page is open.
  useEffect(() => {
    if (!eventId) return;
    const t = setInterval(() => reloadReport(), 15000);
    return () => clearInterval(t);
  }, [eventId, reloadReport]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (report.data?.scans ?? []).filter(
      (s) => (!filter || s.result === filter) && (!q || [s.full_name, s.email, s.code].some((v) => (v || "").toLowerCase().includes(q))),
    );
  }, [report.data, filter, search]);

  const undo = async (s: Scan) => {
    if (!window.confirm(`Undo the check-in of ${s.full_name || s.code}? They will be able to scan in again.`)) return;
    setUndoing(s.id);
    setError("");
    try {
      await api.post("/tickets/gate/undo/", { event_id: eventId, code: s.code });
      await report.reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setUndoing("");
    }
  };

  if (events.loading) return <Loading />;
  const list = events.data ?? [];
  const r = report.data;
  const pct = r && r.stats.total ? Math.round((r.stats.checked_in / r.stats.total) * 100) : 0;

  return (
    <Page
      title="Door check-ins"
      subtitle="Who is inside, live. Updates every 15 seconds."
      actions={
        <>
          {list.length > 1 && (
            <Field label={<span className="text-xs text-[#5B6472]">Event</span>}>
              <select className={inputClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {list.map((e) => <option key={e.id} value={e.id}>{e.title}{e.start_date ? ` · ${day(e.start_date)}` : ""}</option>)}
              </select>
            </Field>
          )}
          <Button onClick={() => report.reload()}>Refresh</Button>
          <LinkButton kind="primary" href="/scan">Open scanner</LinkButton>
        </>
      }
    >
      {(events.error || report.error || error) && <ErrorNote>{events.error || report.error || error}</ErrorNote>}
      {list.length === 0 && <Notice>No events to check in yet. Events appear here once they have tickets.</Notice>}

      {r && (
        <>
          <StatGrid>
            <Stat dark label="Inside now" value={r.stats.checked_in} note={`${pct}% of tickets arrived`} />
            <Stat label="Not arrived" value={r.stats.remaining} />
            <Stat label="Tickets out" value={r.stats.total} />
            <Stat label="Tried twice" value={r.result_counts.ALREADY_USED ?? 0} tone={(r.result_counts.ALREADY_USED ?? 0) > 0 ? "red" : undefined} note="Ticket already used" />
          </StatGrid>

          <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
            <Card title="Arrivals by ticket type">
              {r.tiers.length === 0 && <Empty>No tickets yet.</Empty>}
              {r.tiers.map((t) => (
                <div key={t.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm"><b>{t.name}</b><span className="tabular-nums text-[#374151]">{t.checked_in} of {t.total}</span></div>
                  <Bar pct={t.total ? (t.checked_in / t.total) * 100 : 0} color="#08283B" />
                </div>
              ))}
            </Card>
            <Card title="Door staff">
              <p className="m-0 text-[13px] text-[#5B6472]">They log in on their phone and can only scan tickets for this event.</p>
              {(staff.data ?? []).length === 0 && <p className="m-0 text-sm text-[#5B6472]">Nobody has scanner access for this event yet.</p>}
              {(staff.data ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2.5 p-3 border border-[#E5E7EB] rounded-xl">
                  <span className="text-sm font-semibold truncate">{p.name || p.email}<br /><span className="text-xs font-normal text-[#5B6472]">{p.email}</span></span>
                  <Badge tone="green">Can scan</Badge>
                </div>
              ))}
              <Notice>Need more door staff? Contact Ozone Events · 0790 755 673</Notice>
            </Card>
          </div>

          <Card
            padded={false}
            title="Every scan"
            actions={
              <>
                <input type="search" aria-label="Search scans" placeholder="Name, email or code" className={`${inputClass} min-w-[220px]`} value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button
                  onClick={() =>
                    downloadCsv("door-scans.csv", ["Time", "Result", "Code", "Name", "Email", "Ticket", "Printed", "Scanned by"],
                      visible.map((s) => [when(s.created_at), RESULT[s.result]?.label ?? s.result, s.code, s.full_name, s.email, s.ticket_type, s.is_hard ? "yes" : "no", s.scanned_by]))
                  }
                >
                  Download CSV
                </Button>
              </>
            }
          >
            <div role="group" aria-label="Show" className="flex flex-wrap gap-2 px-[22px]">
              {FILTERS.map((f) => {
                const n = f ? r.result_counts[f] ?? 0 : r.total_scans;
                return (
                  <button
                    key={f || "all"}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border ${filter === f ? "bg-[#08283B] border-[#08283B] text-white" : "bg-white border-[#D1D5DB] text-[#374151] hover:bg-[#F4F5F7]"}`}
                  >
                    {f ? RESULT[f].label : "All"} · {n}
                  </button>
                );
              })}
            </div>
            <Table head={["Time", "Result", "Ticket", "Scanned by", "Action"]} minWidth={760} empty={visible.length === 0 && <Empty>No scans yet.</Empty>}>
              {visible.map((s) => (
                <tr key={s.id}>
                  <Td first className="text-[#5B6472] whitespace-nowrap">{when(s.created_at)}</Td>
                  <Td><Badge tone={RESULT[s.result]?.tone ?? "gray"}>{RESULT[s.result]?.label ?? s.result}</Badge></Td>
                  <Td>
                    {s.full_name || <span className="font-mono text-[13px]">{s.code}</span>}
                    {s.ticket_type && <span className="text-[#5B6472]"> · {s.ticket_type}{s.is_hard ? " · printed" : " · online"}</span>}
                  </Td>
                  <Td className="text-[#374151]">{s.scanned_by}</Td>
                  <Td last className="text-right">
                    {s.result === "ADMITTED" && <Button small busy={undoing === s.id} onClick={() => undo(s)}>Undo</Button>}
                  </Td>
                </tr>
              ))}
            </Table>
            {r.total_scans > r.scans.length && <p className="m-0 px-[22px] pb-3 text-xs text-[#5B6472]">Showing the latest {r.scans.length} of {r.total_scans} scans.</p>}
          </Card>
        </>
      )}
      {!r && report.loading && eventId && <Loading />}
    </Page>
  );
}

export default function CheckinsPage() {
  return <RoleGate roles={["COMPANY", "ADMIN"]}><Checkins /></RoleGate>;
}
