"use client";

/** Pieces shared by the organiser voting pages (campaign header, tabs, types, paging). */
import { useEffect, useMemo, useState } from "react";

import { api } from "@/platform/lib/api";
import { day, errorText, statusLabel } from "../format";
import { ErrorNote, TabLinks, inputClass } from "../ui";

export type Nominee = {
  id: string; public_id: number; category: string; name: string; bio?: string;
  profile_image?: string | null; votes: number; manual_votes?: number; purchased_votes?: number;
};
export type Category = { id: string; campaign: string; name: string; description?: string; nominees: Nominee[] };
export type Package = { id: string; campaign: string; name: string; price: string; number_of_votes: number };
export type Campaign = {
  id: string; public_id?: number; slug?: string; organizer: string; organizer_name?: string;
  title: string; description?: string; cover_image?: string | null; start_date: string; end_date?: string | null;
  status: string; categories: Category[]; packages: Package[];
};

export const STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "FINISHED", "CANCELLED"];

export const STATUS_OPTION: Record<string, string> = {
  DRAFT: "Draft (hidden)",
  PUBLISHED: "Published (voting open)",
  ONGOING: "Happening now",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
};

/** Every page of a paginated list (the API returns 20 rows a page). */
export async function fetchAll<T>(url: string, params: Record<string, string> = {}): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 200; page++) {
    const data = (await api.get(url, { params: { ...params, page } })).data;
    if (Array.isArray(data)) return data as T[];
    rows.push(...((data?.results ?? []) as T[]));
    if (!data?.next) break;
  }
  return rows;
}

/** ISO → value for <input type="datetime-local"> (local time). */
export const toLocalInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** <input type="datetime-local"> value → ISO, or "" when empty. */
export const fromLocalInput = (value: string): string => (value ? new Date(value).toISOString() : "");

export const allNominees = (c: Campaign): (Nominee & { categoryName: string })[] =>
  c.categories.flatMap((cat) => cat.nominees.map((n) => ({ ...n, categoryName: cat.name })));

export const campaignDates = (c: Campaign) => `${day(c.start_date)}${c.end_date ? ` – ${day(c.end_date)}` : ""}`;

export function CampaignTabs({ id, active }: { id: string; active: "results" | "nominees" | "log" | "details" }) {
  const base = `/dashboard/voting/${id}`;
  const tabs = [
    { href: base, label: "Results" },
    { href: `${base}/nominees`, label: "Categories and nominees" },
    { href: `${base}/log`, label: "Vote log" },
    { href: `${base}/details`, label: "Details and packages" },
  ];
  const map = { results: base, nominees: `${base}/nominees`, log: `${base}/log`, details: `${base}/details` };
  return <TabLinks tabs={tabs} active={map[active]} />;
}

/** The campaign's status picker: changing it publishes or hides voting. */
export function StatusSelect({ campaign, onSaved }: { campaign: Campaign; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = async (status: string) => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/voting/campaigns/${campaign.id}/`, { status });
      onSaved();
    } catch (e) {
      setError(errorText(e, "Could not change the status."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-xs text-[#5B6472]">
        Status
        <select
          value={campaign.status}
          disabled={busy}
          onChange={(e) => change(e.target.value)}
          className={`${inputClass} font-semibold min-w-[220px]`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_OPTION[s] ?? statusLabel[s]}</option>
          ))}
        </select>
      </label>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}

/** Image chooser with a preview, used for nominee photos and campaign covers. */
export function ImagePicker({ label, current, file, onChange, hint }: {
  label: string; current?: string | null; file: File | null; onChange: (f: File | null) => void; hint?: string;
}) {
  const local = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (local) URL.revokeObjectURL(local); }, [local]);
  const preview = local || current || "";
  return (
    <div className="flex items-center gap-3 p-3 border border-dashed border-[#C7CDD4] rounded-xl">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-[#F4F5F7] shrink-0" />
      )}
      <div className="flex-1 min-w-0 text-[13px] text-[#374151]">
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs text-[#5B6472]">{hint}</div>}
      </div>
      <label className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[13px] font-semibold text-[#08283B] cursor-pointer hover:bg-[#F4F5F7]">
        {preview ? "Change" : "Upload"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}
