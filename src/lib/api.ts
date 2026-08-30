/**
 * Client for the Django API in ../backend.
 *
 * Every read is deliberately fault-tolerant: if the backend is unreachable the
 * helpers return empty results rather than throwing, so a public marketing page
 * degrades to an empty state instead of a 500. Failures are logged server-side.
 */
import { envOr } from "./env";

/**
 * The deployed Django API is the default, so a fresh deploy works with no
 * environment configuration at all. Point somewhere else — a local backend,
 * a staging one — with NEXT_PUBLIC_API_URL in .env.local.
 */
export const API_URL = envOr(process.env.NEXT_PUBLIC_API_URL, "https://event-backend-tex3.onrender.com/api");

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

/* ── Payments ────────────────────────────────────────────────
 *
 * Tickets are paid for before they exist. `/payments/initiate/` queues a
 * charge and returns a reference; the backend only creates and emails the
 * tickets once that transaction reaches SUCCESS. Poll `/payments/status/`
 * until it settles.
 *
 * Do NOT use `purchaseTickets` above for real sales — that endpoint mints
 * tickets with no payment at all.
 */

export type PaymentMethod = "MOMO" | "CARD";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

/** The gateway rejects anything under this. */
export const MIN_PAYMENT = 100;

/** The networks the gateway accepts, as offered by the organiser platform. */
export const COUNTRY_CODES = [
  { code: "+250", flag: "\u{1F1F7}\u{1F1FC}", name: "Rwanda" },
  { code: "+256", flag: "\u{1F1FA}\u{1F1EC}", name: "Uganda" },
  { code: "+255", flag: "\u{1F1F9}\u{1F1FF}", name: "Tanzania" },
  { code: "+254", flag: "\u{1F1F0}\u{1F1EA}", name: "Kenya" },
] as const;

/** sessionStorage key holding the reference across a card redirect. */
export const PENDING_REF_KEY = "lmb_pending_ref";

export type InitiatePaymentInput = {
  amount: number;
  /** Full international form, e.g. +2507…. Required for MoMo. */
  phone_number?: string;
  email: string;
  payment_method: PaymentMethod;
  /** The TicketType id being bought. */
  target_id: string;
  quantity: number;
  full_name: string;
  /** Where the card gateway sends the buyer back to. */
  card_redirect_url?: string;
};

export type InitiateResult =
  | {
      ok: true;
      txnRef: string;
      /** "QUEUED" once the gateway has accepted the request. */
      gatewayStatus?: string | null;
      /** MoMo only: "fail" means the USSD prompt could not be delivered. */
      lmbStatus?: string | null;
      lmbMessage?: string | null;
      /** Card only: send the buyer here. */
      redirectUrl?: string | null;
    }
  /** The backend sometimes returns a reference even on failure — keep it, it
   *  is what a buyer quotes when the money left but the tickets did not. */
  | { ok: false; error: string; txnRef?: string | null };

/** Pulls the first useful message out of a DRF error body. */
function firstError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  for (const key of ["details", "error", "detail", "phone_number", "email", "amount", "target_id"]) {
    const v = obj[key];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return fallback;
}

export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiateResult> {
  try {
    const res = await fetch(`${API_URL}/payments/initiate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        amount: input.amount,
        phone_number: input.payment_method === "MOMO" ? input.phone_number : undefined,
        email: input.email,
        payment_method: input.payment_method,
        service_type: "TICKET",
        target_id: input.target_id,
        metadata: {
          quantity: input.quantity,
          full_name: input.full_name,
          card_redirect_url: input.card_redirect_url,
        },
      }),
    });

    const data = await res.json().catch(() => null);
    const d = (data ?? {}) as Record<string, unknown>;

    if (!res.ok) {
      return {
        ok: false,
        error: firstError(data, `Payment failed (${res.status}).`),
        txnRef: typeof d.txn_ref === "string" ? d.txn_ref : null,
      };
    }

    const txnRef = typeof d.txn_ref === "string" ? d.txn_ref : null;
    if (!txnRef) return { ok: false, error: "The payment service did not return a reference." };

    return {
      ok: true,
      txnRef,
      gatewayStatus: (d.gateway_status as string) ?? null,
      lmbStatus: (d.lmb_status as string) ?? null,
      lmbMessage: (d.lmb_message as string) ?? null,
      redirectUrl: (d.redirect_url as string) ?? null,
    };
  } catch {
    return { ok: false, error: "Could not reach the payment service. Please try again." };
  }
}

export type StatusResult = {
  status: PaymentStatus;
  gatewayMessage?: string | null;
  /** Card payments come back with somewhere to send the buyer. */
  redirectUrl?: string | null;
};

export async function getPaymentStatus(txnRef: string): Promise<StatusResult | null> {
  try {
    const res = await fetch(`${API_URL}/payments/status/${encodeURIComponent(txnRef)}/`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      status: d.status as PaymentStatus,
      gatewayMessage: d.gateway_message ?? null,
      redirectUrl: d.redirect_url ?? null,
    };
  } catch {
    return null;
  }
}

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
