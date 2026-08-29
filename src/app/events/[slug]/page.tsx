import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Building2, CalendarDays, Ticket, Phone } from "lucide-react";
import TicketPicker from "@/components/TicketPicker";
import ShareRow from "@/components/ShareRow";
import { getEvent, lowestPrice } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import {
  formatLongDate, formatTimeRange, formatPrice, plainText, truncate,
} from "@/lib/format";
import { brand, isEnabled } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found" };

  const description =
    truncate(plainText(event.description ?? ""), 160) ||
    `${event.title} — ${event.location}. Tickets and details.`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      images: event.flyer ? [imageUrl(event.flyer, FLYER_FALLBACK)] : undefined,
      type: "website",
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  if (!isEnabled("events")) notFound();

  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const price = lowestPrice(event);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: plainText(event.description ?? ""),
    image: event.flyer ? imageUrl(event.flyer, FLYER_FALLBACK) : undefined,
    startDate: event.start_date,
    endDate: event.end_date ?? event.start_date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location,
        addressLocality: "Kigali",
        addressCountry: "RW",
      },
    },
    organizer: { "@type": "Organization", name: event.organizer_name ?? brand.name },
    offers: event.tickets.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: "RWF",
      availability: t.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    })),
  };

  return (
    <div className="bg-[#f6f7f9] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Flyer banner */}
      <div className="relative w-full h-64 md:h-[400px] overflow-hidden bg-[var(--primary-blue)]">
        <Image
          src={imageUrl(event.flyer, FLYER_FALLBACK)}
          alt={event.title}
          fill
          sizes="100vw"
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />

        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-full transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        {event.category_name && (
          <div className="absolute top-6 right-6 z-20">
            <span className="px-4 py-1.5 rounded-lg bg-[var(--orange-accent)] text-white text-xs font-bold uppercase tracking-wider shadow-lg">
              {event.category_name}
            </span>
          </div>
        )}
      </div>

      {/* Ticket-stub card, lifted over the banner */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row relative">
            <div className="flex-1 p-6 lg:p-8">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--primary-blue)] mb-4 leading-tight">
                {event.title}
              </h1>

              <div className="space-y-4">
                <Fact icon={Clock} label="Date and Time">
                  <span className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-0.5">
                    <span>{formatLongDate(event.start_date)}</span>
                    <span>{formatTimeRange(event.start_date, event.end_date)}</span>
                  </span>
                </Fact>

                {event.location && (
                  <Fact icon={MapPin} label="Address" accent>
                    {event.location}
                  </Fact>
                )}
              </div>

              <ShareRow title={event.title} />
            </div>

            {/* The stub perforation */}
            <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 -translate-x-1/2 border-l border-dashed border-gray-100 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 border-4 border-white shadow-inner" />
            </div>

            <div className="w-full lg:w-[340px] p-6 lg:p-8 flex flex-col justify-center">
              {isEnabled("tickets") ? (
                <TicketPicker tiers={event.tickets} />
              ) : (
                <div className="text-center">
                  <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Call {brand.phone} to reserve for this event.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {event.description ? (
              <Card>
                <h2 className="text-base font-bold text-[var(--primary-blue)] mb-4">
                  Event Details
                </h2>
                <div
                  className="text-sm text-gray-600 leading-relaxed space-y-3 [&_strong]:text-[var(--primary-blue)] [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </Card>
            ) : (
              <Card>
                <h2 className="text-base font-bold text-[var(--primary-blue)] mb-2">
                  Event Details
                </h2>
                <p className="text-sm text-gray-400 italic">
                  No write-up has been added for this event yet.
                </p>
              </Card>
            )}

            {event.tickets.length > 0 && isEnabled("tickets") && (
              <Card>
                <h2 className="text-base font-bold text-[var(--primary-blue)] mb-4">
                  Ticket Types
                </h2>
                <TicketPicker tiers={event.tickets} variant="list" />
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card padding="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-50">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Organizer
                  </p>
                  <p className="text-base font-bold text-[var(--primary-blue)] leading-tight">
                    {event.organizer_name ?? brand.name}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Meta label="Phone">
                  <a
                    href={`tel:${brand.phone.replace(/\s/g, "")}`}
                    className="text-sm font-bold text-[var(--orange-accent)] inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {brand.phone}
                  </a>
                </Meta>
                <Meta label="Email">
                  <a
                    href={`mailto:${brand.email}`}
                    className="text-sm font-bold text-[var(--orange-accent)] break-all"
                  >
                    {brand.email}
                  </a>
                </Meta>
              </div>
            </Card>

            <Card padding="p-6">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
                Summary
              </h3>
              <div className="space-y-4">
                <Meta label="Starts" icon={CalendarDays}>
                  <span className="text-sm font-bold text-[var(--primary-blue)]">
                    {formatLongDate(event.start_date)}
                  </span>
                  <span className="block text-xs text-gray-400">
                    {formatTimeRange(event.start_date, event.end_date)}
                  </span>
                </Meta>
                {event.location && (
                  <Meta label="Venue" icon={MapPin}>
                    <span className="text-sm font-bold text-[var(--orange-accent)]">
                      {event.location}
                    </span>
                  </Meta>
                )}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <Row label="Lowest price">{price !== null ? formatPrice(price) : "—"}</Row>
                  <Row label="Ticket tiers">{event.tickets.length}</Row>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  children, padding = "p-6 md:p-8",
}: {
  children: React.ReactNode; padding?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-50 shadow-sm ${padding}`}>
      {children}
    </div>
  );
}

function Fact({
  icon: Icon, label, accent = false, children,
}: {
  icon: typeof Clock; label: string; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[var(--orange-accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[var(--orange-accent)]" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">
          {label}
        </p>
        <div
          className={`text-sm font-bold ${
            accent ? "text-[var(--orange-accent)]" : "text-gray-800"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Meta({
  label, icon: Icon, children,
}: {
  label: string; icon?: typeof Clock; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-[var(--primary-blue)]">{children}</span>
    </div>
  );
}
