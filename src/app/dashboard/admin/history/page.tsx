"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { fetchAll } from "@/platform/v2/admin/data";
import { downloadCsv, methodLabel, num, rwfLabel, statusLabel, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Badge, Button, Card, Empty, ErrorNote, Field, inputClass, Loading, Page, Table, Td, statusTone } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

type Kind = "payments" | "votes" | "scans";

type PaymentRow = {
  ref: string; date: string; status: string; amount: string; service: "VOTE" | "TICKET"; method: string;
  via_weflexfy: boolean; title: string; client: string; item: string; phone: string; email: string;
  shares: { gross: string; gateway: string; developer: string; host: string; organiser: string; ozone: string } | null;
  payouts: { transfer: string; fee: boolean; status: string }[];
};
type VoteRow = { id: string; date: string; votes: number; reason: string; nominee: string; category: string; campaign: string; client: string; by: string };
type ScanRow = { id: string; date: string; result: string; code: string; event: string; client: string; name: string; ticket_type: string; by: string };
type History<T> = { kind: Kind; page: number; page_size: number; total: number; rows: T[] };

const KINDS: { key: Kind; label: string }[] = [
  { key: "payments", label: "Payments" },
  { key: "votes", label: "Votes added by hand" },
  { key: "scans", label: "Door scans" },
];

const PAY_STATUSES = ["", "SUCCESS", "PENDING", "FAILED", "EXPIRED", "REFUND_REQUIRED", "REFUNDED"];
const PAY_LABEL: Record<string, string> = {
  SUCCESS: "Paid", PENDING: "Waiting", FAILED: "Failed", EXPIRED: "Expired", REFUND_REQUIRED: "Needs refund", REFUNDED: "Refunded",
};
const SCAN_LABEL: Record<string, { label: string; tone: "green" | "red" | "amber" | "gray" | "blue" }> = {
  ADMITTED: { label: "Let in", tone: "green" },
  ALREADY_USED: { label: "Already used", tone: "red" },
  WRONG_EVENT: { label: "Other event", tone: "amber" },
  NOT_FOUND: { label: "Unknown code", tone: "gray" },
  UNDONE: { label: "Check-in undone", tone: "blue" },
};

function payout(p: PaymentRow) {
  const main = p.payouts.find((x) => !x.fee);
  if (!p.via_weflexfy || p.status !== "SUCCESS") return null;
  if (!main) return <Badge>Not confirmed</Badge>;
  return main.status === "SUCCESS" ? <Badge tone="green">Sent</Badge> : <Badge tone="red">{main.status.toLowerCase()}</Badge>;
}

