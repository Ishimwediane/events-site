import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Event } from "@/lib/api";
import { lowestPrice } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { formatDate, formatTime, formatPrice, plainText, truncate } from "@/lib/format";

/**
 * Past-event card, matching the rounded-[2rem] cards in the site's event
 * history strip. `past` drops the price and the call to action.
 */
export default function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const price = lowestPrice(event);
  const summary = truncate(plainText(event.description ?? ""), 160);

  // The design splits the title so the first word sits above an orange remainder.
  const [firstWord, ...rest] = event.title.split(" ");

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 h-full flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imageUrl(event.flyer, FLYER_FALLBACK)}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        {event.category_name && (
          <span className="absolute top-4 left-4 bg-white/95 text-[var(--primary-blue)] text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full">
            {event.category_name}
          </span>
        )}
      </div>

      <div className="p-8 flex flex-col grow">
        <h3 className="text-2xl font-bold mb-4 uppercase tracking-tight text-gray-900 leading-none">
          {firstWord}
          {rest.length > 0 && (
            <>
              <br />
              <span className="text-[var(--orange-accent)]">{rest.join(" ")}</span>
            </>
          )}
        </h3>

        {summary && <p className="text-gray-500 text-sm mb-8 leading-relaxed grow">{summary}</p>}

        <div className="border-t border-gray-100 pt-6 mt-auto">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold">
              <Calendar size={14} />
              {formatDate(event.start_date)}
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold">
              <Clock size={14} />
              {formatTime(event.start_date)}
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold">
                <MapPin size={14} />
                {event.location}
              </div>
            )}
          </div>

          {!past && (
            <>
              {price !== null && (
                <p className="text-[var(--primary-blue)] text-sm font-semibold mb-3">
                  From {formatPrice(price)}
                </p>
              )}
              <Link
                href={`/events/${event.slug}`}
                className="block w-full bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white text-center py-3 rounded-lg transition-all duration-300 text-sm font-semibold"
              >
                View Details
              </Link>
            </>
          )}

          {past && (
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-2 text-[var(--orange-accent)] font-semibold text-xs tracking-widest uppercase"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
