import type { Metadata } from "next";
import TicketCheckView from "./TicketCheckView";

type Props = { params: Promise<{ code: string }> };

// Every ticket has its own page: keep them out of search engines.
export const metadata: Metadata = {
  title: "Ticket check",
  robots: { index: false, follow: false },
};

/**
 * Where a ticket's QR leads (TICKET_PUBLIC_URL on the backend). Anyone who
 * scans it with a phone camera sees whether the ticket is valid. Door staff
 * scan the same QR with /scan, which reads the code out of this link.
 */
export default async function TicketCheckPage({ params }: Props) {
  const { code } = await params;
  return <TicketCheckView code={decodeURIComponent(code)} />;
}
