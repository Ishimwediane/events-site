"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { fetchAll, ROLE_LABEL, type AdminUser, type GateAssignment } from "@/platform/v2/admin/data";
import { day, errorText, num } from "@/platform/v2/format";
import { RoleGate, useSession } from "@/platform/v2/Shell";
import {
  Badge, Button, Card, Empty, ErrorNote, Field, inputClass, Loading, Modal, Page, Stat, StatGrid, Table, Td,
} from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function UsersPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Users />
    </RoleGate>
  );
}

type EventOption = { id: string; title: string; organizer_name: string; status: string };
type Form = { email: string; password: string; first_name: string; last_name: string; role: string; is_active: boolean };
const EMPTY: Form = { email: "", password: "", first_name: "", last_name: "", role: "GATE_STAFF", is_active: true };

const ROLE_TONE: Record<string, "amber" | "green" | "blue" | "gray" | "navy"> = {
  ADMIN: "amber", COMPANY: "green", GATE_STAFF: "blue", DEVELOPER: "navy", CUSTOMER: "gray",
};

function Users() {
  const { user: me } = useSession();
  const { data, error, loading, reload } = useLoad(async () => {
    const [users, gate, events] = await Promise.all([
      fetchAll<AdminUser>("/users/"),
      api.get<GateAssignment[]>("/dashboard/gate-staff/").then((r) => r.data),
      fetchAll<EventOption>("/events/?page_size=100"),
    ]);
    return { users, gate, events };
  });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [addEvent, setAddEvent] = useState("");
  const [busy, setBusy] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  const open = (u: AdminUser | "new") => {
    setEditing(u);
    setFormError("");
    setAddEvent("");
    setForm(u === "new" ? EMPTY : { ...EMPTY, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role, is_active: u.is_active });
  };

  const run = async (key: string, fn: () => Promise<unknown>, onError: (m: string) => void) => {
    setBusy(key);
    onError("");
    try {
      await fn();
      await reload();
      return true;
    } catch (e) {
      onError(errorText(e));
      return false;
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    const ok = await run("save", async () => {
      if (editing === "new") {
        await api.post("/users/", {
          email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name, role: form.role,
        });
      } else if (editing) {
        await api.patch(`/users/${editing.id}/`, {
          first_name: form.first_name, last_name: form.last_name, role: form.role, is_active: form.is_active,
        });
      }
    }, setFormError);
    if (ok) setEditing(null);
  };

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Users"><ErrorNote>{error}</ErrorNote></Page>;

  const count = (r: string) => data.users.filter((u) => u.role === r).length;
  const q = search.trim().toLowerCase();
  const users = data.users.filter((u) => (!role || u.role === role) && (!q || `${u.email} ${u.first_name} ${u.last_name}`.toLowerCase().includes(q)));
  const doorOf = (email: string) => data.gate.filter((g) => g.email.toLowerCase() === email.toLowerCase());
  const editingUser = editing && editing !== "new" ? editing : null;
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Page
      title="Users"
      subtitle="Everyone who can log in, and what they are allowed to do."
      actions={
        <>
          <Field label="Search">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" className={`${inputClass} min-w-[220px]`} />
          </Field>
          <Field label="Role">
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Everyone</option>
              {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Button kind="primary" onClick={() => open("new")}>+ Add user</Button>
        </>
      }
    >
      <StatGrid min={170}>
        <Stat label="Everyone" value={num(data.users.length)} />
        <Stat label="Admins" value={count("ADMIN")} />
        <Stat label="Clients" value={count("COMPANY")} />
        <Stat label="Door staff" value={count("GATE_STAFF")} />
        <Stat label="Developers" value={count("DEVELOPER")} />
      </StatGrid>

      {actionError && <ErrorNote>{actionError}</ErrorNote>}

      <Card padded={false}>
        <Table head={["User", "Role", "Door access", "Joined", "Action"]} minWidth={820}>
          {users.map((u) => {
            const door = doorOf(u.email);
            return (
              <tr key={u.id}>
                <Td first>
                  <b className="break-all">{u.email}</b>
                  {(u.first_name || u.last_name) && <><br /><span className="text-xs text-[#5B6472]">{u.first_name} {u.last_name}</span></>}
                </Td>
                <Td>
                  <span className="inline-flex flex-wrap gap-1.5">
                    <Badge tone={ROLE_TONE[u.role] || "gray"}>{ROLE_LABEL[u.role] || u.role}</Badge>
                    {!u.is_active && <Badge tone="red">Paused</Badge>}
                  </span>
                </Td>
                <Td className="text-[13px] text-[#374151]">
                  {u.role === "GATE_STAFF" ? (door.length ? door.map((d) => d.event_title).join(", ") : <span className="text-[#B86E00]">No event yet</span>) : "—"}
                </Td>
                <Td className="text-[#5B6472] whitespace-nowrap">{day(u.date_joined)}</Td>
                <Td last className="text-right whitespace-nowrap">
                  <span className="inline-flex gap-1.5">
                    <Button small onClick={() => open(u)}>Edit</Button>
                    {u.id !== me.id && (
                      <Button
                        small
                        kind="danger"
                        busy={busy === `del-${u.id}`}
                        onClick={() => {
                          if (!window.confirm(`Delete ${u.email}? This cannot be undone. To stop them logging in for now, pause them instead (Edit).`)) return;
                          run(`del-${u.id}`, () => api.delete(`/users/${u.id}/`), setActionError);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </span>
                </Td>
              </tr>
            );
          })}
        </Table>
        {!users.length && <Empty>No users match.</Empty>}
      </Card>


      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editingUser ? `Edit ${editingUser.email}` : "Add a user"}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button kind="primary" busy={busy === "save"} onClick={save}>{editingUser ? "Save" : "Create user"}</Button>
          </>
        }
      >
        {!editingUser && (
          <>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
            </Field>
            <Field label="First password" hint="At least 8 characters. Share it privately; they can change it in Settings.">
              <input type="text" autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => set({ password: e.target.value })} />
            </Field>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name"><input className={inputClass} value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} /></Field>
          <Field label="Last name"><input className={inputClass} value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} /></Field>
        </div>
        <Field label="Role" hint={form.role === "COMPANY" && !editingUser ? "To add an organiser who can log in and create events, use Organisers → + Add organiser instead." : undefined}>
          <select className={inputClass} value={form.role} onChange={(e) => set({ role: e.target.value })} disabled={editingUser?.id === me.id}>
            <option value="GATE_STAFF">Door staff (scan tickets only)</option>
            <option value="COMPANY">Client (organiser)</option>
            <option value="ADMIN">Admin (Ozone Events)</option>
            <option value="DEVELOPER">Developer (Vexta Ltd)</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </Field>
        {editingUser && editingUser.id !== me.id && (
          <label className="flex gap-2 items-center text-sm">
            <input type="checkbox" checked={!form.is_active} onChange={(e) => set({ is_active: !e.target.checked })} className="w-[18px] h-[18px]" /> Paused (cannot log in)
          </label>
        )}

        {editingUser?.role === "GATE_STAFF" && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[#F1F2F4]">
            <span className="text-[13px] font-semibold text-[#374151]">Events they can scan</span>
            {doorOf(editingUser.email).map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm">
                <span>{g.event_title}</span>
                <Button small kind="danger" busy={busy === `gd-${g.id}`} onClick={() => run(`gd-${g.id}`, () => api.delete(`/dashboard/gate-staff/${g.id}/`), setFormError)}>Remove</Button>
              </div>
            ))}
            <div className="flex gap-2">
              <select aria-label="Event to add" className={inputClass} value={addEvent} onChange={(e) => setAddEvent(e.target.value)}>
                <option value="">Choose an event…</option>
                {data.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title} · {ev.organizer_name}</option>)}
              </select>
              <Button
                kind="dark"
                disabled={!addEvent}
                busy={busy === "ga"}
                onClick={() => run("ga", () => api.post("/dashboard/gate-staff/", { event: addEvent, email: editingUser.email }), setFormError).then((ok) => ok && setAddEvent(""))}
              >
                Give access
              </Button>
            </div>
          </div>
        )}
        {!editingUser && form.role === "GATE_STAFF" && (
          <p className="m-0 text-[13px] text-[#5B6472]">After creating them, open Edit to choose which events they can scan.</p>
        )}
        {formError && <ErrorNote>{formError}</ErrorNote>}
      </Modal>
    </Page>
  );
}
