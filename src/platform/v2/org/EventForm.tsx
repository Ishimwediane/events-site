"use client";

/** New event and Edit event share this form (organisers and admins). */
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/platform/lib/api";
import { getImageUrl } from "@/platform/lib/images";
import { errorText } from "@/platform/v2/format";
import { Button, Card, ErrorNote, Field, LinkButton, Page, inputClass } from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";
import type { EventItem } from "./types";

type Category = { id: string; name: string };
type Row = { name: string; price: string; capacity: string; file: File | null };

const localInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MAX_IMAGE = 10 * 1024 * 1024;

export default function EventForm({ event }: { event?: EventItem }) {
  const router = useRouter();
  const cats = useLoad(() => api.get("/events/categories/").then((r) => listOf<Category>(r.data)));
  const [form, setForm] = useState({
    title: event?.title ?? "", location: event?.location ?? "", description: event?.description ?? "",
    start_date: localInput(event?.start_date), end_date: localInput(event?.end_date), category: event?.category ?? "",
  });
  const [flyer, setFlyer] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([{ name: "Regular", price: "", capacity: "", file: null }]);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const pickImage = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_IMAGE) {
      setError("Pictures must be 10 MB or smaller.");
      return;
    }
    setter(f);
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      const res = await api.post("/events/categories/", { name: newCat.trim() });
      await cats.reload();
      setForm((f) => ({ ...f, category: res.data.id }));
      setNewCat("");
    } catch (e) {
      setError(errorText(e));
    }
  };

  const save = async (status?: string) => {
    setBusy(status ?? "save");
    setError("");
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("location", form.location);
      data.append("description", form.description);
      if (form.start_date) data.append("start_date", new Date(form.start_date).toISOString());
      data.append("end_date", form.end_date ? new Date(form.end_date).toISOString() : "");
      if (form.category) data.append("category", form.category);
      if (status) data.append("status", status);
      if (flyer) data.append("flyer", flyer);
      if (logo) data.append("venue_logo", logo);
      if (!event) {
        const tiers = rows.filter((r) => r.name.trim() && Number(r.capacity) > 0);
        data.append("ticket_types", JSON.stringify(tiers.map((r) => ({ name: r.name.trim(), price: r.price || "0", capacity: r.capacity }))));
        tiers.forEach((r, i) => r.file && data.append(`ticket_template_${i}`, r.file));
      }
      const headers = { "Content-Type": "multipart/form-data" };
      const res = event
        ? await api.patch(`/events/${event.id}/`, data, { headers })
        : await api.post("/events/", data, { headers });
      router.push(`/dashboard/events/${res.data.id ?? event?.id}`);
    } catch (e) {
      setError(errorText(e, "Could not save the event. Check the fields and try again."));
      setBusy("");
    }
  };

  const ready = form.title.trim() && form.location.trim() && form.start_date;
  const back = event ? `/dashboard/events/${event.id}` : "/dashboard/tickets";

  return (
    <Page
      back={{ href: back, label: event ? event.title : "All events" }}
      title={event ? "Edit event" : "New event"}
      subtitle={event ? "Ticket types are changed on the event page." : "Add the event and its ticket types. You can change everything later."}
    >
      <div className="flex flex-col gap-5 max-w-[960px]">
        {error && <ErrorNote>{error}</ErrorNote>}

        <Card title="Pictures">
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {[
              { label: "Event flyer", hint: "Shown on the website · up to 10 MB", current: event?.flyer, file: flyer, set: setFlyer },
              { label: "Venue logo", hint: "Optional", current: event?.venue_logo, file: logo, set: setLogo },
            ].map((p) => (
              <label key={p.label} className="min-h-[150px] border border-dashed border-[#C7CDD4] rounded-xl flex flex-col items-center justify-center gap-2 p-4 text-[13px] text-[#5B6472] cursor-pointer hover:bg-[#F7F8FA]">
                {p.file ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(p.file)} alt="" className="max-h-24 rounded-lg" />
                ) : p.current ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(p.current)} alt="" className="max-h-24 rounded-lg" />
                ) : null}
                <b className="text-[#374151]">{p.label}</b>
                {p.hint}
                <span className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white font-semibold text-[#08283B]">Choose picture</span>
                <input type="file" accept="image/*" className="sr-only" onChange={pickImage(p.set)} />
              </label>
            ))}
          </div>
        </Card>

        <Card title="Details">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Event name"><input className={inputClass} value={form.title} onChange={set("title")} placeholder="e.g. AGACIRO Awards Gala · Edition 3" /></Field>
            </div>
            <Field label="Starts"><input type="datetime-local" className={inputClass} value={form.start_date} onChange={set("start_date")} /></Field>
            <Field label="Ends (optional)"><input type="datetime-local" className={inputClass} value={form.end_date} onChange={set("end_date")} /></Field>
            <Field label="Place"><input className={inputClass} value={form.location} onChange={set("location")} placeholder="Venue, Kigali" /></Field>
            <Field label="Kind of event">
              <select className={inputClass} value={form.category} onChange={set("category")}>
                <option value="">Choose…</option>
                {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2 flex flex-wrap items-end gap-2">
              <Field label="Not in the list? Add a new kind">
                <input className={inputClass} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Concert" />
              </Field>
              <Button onClick={addCategory} disabled={!newCat.trim()}>Add</Button>
            </div>
            <div className="sm:col-span-2">
              <Field label="About the event">
                <textarea rows={6} className={`${inputClass} resize-y`} value={form.description} onChange={set("description")} placeholder="What happens, who performs, dress code…" />
              </Field>
            </div>
          </div>
        </Card>

        {!event && (
          <Card title="Ticket types" actions={<Button small onClick={() => setRows((r) => [...r, { name: "", price: "", capacity: "", file: null }])}>+ Add another</Button>}>
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2.5 items-end" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto auto" }}>
                <Field label="Name"><input className={inputClass} value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} /></Field>
                <Field label="Price (RWF)"><input className={inputClass} inputMode="numeric" value={r.price} onChange={(e) => setRow(i, { price: e.target.value })} /></Field>
                <Field label="How many"><input className={inputClass} inputMode="numeric" value={r.capacity} onChange={(e) => setRow(i, { capacity: e.target.value })} /></Field>
                <label className="px-3 py-2.5 rounded-[10px] border border-dashed border-[#C7CDD4] bg-white text-[13px] font-semibold text-[#08283B] cursor-pointer whitespace-nowrap">
                  {r.file ? "Design ✓" : "Design"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => setRow(i, { file: e.target.files?.[0] ?? null })} />
                </label>
                <Button kind="danger" aria-label={`Remove ${r.name || "ticket type"}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} disabled={rows.length === 1}>Remove</Button>
              </div>
            ))}
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2.5">
          <LinkButton href={back}>Cancel</LinkButton>
          {event ? (
            <Button kind="primary" busy={busy === "save"} disabled={!ready} onClick={() => save()}>Save changes</Button>
          ) : (
            <>
              <Button busy={busy === "DRAFT"} disabled={!ready} onClick={() => save("DRAFT")}>Save as draft</Button>
              <Button kind="primary" busy={busy === "PUBLISHED"} disabled={!ready} onClick={() => save("PUBLISHED")}>Save and start selling</Button>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
