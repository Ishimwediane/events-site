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

/** Same calendar day in Kigali? Two timestamps days apart must not be shown
 *  as a bare time range — "14:47 – 14:48" reads as a one-minute event when the
 *  end is actually weeks later. */
function sameDay(a: string, b: string): boolean {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
  return fmt(a) === fmt(b);
}

/**
 * "6:00 PM – 4:00 AM" when the event ends the same day, or runs overnight into
 * the next one. Anything further apart shows only the start time, because the
 * range would be misleading without repeating the date.
 */
export function formatTimeRange(start: string, end: string | null): string {
  if (!end) return formatTime(start);

  const startMs = +new Date(start);
  const endMs = +new Date(end);
  const overnight = endMs - startMs <= 24 * 60 * 60 * 1000;

  if (sameDay(start, end) || overnight) {
    return `${formatTime(start)} – ${formatTime(end)}`;
  }
  return formatTime(start);
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