function HistoryPage() {
  const [kind, setKind] = useState<Kind>("payments");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const companies = useLoad(() => fetchAll<{ id: string; name: string }>("/companies/list/"));
  const params = new URLSearchParams({ kind, page: String(page) });
  if (client) params.set("client", client);
  if (q) params.set("q", q);
  if (kind === "payments" && status) params.set("status", status);
  if (kind === "payments" && service) params.set("service", service);
  const query = params.toString();
  const history = useLoad(
    () => api.get<History<PaymentRow | VoteRow | ScanRow>>(`/dashboard/admin/history/?${query}`).then((r) => r.data),
    [query],
  );

  const reset = (fn: () => void) => { fn(); setPage(1); };
  const h = history.data;
  const pages = h ? Math.max(1, Math.ceil(h.total / h.page_size)) : 1;

  const exportCsv = () => {
    if (!h) return;
    if (kind === "payments") {
      downloadCsv("payments.csv", ["When", "Reference", "Status", "Client", "For", "Item", "Paid by", "Phone", "Amount", "Weflexfy", "Developer", "Organiser", "Ozone"],
        (h.rows as PaymentRow[]).map((p) => [when(p.date), p.ref, PAY_LABEL[p.status] ?? p.status, p.client, p.title, p.item, methodLabel[p.method] ?? p.method, p.phone, p.amount,
          p.shares?.gateway ?? "", p.shares?.developer ?? "", p.shares?.organiser ?? "", p.shares?.ozone ?? ""]));
    } else if (kind === "votes") {
      downloadCsv("votes-added-by-hand.csv", ["When", "Client", "Campaign", "Category", "Nominee", "Votes", "Added by", "Reason"],
        (h.rows as VoteRow[]).map((v) => [when(v.date), v.client, v.campaign, v.category, v.nominee, v.votes, v.by, v.reason]));
    } else {
      downloadCsv("door-scans.csv", ["When", "Client", "Event", "Result", "Code", "Name", "Ticket", "Scanned by"],
        (h.rows as ScanRow[]).map((s) => [when(s.date), s.client, s.event, SCAN_LABEL[s.result]?.label ?? s.result, s.code, s.name, s.ticket_type, s.by]));
    }
  };

  return (
    <Page title="History" subtitle="Everything that happened on the platform, for every client, newest first.">
      <nav className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-[#E5E7EB] rounded-[14px] self-start">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => reset(() => setKind(k.key))}
            className={`px-4 py-2.5 rounded-[10px] text-sm font-semibold ${kind === k.key ? "bg-[#08283B] text-white" : "text-[#4B5563] hover:bg-[#F4F5F7]"}`}
          >
            {k.label}
          </button>
        ))}
      </nav>

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => { e.preventDefault(); reset(() => setQ(search.trim())); }}
        >
          <Field label="Client">
            <select className={inputClass} value={client} onChange={(e) => reset(() => setClient(e.target.value))}>
              <option value="">All clients</option>
              {(companies.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {kind === "payments" && (
            <>
              <Field label="Status">
                <select className={inputClass} value={status} onChange={(e) => reset(() => setStatus(e.target.value))}>
                  {PAY_STATUSES.map((s) => <option key={s || "all"} value={s}>{s ? PAY_LABEL[s] : "Any status"}</option>)}
                </select>
              </Field>
              <Field label="For">
                <select className={inputClass} value={service} onChange={(e) => reset(() => setService(e.target.value))}>
                  <option value="">Votes and tickets</option>
                  <option value="VOTE">Votes</option>
                  <option value="TICKET">Tickets</option>
                </select>
              </Field>
            </>
          )}
          <Field label="Search">
            <input
              type="search"
              className={`${inputClass} min-w-[220px]`}
              placeholder={kind === "payments" ? "Reference, phone or email" : kind === "votes" ? "Nominee, reason or who" : "Code, name or who"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Button type="submit">Search</Button>
          <Button type="button" onClick={exportCsv} disabled={!h?.rows.length}>Download this page (CSV)</Button>
        </form>
      </Card>

      {history.error && <ErrorNote>{history.error}</ErrorNote>}
      {history.loading && !h && <Loading />}

      {h && (
        <Card padded={false} title={`${num(h.total)} ${h.total === 1 ? "record" : "records"}`}>
          {kind === "payments" && (
            <Table head={["When", "Client", "For", "Paid by", "Status", "Amount", "Split", "Payout"]} minWidth={1100} empty={!h.rows.length && <Empty>Nothing matches.</Empty>}>
              {(h.rows as PaymentRow[]).map((p) => (
                <tr key={p.ref}>
                  <Td first className="text-[#5B6472] whitespace-nowrap tabular-nums">{when(p.date)}<br /><span className="font-mono text-[11px]">{p.ref}</span></Td>
                  <Td>{p.client || "—"}</Td>
                  <Td>{p.service === "VOTE" ? "Vote" : "Ticket"}{p.item ? ` · ${p.item}` : ""}<br /><span className="text-xs text-[#5B6472]">{p.title}</span></Td>
                  <Td><Badge>{methodLabel[p.method] || p.method}</Badge><br /><span className="text-xs text-[#5B6472]">{p.phone || p.email}</span></Td>
                  <Td><Badge tone={statusTone(p.status)}>{PAY_LABEL[p.status] ?? statusLabel[p.status] ?? p.status}</Badge></Td>
                  <Td className="text-right font-semibold tabular-nums whitespace-nowrap">{rwfLabel(p.amount)}</Td>
                  <Td className="text-xs text-[#374151] whitespace-nowrap tabular-nums">
                    {p.shares ? (p.via_weflexfy
                      ? <>Weflexfy {rwfLabel(p.shares.gateway)}<br />Developer {rwfLabel(p.shares.developer)}<br />Organiser {rwfLabel(p.shares.organiser)}<br />Ozone {rwfLabel(p.shares.ozone)}</>
                      : <>Old LMB payment<br />Organiser {rwfLabel(p.shares.organiser)}<br />Ozone {rwfLabel(p.shares.ozone)}</>) : "—"}
                  </Td>
                  <Td last>{payout(p)}</Td>
                </tr>
              ))}
            </Table>
          )}
          {kind === "votes" && (
            <Table head={["When", "Client", "Nominee", "Votes", "Added by", "Reason"]} minWidth={900} empty={!h.rows.length && <Empty>No votes were added by hand.</Empty>}>
              {(h.rows as VoteRow[]).map((v) => (
                <tr key={v.id}>
                  <Td first className="text-[#5B6472] whitespace-nowrap tabular-nums">{when(v.date)}</Td>
                  <Td>{v.client}</Td>
                  <Td><b>{v.nominee}</b><br /><span className="text-xs text-[#5B6472]">{v.category} · {v.campaign}</span></Td>
                  <Td className={`text-right font-semibold tabular-nums ${v.votes < 0 ? "text-[#B42318]" : ""}`}>{v.votes > 0 ? "+" : ""}{num(v.votes)}</Td>
                  <Td className="text-[#374151]">{v.by || "—"}</Td>
                  <Td last className="text-[#374151]">{v.reason}</Td>
                </tr>
              ))}
            </Table>
          )}
          {kind === "scans" && (
            <Table head={["When", "Client", "Event", "Result", "Ticket", "Scanned by"]} minWidth={900} empty={!h.rows.length && <Empty>No door scans.</Empty>}>
              {(h.rows as ScanRow[]).map((s) => (
                <tr key={s.id}>
                  <Td first className="text-[#5B6472] whitespace-nowrap tabular-nums">{when(s.date)}</Td>
                  <Td>{s.client}</Td>
                  <Td>{s.event}</Td>
                  <Td><Badge tone={SCAN_LABEL[s.result]?.tone ?? "gray"}>{SCAN_LABEL[s.result]?.label ?? s.result}</Badge></Td>
                  <Td>{s.name || <span className="font-mono text-[13px]">{s.code}</span>}{s.ticket_type && <span className="text-[#5B6472]"> · {s.ticket_type}</span>}</Td>
                  <Td last className="text-[#374151]">{s.by || "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
          <div className="flex items-center justify-between gap-3 px-[22px] pb-4 text-sm text-[#5B6472]">
            <span>Page {h.page} of {pages}</span>
            <span className="flex gap-2">
              <Button small disabled={page <= 1 || history.loading} onClick={() => setPage((p) => p - 1)}>Newer</Button>
              <Button small disabled={page >= pages || history.loading} onClick={() => setPage((p) => p + 1)}>Older</Button>
            </span>
          </div>
        </Card>
      )}
    </Page>
  );
}

export default function AdminHistoryPage() {
  return <RoleGate roles={["ADMIN"]}><HistoryPage /></RoleGate>;
}
