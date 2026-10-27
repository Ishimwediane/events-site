"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { AUTH_LABEL, type Client } from "@/platform/v2/admin/data";
import { day, errorText, rwfLabel } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import {
  Badge, Button, Card, ErrorNote, Field, inputClass, Loading, Modal, Notice, Page,
} from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function ClientsPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Clients />
    </RoleGate>
  );
}

type Form = { name: string; email: string; password: string; description: string; authorization: string; can_use_qr: boolean; active: boolean; percent: string };
const EMPTY: Form = { name: "", email: "", password: "", description: "", authorization: "BOTH", can_use_qr: true, active: true, percent: "" };

function Clients() {
  const { data, error, loading, reload } = useLoad(async () => {
    const clients = await api.get<{ clients: Client[] }>("/dashboard/admin/clients/").then((r) => r.data.clients);
    return { clients };
  });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [created, setCreated] = useState("");

  const open = (c: Client | "new") => {
    setEditing(c);
    setFormError("");
    setForm(c === "new" ? EMPTY : { ...EMPTY, name: c.name, email: c.email, description: c.description || "", authorization: c.authorization, can_use_qr: c.can_use_qr, active: c.is_active, percent: c.organiser_percent ?? "" });
  };

  const save = async () => {
    setBusy("save");
    setFormError("");
    // A stray space is invisible here but must then be typed at every login.
    if (form.password !== form.password.trim()) {
      setFormError("The password starts or ends with a space. Remove it so they can log in.");
      setBusy("");
      return;
    }
    // Empty = no agreed share: they keep everything after Weflexfy and the developer.
    const share = form.percent.trim() === "" ? null : form.percent.trim();
    try {
      if (editing === "new") {
        await api.post("/companies/admin/create/", {
          name: form.name, email: form.email, password: form.password, authorization: form.authorization, can_use_qr: form.can_use_qr,
          organiser_percent: share,
        });
        setCreated(`${form.name} is ready. They log in at ${window.location.origin}/login with ${form.email} and the password you set, then create their own events and voting.`);
      } else if (editing) {
        await api.patch(`/companies/admin/${editing.id}/`, {
          name: form.name, description: form.description, authorization: form.authorization, can_use_qr: form.can_use_qr,
          organiser_percent: share,
        });
        if (editing.user_id && (form.active !== editing.is_active || form.password)) {
          await api.patch(`/users/${editing.user_id}/`, { is_active: form.active, ...(form.password ? { password: form.password } : {}) });
        }
        if (form.password) setCreated(`New password saved for ${form.name}. They log in with ${editing.email} and the new password.`);
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
  if (error || !data) return <Page title="Organisers"><ErrorNote>{error}</ErrorNote></Page>;

  const q = search.trim().toLowerCase();
  // Only organisers with a login; the company Ozone holds its own events under is not one.
  const clients = data.clients.filter((c) => c.user_id && (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)));
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Page
      title="Organisers"
      subtitle="Each organiser gets their own login and sees only their own events and money."
      actions={
        <>
          <Field label="Search">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Organiser or email" className={`${inputClass} min-w-[240px]`} />
          </Field>
          <Button kind="primary" onClick={() => open("new")}>+ Add organiser</Button>
        </>
      }
    >
      {created && <Notice>{created}</Notice>}
      {actionError && <ErrorNote>{actionError}</ErrorNote>}

      {!clients.length && <Card><p className="m-0 text-sm text-[#5B6472]">No organisers match.</p></Card>}
      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {clients.map((c) => (
          <article key={c.id} className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="h-24 bg-[#0F3A52] flex items-end justify-between px-5 pb-3">
              <div className="w-14 h-14 -mb-8 rounded-xl bg-[#08283B] border-4 border-white text-[#F39C12] flex items-center justify-center font-heading font-bold text-2xl">{c.name[0]?.toUpperCase()}</div>
              {c.is_active ? <Badge tone="green">Can log in</Badge> : <Badge tone="red">Paused</Badge>}
            </div>
            <div className="px-5 pt-10 pb-5 flex flex-col gap-3 flex-1">
              <div className="min-w-0">
                <h2 className="m-0 font-heading text-base font-semibold text-[#08283B]">{c.name}</h2>
                <span className="text-[13px] text-[#5B6472] break-all">{c.email}</span>
                <div className="text-xs text-[#5B6472] mt-0.5">Since {day(c.created_at)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Mini label="Money in" value={rwfLabel(c.gross)} />
                <Mini label="Their share" value={c.organiser_percent !== null ? `${c.organiser_percent}%` : "All after fees"} />
                <Mini label="They get" value={rwfLabel(c.organiser)} />
                <Mini label="Ozone gets" value={rwfLabel(c.ozone)} green />
              </div>
              <div className="text-xs text-[#5B6472]">
                Can use: {AUTH_LABEL[c.authorization] || c.authorization}{c.can_use_qr ? " · QR scanner" : ""}
              </div>
              <div className="mt-auto pt-1 flex flex-wrap gap-2">
                <Button small onClick={() => open(c)}>Edit</Button>
                <Button
                  kind="danger"
                  small
                  busy={busy === c.id}
                  onClick={() => {
                    if (!window.confirm(`Delete ${c.name} and their login? This cannot be undone.`)) return;
                    act(c.id, () => api.delete(`/companies/admin/${c.id}/`));
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add an organiser" : editing ? `Edit ${editing.name}` : ""}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button kind="primary" busy={busy === "save"} onClick={save}>{editing === "new" ? "Create organiser" : "Save changes"}</Button>
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
          <>
            <Field label="About them (optional)">
              <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <Field label="New password (optional)" hint="Leave empty to keep their current password. At least 8 characters.">
              <input type="text" autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => set({ password: e.target.value })} />
            </Field>
          </>
        )}
        <Field
          label="Their share (%)"
          hint="Of what customers pay, as agreed with Ozone. Weflexfy 12% and the developer 10% come off first; Ozone keeps the rest. Leave empty and they keep everything after those 22%."
        >
          <input type="number" inputMode="decimal" min={0} max={78} step="0.01" className={inputClass} value={form.percent} onChange={(e) => set({ percent: e.target.value })} placeholder="e.g. 50" />
        </Field>
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
        {editing && editing !== "new" && editing.user_id && (
          <label className="flex gap-2 items-center text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="w-[18px] h-[18px]" /> Can log in (untick to pause them)
          </label>
        )}
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
