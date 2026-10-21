/**
 * Client for the Django API in ../backend.
 *
 * Every read is deliberately fault-tolerant: if the backend is unreachable the
 * helpers return empty results rather than throwing, so a public marketing page
 * degrades to an empty state instead of a 500. Failures are logged server-side.
 */
import { envOr } from "./env";
import { campaignPath } from "./slug";

/**
 * The deployed Django API is the default, so a fresh deploy works with no
 * environment configuration at all. Point somewhere else — a local backend,
 * a staging one — with NEXT_PUBLIC_API_URL in .env.local.
 */
export const API_URL = envOr(process.env.NEXT_PUBLIC_API_URL, "https://api.ozoneentertainmentz.com/api");

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

/** One campaign's vote page (/voting/<slug>/<public_id>) — campaign, packages
 *  and every nominee. The endpoint pages nominees, so all pages are merged. */
export type PublicCampaign = Omit<VotingCampaign, "organizer" | "public_path" | "categories"> & {
  categories: Pick<VotingCategory, "id" | "name" | "description" | "nominees">[];
};

type PublicCampaignPage = PublicCampaign & { pagination: { has_next: boolean } };

export async function getPublicCampaign(slug: string, publicId: string): Promise<PublicCampaign | null> {
  const base = `/voting/campaigns/public/${encodeURIComponent(slug)}/${encodeURIComponent(publicId)}/`;
  let first: PublicCampaignPage | null = null;
  const byCategory = new Map<string, PublicCampaign["categories"][number]>();

  for (let page = 1; page <= 20; page++) {
    const data = await get<PublicCampaignPage>(`${base}?page_size=100&page=${page}`);
    if (!data) return first;
    first ??= data;
    for (const c of data.categories) {
      const existing = byCategory.get(c.id);
      if (existing) existing.nominees.push(...c.nominees);
      else byCategory.set(c.id, { ...c, nominees: [...c.nominees] });
    }
    if (!data.pagination?.has_next) break;
  }
  if (!first) return null;
  return { ...first, categories: [...byCategory.values()] };
}

/**
 * The campaign at /voting/<name>, where <name> is its title as a slug
 * (src/lib/slug.ts). The backend addresses campaigns by short slug + public
 * id, so the name is resolved through the published campaigns.
 */
export async function getCampaignByName(name: string): Promise<PublicCampaign | null> {
  const match = (await getCampaigns()).find((c) => campaignPath(c) === `/voting/${name}`);
  if (!match?.slug || match.public_id === null) return null;
  return getPublicCampaign(match.slug, String(match.public_id));
}

/**
 * The address a link shared before a rename should go to now. Organisers add
 * or drop an edition ("… 2026" → "… 2026-Edition 3"), so an old name that is
 * the start of the new one — or the other way round — is the same campaign.
 * null when no single campaign fits.
 */
export async function renamedCampaignPath(name: string): Promise<string | null> {
  const old = `/voting/${name}`;
  const fits = (await getCampaigns())
    .map((c) => campaignPath(c))
    .filter((path) => path.startsWith(`${old}-`) || old.startsWith(`${path}-`));
  return fits.length === 1 ? fits[0] : null;
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

/** sessionStorage key holding the reference across a redirect to the gateway. */
export const PENDING_REF_KEY = "lmb_pending_ref";

export type InitiatePaymentInput =
  | {
      service: "TICKET";
      /** The TicketType being bought. */
      targetId: string;
      /** Where the QR ticket is emailed. */
      email: string;
      quantity: number;
    }
  | {
      service: "VOTE";
      /** The Nominee being voted for. */
      targetId: string;
      packageId: string;
    };

export type InitiateResult =
  /** redirectUrl is the Weflexfy payment page; it may only arrive later, from
   *  the status endpoint, once the worker has initiated the charge. */
  | { ok: true; txnRef: string; redirectUrl?: string | null }
  /** The backend sometimes returns a reference even on failure — keep it, it
   *  is what a buyer quotes when the money left but the order did not. */
  | { ok: false; error: string; txnRef?: string | null };

/** Pulls the first useful message out of a DRF error body. */
function firstError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  for (const key of ["details", "error", "detail", "phone_number", "email", "amount", "target_id", "quantity", "metadata"]) {
    const v = obj[key];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return fallback;
}

/**
 * The amount is computed by the backend from the ticket tier or vote package.
 * No phone number is sent: the Weflexfy payment page asks the buyer for it.
 */
export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiateResult> {
  const body =
    input.service === "TICKET"
      ? {
          email: input.email,
          payment_method: "MOMO",
          service_type: "TICKET",
          target_id: input.targetId,
          metadata: { quantity: input.quantity },
        }
      : {
          payment_method: "MOMO",
          service_type: "VOTE",
          target_id: input.targetId,
          metadata: { package_id: input.packageId },
        };

  try {
    const res = await fetch(`${API_URL}/payments/initiate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);
    const d = (data ?? {}) as Record<string, unknown>;
    const txnRef = typeof d.txn_ref === "string" ? d.txn_ref : null;

    if (!res.ok) {
      return { ok: false, error: firstError(data, `Payment failed (${res.status}).`), txnRef };
    }
    if (!txnRef) return { ok: false, error: "The payment service did not return a reference." };
    return { ok: true, txnRef, redirectUrl: (d.redirect_url as string) ?? null };
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
