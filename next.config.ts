import type { NextConfig } from "next";

/**
 * The organiser dashboard, ticket checkout and gate scanner are a separate
 * Next.js app (../frontend), deployed as the `event` Vercel project on
 * events.ozoneentertainmentz.com. This site hands those paths over to it.
 */
const PLATFORM_URL = (
  process.env.NEXT_PUBLIC_PLATFORM_URL || "https://events.ozoneentertainmentz.com"
).replace(/\/$/, "");

/**
 * Paths this site forwards to the platform.
 *
 * Deliberately NOT listed: /events, /voting, /contact and /services. The
 * platform has pages at all four, but so does this site, and this site owns
 * them — forwarding those would send visitors away from the public site.
 * /item-details-demo is also left out; it is a demo page.
 */
const PLATFORM_PATHS = [
  "/login",
  "/register",
  "/dashboard",
  "/admin",
  "/scan",
  "/pending",
  "/payment-complete",
  "/payment-return",
  // The organiser sign-up flow. Nothing on the public site links to it, but the
  // URLs keep working for anyone who has them.
  "/apply",
  "/company",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Event flyers and nominee photos are stored on Cloudinary by the Django backend.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Local media served by `manage.py runserver` during development.
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
    ],
  },

  /**
   * Proxy the platform's pages so they are served AT this domain — the address
   * bar stays on ozoneentertainmentz.com instead of jumping to the events
   * subdomain.
   *
   * This only works because the platform sets `assetPrefix` to its own origin
   * (see ../frontend/next.config.ts). Without that, its HTML would ask this
   * domain for /_next/* and collide with this site's own chunks, and the
   * dashboard would load the wrong JavaScript.
   */
  async rewrites() {
    return PLATFORM_PATHS.flatMap((path) => [
      { source: path, destination: `${PLATFORM_URL}${path}` },
      { source: `${path}/:path+`, destination: `${PLATFORM_URL}${path}/:path+` },
    ]);
  },

  async redirects() {
    return [
      /**
       * This site replaced the previous corporate site on the same domain, so
       * that site's URLs are redirected rather than left to 404. Permanent here,
       * because the content really did move.
       *
       * Kept in next.config.ts instead of vercel.json so they survive a move to
       * any other host.
       */
      { source: "/portfolio", destination: "/gallery", permanent: true },

      // /services still exists, with the event services. Only the old
      // photography / film / modelling / artist-management pages redirect.
      { source: "/about", destination: "/", permanent: true },
      { source: "/services/naf-model-empire", destination: "/", permanent: true },
      { source: "/services/artist-management", destination: "/", permanent: true },
      { source: "/services/film-production", destination: "/", permanent: true },
      { source: "/services/photography", destination: "/", permanent: true },
      // `:path+` not `:path*` — the star form matches zero segments too, which
      // would swallow /services itself and redirect the real page away.
      { source: "/services/:path+", destination: "/", permanent: true },

      // Old hand-built event pages now come from the API under /events.
      { source: "/events/agaciro-fashion-gala", destination: "/events", permanent: true },
      { source: "/events/agaciro-fashion-gala/:path*", destination: "/events", permanent: true },
      { source: "/events/agaciro-gala-partnership", destination: "/events", permanent: true },
      { source: "/events/empowering-her-partnership", destination: "/events", permanent: true },
    ];
  },
};

export default nextConfig;
