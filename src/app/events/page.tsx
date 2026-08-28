import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock, MapPin, CalendarDays } from "lucide-react";
import PageHero from "@/components/PageHero";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import EventCard from "@/components/EventCard";
import SolutionsSection from "@/components/SolutionsSection";
import { getEvents, splitByDate, isOnSale, lowestPrice, type Event } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { formatDate, formatTimeRange, formatPrice, plainText, truncate } from "@/lib/format";
import { isEnabled } from "@/config/site";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Every Ozone Entertainment show — what is coming up, what is on sale, and what we have already staged.",
};

export default async function EventsPage() {
  if (!isEnabled("events")) notFound();

  const events = await getEvents();
  const { upcoming, past } = splitByDate(events);

  return (
    <>
      <PageHero
        eyebrow={upcoming[0] ? "Next Up" : "Premium Events"}
        title="Professional Management. Unforgettable Experiences."
        image="/images/hero-events.jpg"
      />

      <section className="py-20 bg-white">
        <div className="container-custom">
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-12">Upcoming Events</MiniHeader>
          </ScrollReveal>

          {upcoming.length === 0 ? (
            <div className="max-w-xl mx-auto text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 py-16 px-8">
              <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">
                Nothing scheduled yet
              </h3>
              <p className="text-sm text-gray-500">
                New shows are published here as soon as tickets go on sale.
              </p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              {upcoming.map((event) => (
                <ScrollReveal key={event.id} animation="fadeInUp">
                  <UpcomingRow event={event} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="py-20 bg-white text-[var(--primary-blue)]">
          <div className="container-custom">
            <ScrollReveal animation="fadeInDown">
              <MiniHeader className="mb-12">Event History</MiniHeader>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {past.map((event, i) => (
                <ScrollReveal key={event.id} animation="scaleIn" delay={(i % 3) * 0.1}>
                  <EventCard event={event} past />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <SolutionsSection />
    </>
  );
}

/** The wide flyer-beside-details row used for each upcoming show. */
function UpcomingRow({ event }: { event: Event }) {
  const onSale = isEnabled("tickets") && isOnSale(event);
  const price = lowestPrice(event);
  const summary = truncate(plainText(event.description ?? ""), 260);

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-[var(--border-color)] hover:border-[var(--orange-accent)]/30 transition-all duration-500">
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-video md:aspect-auto md:min-h-[360px]">
          <Image
            src={imageUrl(event.flyer, FLYER_FALLBACK)}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute top-4 left-4 bg-[var(--orange-accent)] text-white text-[10px] font-bold px-4 py-2 rounded-full tracking-[0.15em]">
            {onSale ? "ON SALE" : "UPCOMING"}
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h3 className="text-2xl md:text-4xl font-semibold mb-4 text-[var(--text-primary)] leading-tight">
            {event.title}
          </h3>

          {summary && (
            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">{summary}</p>
          )}

          <div className="flex flex-wrap gap-6 mb-8">
            <Meta icon={Calendar}>{formatDate(event.start_date)}</Meta>
            <Meta icon={Clock}>{formatTimeRange(event.start_date, event.end_date)}</Meta>
            {event.location && <Meta icon={MapPin}>{event.location}</Meta>}
          </div>

          {price !== null && (
            <p className="text-sm font-semibold text-[var(--primary-blue)] mb-6">
              Tickets from {formatPrice(price)}
            </p>
          )}

          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-[var(--orange-accent)] font-semibold text-xs tracking-widest uppercase group-hover:gap-4 transition-all duration-300"
          >
            {onSale ? "Reserve Your Seat" : "View Event"} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-semibold">
      <Icon size={14} className="text-[var(--orange-accent)]" />
      {children}
    </div>
  );
}
