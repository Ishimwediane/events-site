import { envOr } from "./env";
/**
 * Flyers and nominee photos come back from Django either as a full Cloudinary
 * URL or as a relative media path, depending on how the record was created.
 * Normalise both into something <Image> can load.
 */
const API_ORIGIN = envOr(process.env.NEXT_PUBLIC_API_URL, "https://event-backend-tex3.onrender.com/api").replace(
  /\/api\/?$/,
  "",
);

export function imageUrl(src: string | null | undefined, fallback: string): string {
  if (!src) return fallback;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/media/")) return `${API_ORIGIN}${src}`;
  // Django stores some paths as "media/events/flyers/x.jpg" with no leading slash.
  if (src.startsWith("media/")) return `${API_ORIGIN}/${src}`;
  if (src.startsWith("/")) return src;
  return `${API_ORIGIN}/media/${src}`;
}

/** Shown wherever an event has no flyer uploaded yet. */
export const FLYER_FALLBACK = "/images/event.jpg";
