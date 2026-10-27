/** Shapes returned by the API for the organiser pages (see Ozone_Event serializers). */

export type TicketTier = {
  id: string; event?: string; event_title?: string; event_location?: string; name: string; price: string;
  quantity: number; remaining: number; sale_start: string; sale_end: string; ticket_template: string | null;
  paid_count: number; hard_count: number;
};

export type EventItem = {
  id: string; slug: string; title: string; description: string; status: string; start_date: string; end_date: string | null;
  location: string; flyer: string | null; venue_logo: string | null; category: string | null; category_name?: string;
  organizer_name?: string; tickets: TicketTier[];
};

/** What an organiser is shown: their part and the Ozone team's (Weflexfy, developer and Ozone together). */
export type Earnings = {
  shares: { organiser: string; ozone_team: string };
  totals: {
    gross: string; organiser: string; ozone_team: string; transactions: number; tickets: number;
    by_method: Record<string, string>;
  };
  items: { type: string; id: string; title: string; gross: string; organiser: string; ozone_team: string; transactions: number; tickets: number }[];
  transactions: {
    ref: string; date: string; type: string; title: string; service: string; method: string;
    gross: string; organiser: string; ozone_team: string;
  }[];
};

export type Nominee = { id: string; name: string; votes: number; manual_votes: number; purchased_votes: number };
export type Campaign = {
  id: string; title: string; status: string; start_date: string; end_date: string | null;
  categories: { id: string; name: string; nominees: Nominee[] }[];
};

/** A tier's tickets: paid online, printed for the door, still for sale. */
export const tierCounts = (t: TicketTier) => ({
  paid: t.paid_count ?? 0,
  printed: t.hard_count ?? 0,
  left: t.remaining ?? 0,
  out: (t.quantity ?? 0) - (t.remaining ?? 0),
});

export const isLive = (status: string) => status === "PUBLISHED" || status === "ONGOING";
