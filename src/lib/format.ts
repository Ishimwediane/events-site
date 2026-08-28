/** Kigali is UTC+2 all year; the API stores UTC, so render in Kigali time. */
const TZ = "Africa/Kigali";
const LOCALE = "en-GB";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** "6:00 PM – 4:00 AM", or just the start when there is no end date. */
export function formatTimeRange(start: string, end: string | null): string {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

export function formatPrice(price: string | number): string {
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  if (n === 0) return "Free";
  return `${n.toLocaleString(LOCALE)} RWF`;
}

/** Strips the HTML the dashboard's rich-text field produces, for previews. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
