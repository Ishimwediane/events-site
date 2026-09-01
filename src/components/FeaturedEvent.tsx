import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Clock, Smartphone, Ticket, Phone } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import type { Event } from "@/lib/api";
import { isOnSale } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { formatDate, formatTimeRange, formatPrice, plainText, truncate } from "@/lib/format";
import { brand, isEnabled } from "@/config/site";

/**
 * The flyer-beside-the-details block the homepage leads with. Content comes
 * from whichever event is next, so it never needs hand-editing between shows.
 */
export default function FeaturedEvent({ event }: { event: Event }) {
  const [firstWord, ...rest] = event.title.split(" ");
  const summary = truncate(plainText(event.description ?? ""), 320);
  const onSale = isEnabled("tickets") && isOnSale(event);

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--orange-accent)]/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--orange-accent)]/5 rounded-full blur-3xl -ml-32 -mb-32" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <ScrollReveal animation="slideInLeft">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--orange-accent)] to-[var(--orange-hover)] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-1000" />
                <div className="relative bg-white rounded-xl overflow-hidden shadow-xl transition-transform duration-500 hover:scale-[1.02] border border-gray-100">
                  <Image
                    src={imageUrl(event.flyer, FLYER_FALLBACK)}
                    alt={`${event.title} flyer`}
                    width={800}
                    height={1000}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <ScrollReveal animation="slideInRight">
              {event.organizer_name && (
                <h2 className="text-[var(--orange-accent)] text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase mb-4 inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-px after:bg-[var(--orange-accent)]/30">
                  {event.organizer_name} Presents
                </h2>
              )}

              <p className="text-2xl md:text-3xl font-bold text-[var(--primary-blue)] mb-6 leading-tight font-heading">
                {firstWord}{" "}
                {rest.length > 0 && (
                  <span className="text-[var(--orange-accent)]">{rest.join(" ")}</span>
                )}
              </p>

              {summary && (
                <p className="text-gray-600 text-sm md:text-base mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-body">
                  {summary}
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left max-w-xl mx-auto lg:mx-0">
                <Essential icon={CalendarDays} label="Date" value={formatDate(event.start_date)} />
                {event.location && (
                  <Essential icon={MapPin} label="Venue" value={event.location} />
                )}
                <Essential
                  icon={Clock}
                  label="Time"
                  value={formatTimeRange(event.start_date, event.end_date)}
                />
                <Essential
                  icon={Smartphone}
                  label="MoMo Pay (MTN)"
                  value={brand.momoCode}
                  note={brand.legalName}
                />
              </div>

              {event.tickets.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
                  {event.tickets.slice(0, 3).map((tier) => (
                    <div
                      key={tier.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-[var(--orange-accent)]/50 transition-colors duration-300"
                    >
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--orange-accent)] font-bold mb-1">
                        {tier.name}
                      </p>
                      <p className="text-[var(--primary-blue)] text-xl font-bold leading-none mb-1">
                        {formatPrice(tier.price)}
                      </p>
                      <p className="text-gray-500 text-[10px] leading-snug">
                        {tier.remaining > 0 ? `${tier.remaining} left` : "Sold out"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6">
                <Link
                  href={`/events/${event.slug}`}
                  className="group relative bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-xl flex items-center gap-2 overflow-hidden text-[9px] tracking-[.3em] uppercase"
                >
                  <Ticket className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">
                    {onSale ? "Reserve Your Seat" : "View Event"}
                  </span>
                </Link>

                <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-medium">
                  {onSale ? "Limited tickets available" : "Tickets not on sale yet"}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5 text-left max-w-xl mx-auto lg:mx-0">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
                  <a
                    href={`tel:${brand.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold hover:text-[var(--orange-accent)] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[var(--orange-accent)]" />
                    {brand.phone}
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
        </div>
      </div>
    </section>
  );
}

function Essential({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-[var(--orange-accent)] shrink-0 mt-0.5" />
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-medium">{label}</p>
        <p className="text-[var(--primary-blue)] text-sm font-semibold">{value}</p>
        {note && <p className="text-gray-500 text-xs">{note}</p>}
      </div>
    </div>
  );
}
