import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import type { Event } from "@/lib/api";
import { isOnSale } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { formatDate, plainText, truncate } from "@/lib/format";
import { isEnabled } from "@/config/site";

/**
 * The "Our Events" recap from the Ozone Entertainment website: a narrow title
 * column on the left, a wrapping row of event cards on the right, each with a
 * date badge top-left and a HOSTED / UPCOMING tag bottom-left — the upcoming
 * one filled orange rather than white.
 *
 * The original hardcoded its three events. This reads them from the API, so the
 * recap keeps itself current as shows are published and pass.
 */
export default function EventRecapSection({
  upcoming,
  past,
  limit = 3,
}: {
  upcoming: Event[];
  past: Event[];
  limit?: number;
}) {
  // Next show first, then the most recent history, as on the original.
  const featured = upcoming.slice(0, 1);
  const cards = [...featured, ...past].slice(0, limit);

  if (cards.length === 0) return null;

  return (
    <section className="section bg-white py-20">
      <div className="container-custom">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-start">
          <ScrollReveal animation="slideInLeft">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--primary-blue)] mb-3 md:mb-4 leading-tight">
                Our
                <br />
                Events
              </h2>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-4 md:mb-6">
                The nights we have staged, and the one coming next.
              </p>
              <Link
                href="/events"
                className="text-[var(--orange-accent)] text-xs font-semibold tracking-widest uppercase hover:text-[var(--orange-hover)] transition-colors"
              >
                See all events
              </Link>
            </div>
          </ScrollReveal>

          <div className="relative">
            <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
              {cards.map((event, index) => {
                const isUpcoming = featured.includes(event);
                const onSale = isUpcoming && isEnabled("tickets") && isOnSale(event);
                const summary = truncate(plainText(event.description ?? ""), 120);

                return (
                  <ScrollReveal key={event.id} animation="fadeInUp" delay={index * 0.1}>
                    <div className="group relative shrink-0 w-full md:w-[320px] bg-white rounded-xl md:rounded-2xl overflow-hidden border border-gray-200 hover:border-[var(--orange-accent)]/50 transition-all duration-500 shadow-md hover:shadow-xl">
                      <div className="relative h-[180px] md:h-[280px] overflow-hidden">
                        <Image
                          src={imageUrl(event.flyer, FLYER_FALLBACK)}
                          alt={event.title}
                          fill
                          sizes="320px"
                          className="object-cover object-[50%_20%] group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute top-2 md:top-4 left-2 md:left-4 bg-black/50 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg">
                          <p className="text-white text-[9px] md:text-[10px] font-semibold">
                            {formatDate(event.start_date)}
                          </p>
                        </div>

                        {isUpcoming ? (
                          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-[var(--orange-accent)] px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg">
                            <span className="text-white text-[7px] md:text-[8px] font-semibold tracking-wide uppercase">
                              {onSale ? "On Sale" : "Upcoming"}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-white/90 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border border-gray-200">
                            <span className="text-gray-700 text-[7px] md:text-[8px] font-semibold tracking-wide uppercase">
                              Hosted
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 md:p-6">
                        <h3 className="text-gray-900 text-[11px] md:text-sm font-semibold mb-1.5 md:mb-2 leading-tight line-clamp-2 min-h-[30px] md:min-h-[40px]">
                          {event.title}
                        </h3>

                        <p className="text-gray-600 text-[9px] md:text-xs leading-relaxed mb-2 md:mb-4 line-clamp-2 min-h-[22px] md:min-h-[32px]">
                          {summary || event.location}
                        </p>

                        <Link
                          href={`/events/${event.slug}`}
                          className="inline-block bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white text-[9px] md:text-[10px] font-semibold px-3 md:px-5 py-1.5 md:py-2 rounded-md md:rounded-lg transition-all duration-300 uppercase tracking-wider"
                        >
                          {onSale ? "Reserve Your Seat" : "View Event Details"}
                        </Link>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
