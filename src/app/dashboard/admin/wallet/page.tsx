"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { day, downloadCsv, errorText, methodLabel, rwf, rwfLabel, when } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import {
  Badge, Bar, Button, Card, Empty, ErrorNote, Field, inputClass, Loading, Modal, Page, Stat, StatGrid, Table, Td,
} from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

type Total = { amount: string; payments: number };
type Payout = {
  date: string; ref: string; title: string; client: string; method: string; paid: string; to_wallet: string;
  state: "received" | "on_the_way" | "failed";
};
type DevPayment = { id: string; amount: string; paid_on: string; reference: string; note: string; recorded_by: string };
type Wallet = {
  received: Total; on_the_way: Total; failed: Total;
  by_day: { date: string; amount: string }[];
  payouts: Payout[];
  developer: { owed: string; paid: string; to_pay: string; payments: DevPayment[] };
};

const STATE: Record<Payout["state"], { label: string; tone: "green" | "amber" | "red" }> = {
  received: { label: "On your MoMo", tone: "green" },
  on_the_way: { label: "On the way", tone: "amber" },
  failed: { label: "Failed at Weflexfy", tone: "red" },
};

export default function AdminWalletPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <WalletPage />
    </RoleGate>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function WalletPage() {
  const { data, error, loading, reload } = useLoad(() => api.get<Wallet>("/dashboard/admin/wallet/").then((r) => r.data));
  const [show, setShow] = useState<"" | Payout["state"]>("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ amount: "", paid_on: today(), reference: "", note: "" });
  const [busy, setBusy] = useState("");
  const [formError, setFormError] = useState("");

  if (loading && !data) return <Loading />;
  if (!data) return <Page title="Wallet"><ErrorNote>{error}</ErrorNote></Page>;

  const dev = data.developer;
  const rows = data.payouts.filter((p) => !show || p.state === show);
  const maxDay = Math.max(1, ...data.by_day.map((d) => Number(d.amount)));

  const save = async () => {
    setBusy("save");
    setFormError("");
    try {
      await api.post("/dashboard/admin/wallet/developer-payments/", form);
      setAdding(false);
      setForm({ amount: "", paid_on: today(), reference: "", note: "" });
      await reload();
    } catch (e) {
      setFormError(errorText(e));
    } finally {
      setBusy("");
    }
  };

  const remove = async (p: DevPayment) => {
    if (!window.confirm(`Remove the record of ${rwfLabel(p.amount)} given on ${day(p.paid_on)}?`)) return;
    setBusy(p.id);
    try {
      await api.delete(`/dashboard/admin/wallet/developer-payments/${p.id}/`);
      await reload();
    } finally {
      setBusy("");
    }
  };

  return (
    <Page
      title="Wallet"
      subtitle="Money Weflexfy has sent to Ozone's MoMo after its fee, and what Ozone owes the developer."
      actions={
        <Button
          onClick={() =>
            downloadCsv("wallet-payouts.csv", ["When", "Reference", "For", "Organiser", "Paid with", "Customer paid", "To wallet", "Status"],
              data.payouts.map((p) => [when(p.date), p.ref, p.title, p.client, methodLabel[p.method] ?? p.method, p.paid, p.to_wallet, STATE[p.state].label]))
          }
        >
          Download payouts
        </Button>
      }
    >
      <StatGrid min={220}>
        <Stat dark label="Received on your MoMo" value={rwf(data.received.amount)} unit="RWF" note={`${data.received.payments} payouts confirmed by Weflexfy`} />
        <Stat label="On the way" value={rwf(data.on_the_way.amount)} unit="RWF" tone="amber" note={`${data.on_the_way.payments} payouts not confirmed yet`} />
        <Stat label="Failed at Weflexfy" value={rwf(data.failed.amount)} unit="RWF" tone="red" note={`${data.failed.payments} payouts — ask Weflexfy to resend`} />
      </StatGrid>

      <Card
        title="Developer's share"
        actions={<Button kind="primary" small onClick={() => { setFormError(""); setAdding(true); }}>+ Record payment to developer</Button>}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Mini label="Developer's share so far" value={rwfLabel(dev.owed)} />
          <Mini label="Already given" value={rwfLabel(dev.paid)} green />
          <Mini label="Still to give" value={rwfLabel(dev.to_pay)} strong={Number(dev.to_pay) > 0} />
        </div>
        <p className="m-0 text-xs text-[#5B6472]">
          The developer&apos;s share is inside the money that reaches your MoMo. Record each time you hand it over so both sides can see it.
        </p>
        {dev.payments.length > 0 ? (
          <Table head={["Given on", "Amount", "Reference", "Note", "Recorded by", ""]} minWidth={640}>
            {dev.payments.map((p) => (
              <tr key={p.id}>
                <Td first>{day(p.paid_on)}</Td>
                <Td className="font-semibold tabular-nums">{rwfLabel(p.amount)}</Td>
                <Td className="font-mono text-xs">{p.reference || "—"}</Td>
                <Td>{p.note || "—"}</Td>
                <Td className="text-xs text-[#5B6472]">{p.recorded_by || "—"}</Td>
                <Td last className="text-right"><Button small kind="ghost" busy={busy === p.id} onClick={() => remove(p)}>Remove</Button></Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No payments to the developer recorded yet.</Empty>
        )}
      </Card>

      {data.by_day.length > 0 && (
        <Card title="Received per day (last 30 days)">
          {data.by_day.map((d) => (
            <div key={d.date} className="grid items-center gap-3 text-sm" style={{ gridTemplateColumns: "90px minmax(0,1fr) 110px" }}>
              <span className="text-[#5B6472]">{day(d.date)}</span>
              <Bar pct={(Number(d.amount) / maxDay) * 100} color="#0B6B43" height={10} />
              <span className="text-right font-semibold tabular-nums">{rwfLabel(d.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      <Card
        padded={false}
        title="Payouts"
        actions={
          <div role="group" aria-label="Show" className="inline-flex p-1 rounded-[10px] bg-[#F4F5F7] gap-1">
            {([["", "All"], ["received", "Received"], ["on_the_way", "On the way"], ["failed", "Failed"]] as const).map(([k, label]) => (
              <button key={k || "all"} type="button" onClick={() => setShow(k)} className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold ${show === k ? "bg-white text-[#08283B]" : "text-[#4B5563]"}`}>{label}</button>
            ))}
          </div>
        }
      >
        <Table head={["When", "For", "Paid with", "Customer paid", "To your MoMo", "Status"]} minWidth={780} empty={rows.length === 0 && <Empty>Nothing here.</Empty>}>
          {rows.map((p) => (
            <tr key={p.ref}>
              <Td first className="text-[#5B6472] whitespace-nowrap">{when(p.date)}</Td>
              <Td><b>{p.title}</b><br /><span className="text-xs text-[#5B6472]">{p.client} · <span className="font-mono">{p.ref}</span></span></Td>
              <Td><Badge>{methodLabel[p.method] ?? p.method}</Badge></Td>
              <Td className="text-right tabular-nums">{rwf(p.paid)}</Td>
              <Td className="text-right font-semibold tabular-nums">{rwf(p.to_wallet)}</Td>
              <Td last><Badge tone={STATE[p.state].tone}>{STATE[p.state].label}</Badge></Td>
            </tr>
          ))}
        </Table>
        <p className="m-0 px-[22px] pb-3 text-xs text-[#5B6472]">The {data.payouts.length} most recent payouts. The totals above count every payout.</p>
      </Card>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Record a payment to the developer"
        footer={
          <>
            <Button onClick={() => setAdding(false)}>Cancel</Button>
            <Button kind="primary" busy={busy === "save"} disabled={!form.amount} onClick={save}>Save</Button>
          </>
        }
      >
        <p className="m-0 text-[13px] text-[#5B6472]">Still to give: <b>{rwfLabel(dev.to_pay)}</b></p>
        <Field label="Amount given (RWF)">
          <input type="number" inputMode="decimal" min={1} className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Given on">
          <input type="date" className={inputClass} value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
        </Field>
        <Field label="Reference (optional)" hint="e.g. the MoMo transaction ID">
          <input className={inputClass} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </Field>
        <Field label="Note (optional)">
          <input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
        {formError && <ErrorNote>{formError}</ErrorNote>}
      </Modal>
    </Page>
  );
}

function Mini({ label, value, green, strong }: { label: string; value: string; green?: boolean; strong?: boolean }) {
  return (
    <div className={`px-3.5 py-3 rounded-xl ${strong ? "bg-[#08283B] text-white" : "bg-[#F7F8FA]"}`}>
      <div className={`text-xs ${strong ? "text-[#C9D4DC]" : "text-[#5B6472]"}`}>{label}</div>
      <div className={`font-bold text-[17px] mt-0.5 tabular-nums ${green ? "text-[#0B6B43]" : strong ? "text-[#6EE7B7]" : ""}`}>{value}</div>
    </div>
  );
}
