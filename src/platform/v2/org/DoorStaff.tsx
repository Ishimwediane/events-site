"use client";

/**
 * Organisers manage door staff — and only door staff. A new email becomes a
 * scanner-only login for one of their events; the server refuses any email
 * that already belongs to another kind of account.
 */
import { useState } from "react";

import { api } from "@/platform/lib/api";
import { errorText } from "@/platform/v2/format";
import { Button, ErrorNote, Field, Modal, inputClass } from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";

type MyEvent = { id: string; title: string; status: string };

export function AddDoorStaff({ event, onAdded }: { event?: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const events = useLoad(() => api.get("/events/mine/").then((r) => listOf<MyEvent>(r.data)), []);
  const [form, setForm] = useState({ event: event ?? "", email: "", first_name: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const show = () => {
    setForm({ event: event ?? events.data?.[0]?.id ?? "", email: "", first_name: "", password: "" });
    setError("");
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/dashboard/gate-staff/", form);
      setOpen(false);
      onAdded();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button kind="dark" small onClick={show}>+ Add door staff</Button>
      <Modal
        title="Add door staff"
        open={open}
        onClose={() => setOpen(false)}
        footer={<>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button kind="primary" busy={busy} disabled={!form.event || !form.email} onClick={save}>Give scanner access</Button>
        </>}
      >
        <p className="m-0 text-[13px] text-[#5B6472]">They sign in on their phone and can only scan tickets for this event. They never see money or anything else.</p>
        <Field label="Event">
          <select className={inputClass} value={form.event} onChange={set("event")}>
            {(events.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </Field>
        <Field label="Their email"><input type="email" autoComplete="off" className={inputClass} value={form.email} onChange={set("email")} placeholder="door@example.com" /></Field>
        <Field label="Name (optional)"><input className={inputClass} value={form.first_name} onChange={set("first_name")} /></Field>
        <Field label="Password for their login" hint="At least 8 characters. Give it to them yourself. If this email is already door staff, they keep their password and just get this event.">
          <input type="text" autoComplete="new-password" className={inputClass} value={form.password} onChange={set("password")} />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
      </Modal>
    </>
  );
}

export function RemoveDoorStaff({ id, who, onRemoved }: { id: string; who: string; onRemoved: () => void }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm(`Take scanner access away from ${who} for this event?`)) return;
    setBusy(true);
    try {
      await api.delete(`/dashboard/gate-staff/${id}/`);
      onRemoved();
    } catch (e) {
      alert(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return <Button kind="danger" small busy={busy} onClick={remove}>Remove access</Button>;
}
