/** Formatting shared by every dashboard screen. Money is RWF, whole francs. */

export const rwf = (value: number | string | null | undefined): string =>
  Math.round(Number(value || 0)).toLocaleString("en-GB");

export const rwfLabel = (value: number | string | null | undefined): string => `${rwf(value)} RWF`;

export const num = (value: number | string | null | undefined): string => Number(value || 0).toLocaleString("en-GB");

/** "21 Oct, 18:39" in Kigali time. */
export const when = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kigali" });
};

/** "21 Oct 2026". */
export const day = (iso: string | null | undefined): string => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Kigali" });
};

export const methodLabel: Record<string, string> = { mobile: "Website MoMo", ussd: "USSD", card: "Card" };

export const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ONGOING: "Happening now",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
};

/** Turn any API error into one sentence for the screen. */
export const errorText = (err: unknown, fallback = "Something went wrong. Please try again."): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data.length < 200 ? data : fallback;
  if (typeof data === "object") {
    const d = data as Record<string, unknown>;
    const first = d.error ?? d.detail ?? d.message ?? Object.values(d)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (first) return String(first);
  }
  return fallback;
};

/** Spreadsheet download of rows already on screen. */
export const downloadCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
  const cell = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
