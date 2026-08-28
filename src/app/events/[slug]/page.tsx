import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Smartphone, Phone, Building2, Ticket,
} from "lucide-react";
import TicketPicker from "@/components/TicketPicker";
import ScrollReveal from "@/components/ScrollReveal";
import { getEvent, lowestPrice } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { formatLongDate, formatTimeRange, formatPrice, plainText, truncate } from "@/lib/format";
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
  const capacityLeft = event.tickets.reduce((n, t) => n + t.remaining, 0);

  // Structured data so the event shows up properly when shared or searched.
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
    organizer: {
      "@type": "Organization",
      name: event.organizer_name ?? brand.name,
    },
    offers: event.tickets.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: "RWF",
      availability:
        t.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden bg-[var(--primary-blue)]">
        <Image
          src={imageUrl(event.flyer, FLYER_FALLBACK)}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-blue)] via-[var(--primary-blue)]/60 to-[var(--primary-blue)]/30" />

        <div className="container-custom relative z-10 pb-12">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold tracking-[0.2em] uppercase mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> All Events
          </Link>

          {event.category_name && (
            <div className="eyebrow-ruled justify-start mb-4">
              <span className="rule" />
              <span className="label">{event.category_name}</span>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-normal tracking-tight leading-tight text-white uppercase max-w-3xl">
            {event.title}
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
            <div>
              <ScrollReveal animation="fadeInUp">
                <div className="grid sm:grid-cols-2 gap-6 mb-12">
                  <Fact icon={CalendarDays} label="Date">
                    {formatLongDate(event.start_date)}
                  </Fact>
                  <Fact icon={Clock} label="Time">
                    {formatTimeRange(event.start_date, event.end_date)}
                  </Fact>
                  {event.location && (
                    <Fact icon={MapPin} label="Venue">
                      {event.location}
                    </Fact>
                  )}
                  <Fact icon={Smartphone} label="MoMo Pay (MTN)" note={brand.legalName}>
                    {brand.momoCode}
                  </Fact>
                </div>

                {event.description ? (
                  <div className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-5">
                      About This Event
                    </h2>
                    <div
                      className="text-sm md:text-base text-gray-600 leading-relaxed space-y-4 [&_strong]:text-[var(--primary-blue)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-12">
                    No write-up has been added for this event yet.
                  </p>
                )}

                {event.tickets.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-5">
                      Ticket Types
                    </h2>
                    <div className="space-y-3">
                      {event.tickets.map((tier) => (
                        <div
                          key={tier.id}
                          className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--primary-blue)]">
                              {tier.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-0.5">
                              {tier.remaining > 0
                                ? `${tier.remaining} of ${tier.quantity} left`
                                : "Sold out"}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-[var(--primary-blue)] whitespace-nowrap">
                            {formatPrice(tier.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--orange-accent)]/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-[var(--orange-accent)]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        Organiser
                      </p>
                      <p className="text-lg font-semibold text-[var(--primary-blue)] leading-tight">
                        {event.organizer_name ?? brand.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
                    <a
                      href={`tel:${brand.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold hover:text-[var(--orange-accent)] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[var(--orange-accent)]" />
                      {brand.phone}
                    </a>
                    <a
                      href={`tel:${brand.phoneAlt.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold hover:text-[var(--orange-accent)] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[var(--orange-accent)]" />
                      {brand.phoneAlt}
                    </a>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Ticket pick-up points:{" "}
                    <span className="text-[var(--primary-blue)] font-medium">
                      {brand.pickupPoints}
                    </span>
                  </p>
                </div>
              </ScrollReveal>
            </div>

            <aside className="lg:sticky lg:top-28 space-y-6">
              {isEnabled("tickets") ? (
                <TicketPicker tiers={event.tickets} />
              ) : (
                <div className="bg-white rounded-2xl border border-[var(--border-color)] p-8 text-center">
                  <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Call {brand.phone} to reserve for this event.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-[var(--border-color)] p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Summary
                </h3>
                <Row label="Lowest price">
                  {price !== null ? formatPrice(price) : "—"}
                </Row>
                <Row label="Ticket tiers">{event.tickets.length}</Row>
                <Row label="Capacity left">{capacityLeft}</Row>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({
  icon: Icon,
  label,
  note,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-[var(--orange-accent)] shrink-0 mt-0.5" />
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-medium">{label}</p>
        <p className="text-[var(--primary-blue)] text-sm font-semibold">{children}</p>
        {note && <p className="text-gray-500 text-xs">{note}</p>}
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
