/** Shape of GET /dashboard/health/ (apps/dashboard/views.py::_health_summary). */
export type Health = {
  database: boolean;
  cache: boolean;
  last_payment: { date: string; amount: string } | null;
  week: { SUCCESS: number; FAILED: number; PENDING: number; EXPIRED: number };
  stuck_pending: number;
  payouts: { sent: number; failed: number; fee_ok: number; fee_failed: number };
  failed_payouts: { ref: string; transfer: string; date: string; amount: string }[];
};

/** Plain-language problems worth a look, most important first. */
export function problems(h: Health): { title: string; text: string; who: string }[] {
  const out: { title: string; text: string; who: string }[] = [];
  if (!h.database) out.push({ title: "Database not answering", text: "The website cannot read or save anything.", who: "Developer" });
  if (!h.cache) out.push({ title: "Cache not answering", text: "Pages are slower and vote counts may lag.", who: "Developer" });
  if (h.payouts.failed > 0) {
    out.push({
      title: `${h.payouts.failed} payout${h.payouts.failed === 1 ? "" : "s"} to a client failed`,
      text: "A buyer paid, but Weflexfy could not send the money on (last 30 days).",
      who: "Ask Weflexfy",
    });
  }
  if (h.stuck_pending > 0) {
    out.push({
      title: `${h.stuck_pending} payment${h.stuck_pending === 1 ? "" : "s"} still waiting`,
      text: "Started over an hour ago and Weflexfy has not said if they were paid.",
      who: "Ask Weflexfy",
    });
  }
  if (h.payouts.fee_failed > 0) {
    out.push({
      title: `${h.payouts.fee_failed} Weflexfy fee transfer${h.payouts.fee_failed === 1 ? "" : "s"} failed`,
      text: "Weflexfy's own fee leg. Clients were still paid; this is on Weflexfy's side.",
      who: "Ask Weflexfy",
    });
  }
  return out;
}
