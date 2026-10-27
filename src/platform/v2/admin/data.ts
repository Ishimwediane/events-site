/** Admin dashboard data: shapes of the /dashboard/* and admin API responses. */
import { api } from "@/platform/lib/api";

/** Every row of a list endpoint, following DRF `next` links (lists are paged by 20). */
export async function fetchAll<T>(url: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = url;
  while (next) {
    const { data }: { data: unknown } = await api.get(next);
    if (Array.isArray(data)) return data as T[];
    const page = data as { results?: T[]; next?: string | null };
    out.push(...(page.results ?? []));
    next = page.next ?? null;
  }
  return out;
}

/** One split: Weflexfy and developer (fixed), then the organiser (agreed share) and Ozone (the rest). */
export type Money = {
  gross: string; gateway: string; developer: string; host: string; organiser: string; ozone: string; ozone_team: string;
  transactions?: number;
};

export type Payment = {
  ref: string; date: string; amount: string; service: "VOTE" | "TICKET"; method: string;
  via_weflexfy: boolean; title: string; client: string; item: string;
};

export type Health = {
  database: boolean; cache: boolean;
  last_payment: { date: string; amount: string } | null;
  week: Record<"SUCCESS" | "FAILED" | "PENDING" | "EXPIRED", number>;
  stuck_pending: number;
  payouts: { sent: number; failed: number; fee_ok: number; fee_failed: number };
  failed_payouts: { ref: string; transfer: string; date: string; amount: string }[];
};

export type Overview = {
  totals: Money & { by_method: Record<string, string> };
  shares: { gateway: string; developer: string; host: string };
  clients: number;
  live: { type: "campaign" | "event"; id: string; title: string; client: string; status: string }[];
  pending_applications: number;
  latest_payments: Payment[];
  health: Health;
};

export type Client = Money & {
  id: string; name: string; slug: string; description: string; logo: string | null;
  user_id: string | null; email: string; is_active: boolean; authorization: string; can_use_qr: boolean;
  /** The agreed share of what customers pay; null = everything after Weflexfy and the developer. */
  organiser_percent: string | null;
  /** Weflexfy and developer shares for this organiser; null = the standard ones. */
  gateway_percent: string | null; developer_percent: string | null;
  created_at: string; events: number; campaigns: number; live: number;
};

export type Application = {
  id: string; company_name: string; phone: string; email: string; description: string;
  status: "PENDING" | "APPROVED" | "REJECTED"; authorization: string; rejection_reason: string | null; created_at: string;
};

export type AdminUser = {
  id: string; email: string; first_name: string; last_name: string; role: string;
  is_active: boolean; date_joined: string; last_login: string | null;
};

export type GateAssignment = { id: string; email: string; name: string; event: string; event_title: string; created_at: string };

export type EarningsItem = Money & {
  type: "event" | "campaign"; id: string; title: string; company: string; tickets: number;
  by_method: Record<string, string>;
};

export type Earnings = {
  currency: string;
  shares: { gateway: string; developer: string; host: string };
  totals: Money & { tickets: number; by_method: Record<string, string> };
  items: EarningsItem[];
  transactions: (Money & { ref: string; date: string; type: string; title: string; service: string; method: string })[];
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin", COMPANY: "Client", GATE_STAFF: "Door staff", DEVELOPER: "Developer", CUSTOMER: "Customer",
};

export const AUTH_LABEL: Record<string, string> = { EVENTS: "Tickets only", VOTING: "Voting only", BOTH: "Voting and tickets" };
