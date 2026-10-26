"use client";

/** Editable vote-package rows, used by the new-campaign form and the details page. */
import { api } from "@/platform/lib/api";
import { rwf } from "../format";
import { Button, inputClass } from "../ui";
import type { Package } from "./shared";

export type PackageDraft = { id?: string; name: string; number_of_votes: string; price: string };

export const toDraft = (p: Package): PackageDraft => ({
  id: p.id, name: p.name, number_of_votes: String(p.number_of_votes), price: String(Math.round(Number(p.price))),
});

const filled = (p: PackageDraft) => p.name.trim() && Number(p.number_of_votes) > 0 && p.price !== "";

/** Create, update and delete packages so the campaign matches `rows`. Empty rows are ignored. */
export async function savePackages(campaignId: string, before: Package[], rows: PackageDraft[]) {
  const kept = new Set(rows.filter((r) => r.id).map((r) => r.id));
  for (const old of before) {
    if (!kept.has(old.id)) await api.delete(`/voting/vote-packages/${old.id}/`);
  }
  for (const r of rows.filter(filled)) {
    const body = { campaign: campaignId, name: r.name.trim(), number_of_votes: Number(r.number_of_votes), price: Number(r.price) };
    if (r.id) {
      const old = before.find((p) => p.id === r.id);
      const same = old && old.name === body.name && old.number_of_votes === body.number_of_votes && Number(old.price) === body.price;
      if (!same) await api.patch(`/voting/vote-packages/${r.id}/`, body);
    } else {
      await api.post("/voting/vote-packages/", body);
    }
  }
}

export function PackageRows({ rows, onChange }: { rows: PackageDraft[]; onChange: (rows: PackageDraft[]) => void }) {
  const set = (i: number, patch: Partial<PackageDraft>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => {
        const each = Number(r.number_of_votes) > 0 && r.price !== "" ? Number(r.price) / Number(r.number_of_votes) : null;
        return (
          <div key={r.id ?? `new-${i}`} className="grid gap-2.5 items-end grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_110px_auto]">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#374151] col-span-2 md:col-span-1">
              Name
              <input className={inputClass} value={r.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="e.g. Silver" />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#374151]">
              Votes
              <input className={inputClass} inputMode="numeric" value={r.number_of_votes} onChange={(e) => set(i, { number_of_votes: e.target.value.replace(/\D/g, "") })} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#374151]">
              Price (RWF)
              <input className={inputClass} inputMode="numeric" value={r.price} onChange={(e) => set(i, { price: e.target.value.replace(/\D/g, "") })} />
            </label>
            <span className="py-2.5 text-[13px] text-[#5B6472] tabular-nums">{each === null ? "" : `${rwf(each)} RWF / vote`}</span>
            <Button kind="danger" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Remove ${r.name || "package"}`}>Remove</Button>
          </div>
        );
      })}
      <Button className="self-start" onClick={() => onChange([...rows, { name: "", number_of_votes: "", price: "" }])}>+ Add package</Button>
    </div>
  );
}
