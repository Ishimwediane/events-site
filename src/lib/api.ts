/**
 * Client for the Django API in ../backend.
 *
 * Every read is deliberately fault-tolerant: if the backend is unreachable the
 * helpers return empty results rather than throwing, so a public marketing page
 * degrades to an empty state instead of a 500. Failures are logged server-side.
 */
import { envOr } from "./env";

export const API_URL = envOr(process.env.NEXT_PUBLIC_API_URL, "http://localhost:8000/api");

/** How long a page may serve cached API data before refetching, in seconds. */
const REVALIDATE = 60;

export type TicketType = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  remaining: number;
  sale_start: string;
  sale_end: string;
  ticket_template: string | null;
  paid_count: number;
  hard_count: number;
};

export type EventStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "FINISHED" | "CANCELLED";

export type Event = {
  id: string;
  slug: string;
  organizer: string;
  organizer_name: string | null;
  category: string | null;
  category_name: string | null;
  title: string;
  description: string;
  status: EventStatus;
  start_date: string;
  end_date: string | null;
  location: string;
  flyer: string | null;
  venue_logo: string | null;
  tickets: TicketType[];
  created_at: string;
  updated_at: string;
};

export type Nominee = {
  id: string;
  public_id: number | null;
  category: string;
  name: string;
  bio: string;
  profile_image: string | null;
  votes: number;
};

export type VotingCategory = {
  id: string;
  campaign: string;
  name: string;
  description: string;
  nominees: Nominee[];
};

export type VotePackage = {
  id: string;
  campaign: string;
  name: string;
  price: string;
  number_of_votes: number;
};

export type VotingCampaign = {
  id: string;
  public_id: number | null;
  slug: string | null;
  public_path: string | null;
  organizer: string;
  organizer_name: string | null;
  title: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  categories: VotingCategory[];
  packages: VotePackage[];
};

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

/** Unwraps DRF pagination, tolerating endpoints that return a bare array. */
function unwrap<T>(data: Paginated<T> | T[] | null): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[api] GET ${path} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[api] GET ${path} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/* ── Events ─────────────────────────────────────────────────── */

/** Every event the public may see (the API already hides drafts). */
export async function getEvents(): Promise<Event[]> {
  return unwrap(await get<Paginated<Event>>("/events/?page_size=100"));
}

export async function getEvent(slug: string): Promise<Event | null> {
  return get<Event>(`/events/${encodeURIComponent(slug)}/`);
}

/**
 * Splits events either side of now. An event counts as upcoming until its end
 * date (or its start date when no end date is set) has passed, so a show that
 * runs overnight stays "upcoming" while it is actually happening.
 */
export function splitByDate(events: Event[], now = new Date()) {
  const upcoming: Event[] = [];
  const past: Event[] = [];

  for (const event of events) {
    if (event.status === "CANCELLED") continue;
    const ends = new Date(event.end_date ?? event.start_date);
    (ends >= now ? upcoming : past).push(event);
  }

  upcoming.sort((a, b) => +new Date(a.start_date) - +new Date(b.start_date));
  past.sort((a, b) => +new Date(b.start_date) - +new Date(a.start_date));

  return { upcoming, past };
}

/** Cheapest ticket price for an event, or null when no tiers exist. */
export function lowestPrice(event: Event): number | null {
  const prices = event.tickets.map((t) => Number(t.price)).filter((p) => !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : null;
}

/** True when at least one tier can actually be bought right now. */
export function isOnSale(event: Event, now = new Date()): boolean {
  return event.tickets.some(
    (t) =>
      t.remaining > 0 &&
      new Date(t.sale_start) <= now &&
      new Date(t.sale_end) >= now,
  );
}

/* ── Voting ─────────────────────────────────────────────────── */

export async function getCampaigns(): Promise<VotingCampaign[]> {
  return unwrap(await get<Paginated<VotingCampaign>>("/voting/campaigns/?status=PUBLISHED"));
}

export function countNominees(campaign: VotingCampaign): number {
  return campaign.categories.reduce((n, c) => n + (c.nominees?.length ?? 0), 0);
}

/* ── Ticket purchase (client-side) ───────────────────────────── */

export type PurchaseInput = {
  ticket_type_id: string;
  quantity: number;
  full_name: string;
  email: string;
};

export type PurchaseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * Buys tickets. Runs in the browser, so it uses no caching and surfaces the
 * backend's own validation message ("Ticket sale is not active.", "Not enough
 * tickets available.") straight back to the buyer.
 */
export async function purchaseTickets(input: PurchaseInput): Promise<PurchaseResult> {
  try {
    const res = await fetch(`${API_URL}/tickets/checkout/purchase/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "error" in data && String(data.error)) ||
        (data && typeof data === "object" && "detail" in data && String(data.detail)) ||
        `Purchase failed (${res.status}).`;
      return { ok: false, error: message };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: "Could not reach the ticket service. Please try again." };
  }
}
