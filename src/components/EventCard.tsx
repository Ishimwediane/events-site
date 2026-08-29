import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { Event } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { formatDate, formatTimeRange, plainText, truncate } from "@/lib/format";

/**
 * The compact event card, matching the organiser platform's grid: flyer with a
 * category pill, title, the essentials, and a full-width action. Rendered in
 * this site's palette and type.
 */
export default function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const summary = truncate(plainText(event.description ?? ""), 120);

  return (
    <Link href={`/events/${event.slug}`} className="block h-full group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500 h-full flex flex-col border border-gray-100">
        <div className="relative h-40 w-full overflow-hidden p-2 pb-0">
          <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={imageUrl(event.flyer, FLYER_FALLBACK)}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {event.category_name && (
              <div className="absolute top-2 right-2 z-20">
                <span className="px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--orange-accent)] border border-[var(--orange-accent)]/20">
                  {event.category_name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex-1">
            <h3 className="text-base font-bold mb-1.5 leading-tight text-[var(--primary-blue)] group-hover:text-[var(--orange-accent)] transition-colors line-clamp-1">
              {event.title}
            </h3>

            {summary && (
              <p className="text-gray-400 text-xs font-medium leading-relaxed mb-3 line-clamp-2">
                {summary}
              </p>
            )}

            <div className="h-px w-full bg-gray-50 mb-3" />

            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Calendar className="w-3 h-3 text-gray-300" />
                {formatDate(event.start_date)}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Clock className="w-3 h-3 text-gray-300" />
                {formatTimeRange(event.start_date, event.end_date)}
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <span className="block w-full py-2.5 rounded-lg bg-[var(--orange-accent)] group-hover:bg-[var(--orange-hover)] transition-all text-white font-bold text-[11px] uppercase tracking-widest shadow-sm text-center">
              View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
