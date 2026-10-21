import { envOr } from "./env";
/**
 * Flyers and nominee photos come back from Django either as a full Cloudinary
 * URL or as a relative media path, depending on how the record was created.
 * Normalise both into something <Image> can load.
 */
const API_ORIGIN = envOr(process.env.NEXT_PUBLIC_API_URL, "https://api.ozoneentertainmentz.com/api").replace(
  /\/api\/?$/,
  "",
);

/**
 * Uploads are often straight off a camera (8 MB, 4545x3636). Vercel's resizer
 * gives up on those and sends the original, which a phone has to decode at
 * ~60 MB each — a few in view and iOS kills the tab ("Can't open this page").
 * So Cloudinary hands over a copy capped at 1600 px, ~150 KB, before Vercel
 * resizes it further.
 */
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;
const CLOUDINARY_CAP = "c_limit,w_1600,h_1600,q_auto/";

export function imageUrl(src: string | null | undefined, fallback: string): string {
  if (!src) return fallback;
  if (CLOUDINARY_UPLOAD.test(src)) return src.replace(CLOUDINARY_UPLOAD, `$1${CLOUDINARY_CAP}`);
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/media/")) return `${API_ORIGIN}${src}`;
  // Django stores some paths as "media/events/flyers/x.jpg" with no leading slash.
  if (src.startsWith("media/")) return `${API_ORIGIN}/${src}`;
  if (src.startsWith("/")) return src;
  return `${API_ORIGIN}/media/${src}`;
}

/** Shown wherever an event has no flyer uploaded yet. */
export const FLYER_FALLBACK = "/images/event.jpg";
