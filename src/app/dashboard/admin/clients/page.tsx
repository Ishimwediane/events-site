"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { AUTH_LABEL, fetchAll, type Application, type Client } from "@/platform/v2/admin/data";
import { day, errorText, rwfLabel } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import {
  Badge, Button, Card, ErrorNote, Field, inputClass, LinkButton, Loading, Modal, NotBuilt, Page,
} from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function ClientsPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Clients />
    </RoleGate>
  );
}

type Form = { name: string; email: string; password: string; description: string; authorization: string; can_use_qr: boolean };
const EMPTY: Form = { name: "", email: "", password: "", description: "", authorization: "BOTH", can_use_qr: true };

function Clients() {
  const { data, error, loading, reload } = useLoad(async () => {
    const [clients, applications] = await Promise.all([
      api.get<{ clients: Client[] }>("/dashboard/admin/clients/").then((r) => r.data.clients),
      fetchAll<Application>("/companies/applications/"),
    ]);
    return { clients, pending: applications.filter((a) => a.status === "PENDING") };
  });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  const open = (c: Client | "new") => {
    setEditing(c);
    setFormError("");
    setForm(c === "new" ? EMPTY : { ...EMPTY, name: c.name, email: c.email, description: c.description || "", authorization: c.authorization, can_use_qr: c.can_use_qr });
  };

  const save = async () => {
    setBusy("save");
    setFormError("");
    try {
      if (editing === "new") {
        await api.post("/companies/admin/create/", {
          name: form.name, email: form.email, password: form.password, authorization: form.authorization, can_use_qr: form.can_use_qr,
        });
      } else if (editing) {
        await api.patch(`/companies/admin/${editing.id}/`, {
          name: form.name, description: form.description, authorization: form.authorization, can_use_qr: form.can_use_qr,
        });
      }
      setEditing(null);
      await reload();
    } catch (e) {
      setFormError(errorText(e));
    } finally {
      setBusy("");
    }
  };

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

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Clients"><ErrorNote>{error}</ErrorNote></Page>;

  const q = search.trim().toLowerCase();
  const clients = data.clients.filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Page
      title="Clients"
      subtitle="Each client gets their own login and sees only their own events and money."
      actions={
        <>
          <Field label="Search">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client or email" className={`${inputClass} min-w-[240px]`} />
          </Field>
          <Button kind="primary" onClick={() => open("new")}>+ Add client</Button>
        </>
      }
    >
      {actionError && <ErrorNote>{actionError}</ErrorNote>}

      <section className="flex flex-col gap-3.5">
        {clients.map((c) => (
          <article key={c.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-[22px] flex flex-col gap-[18px]">
            <div className="flex flex-wrap justify-between gap-3 items-start">
              <div className="flex gap-3.5 items-center min-w-0">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-[#08283B] text-[#F39C12] flex items-center justify-center font-heading font-bold text-xl">{c.name[0]?.toUpperCase()}</div>
                <div className="min-w-0">
                  <h2 className="m-0 text-[17px] font-semibold">{c.name}</h2>
                  <span className="text-[13px] text-[#5B6472] break-all">{c.email} · client since {day(c.created_at)}</span>
                </div>
              </div>
              {!c.is_active ? <Badge tone="red">Paused</Badge> : c.live ? <Badge tone="green">Live now</Badge> : <Badge>Quiet</Badge>}
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <Mini label="Events / voting" value={`${c.events} ${c.events === 1 ? "event" : "events"} · ${c.campaigns} voting`} />
              <Mini label="Money in" value={rwfLabel(c.gross)} />
              <Mini label="Developer 10%" value={rwfLabel(c.developer)} green />
              <Mini label="Can use" value={`${AUTH_LABEL[c.authorization] || c.authorization}${c.can_use_qr ? " · QR scanner" : ""}`} />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <LinkButton href={`/dashboard/admin/events?client=${encodeURIComponent(c.name)}`} kind="dark">Their events and voting</LinkButton>
              <Button onClick={() => open(c)}>Edit</Button>
              {c.user_id && <Button
                kind={c.is_active ? "danger" : "outline"}
                busy={busy === c.id}
                onClick={() => {
                  if (c.is_active && !window.confirm(`Pause ${c.name}? They will not be able to log in until you resume them.`)) return;
                  act(c.id, () => api.patch(`/users/${c.user_id}/`, { is_active: !c.is_active }));
                }}
              >
                {c.is_active ? "Pause client" : "Resume client"}
              </Button>}
            </div>
          </article>
        ))}
        {!clients.length && <Card><p className="m-0 text-sm text-[#5B6472]">No clients match.</p></Card>}
      </section>

      <Card title="Sign-ups waiting for approval">
        {data.pending.map((a) => (
          <div key={a.id} className="flex flex-wrap justify-between items-center gap-3 px-3.5 py-3 border border-[#E5E7EB] rounded-xl">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span><b>{a.company_name}</b> <span className="text-[13px] text-[#5B6472]">· {a.email} · {a.phone}</span></span>
              <span className="text-[13px] text-[#5B6472]">{AUTH_LABEL[a.authorization] || a.authorization} · applied {day(a.created_at)}</span>
              {a.description && <span className="text-[13px] text-[#374151]">{a.description}</span>}
            </div>
            <div className="flex gap-2">
              <Button
                kind="dark"
                small
                busy={busy === `ok-${a.id}`}
                onClick={() => act(`ok-${a.id}`, () => api.patch(`/companies/applications/${a.id}/`, { status: "APPROVED" }))}
              >
                Approve
              </Button>
              <Button
                small
                busy={busy === `no-${a.id}`}
                onClick={() => {
                  const reason = window.prompt(`Why are you declining ${a.company_name}? They will see this.`);
                  if (reason === null) return;
                  act(`no-${a.id}`, () => api.patch(`/companies/applications/${a.id}/`, { status: "REJECTED", rejection_reason: reason }));
                }}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
        {!data.pending.length && <p className="m-0 text-sm text-[#5B6472]">No sign-ups waiting.</p>}
      </Card>

      <NotBuilt>Opening a client&apos;s own dashboard as them, and sending them a password reset email. Use &quot;Their events and voting&quot; to manage their campaigns and events.</NotBuilt>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a client" : editing ? `Edit ${editing.name}` : ""}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button kind="primary" busy={busy === "save"} onClick={save}>{editing === "new" ? "Create client" : "Save changes"}</Button>
          </>
        }
      >
        {editing === "new" && <p className="m-0 text-[13px] text-[#5B6472]">They log in with this email and password. Share the password with them privately; no email is sent.</p>}
        <Field label="Organisation name">
          <input className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Kigali Fashion Week" />
        </Field>
        {editing === "new" ? (
          <>
            <Field label="Login email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@company.rw" />
            </Field>
            <Field label="First password" hint="At least 8 characters. They can change it in Settings.">
              <input type="text" autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => set({ password: e.target.value })} />
            </Field>
          </>
        ) : (
          <Field label="About them (optional)">
            <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        )}
        <Field label="They can use">
          <select className={inputClass} value={form.authorization} onChange={(e) => set({ authorization: e.target.value })}>
            <option value="BOTH">Voting and tickets</option>
            <option value="VOTING">Voting only</option>
            <option value="EVENTS">Tickets only</option>
          </select>
        </Field>
        <label className="flex gap-2 items-center text-sm">
          <input type="checkbox" checked={form.can_use_qr} onChange={(e) => set({ can_use_qr: e.target.checked })} className="w-[18px] h-[18px]" /> QR tickets and door scanner
        </label>
        {formError && <ErrorNote>{formError}</ErrorNote>}
      </Modal>
    </Page>
  );
}

function Mini({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="px-3.5 py-3 rounded-xl bg-[#F7F8FA]">
      <div className="text-xs text-[#5B6472]">{label}</div>
      <div className={`font-bold text-[15px] mt-0.5 tabular-nums ${green ? "text-[#0B6B43]" : ""}`}>{value}</div>
    </div>
  );
}
