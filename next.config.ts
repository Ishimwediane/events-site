import type { NextConfig } from "next";

/**
 * The organiser dashboard, gate scanner and sign-up flow (/dashboard, /admin,
 * /login, /register, /scan, /pending, /apply, /company, /payment-return) used
 * to be a separate app on events.ozoneentertainmentz.com that this site
 * proxied. They are now part of this site (src/platform + those routes), so
 * nothing is forwarded any more.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ozoneentertainmentz.com/api";
const apiHost = new URL(API_URL).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Event flyers and nominee photos are stored on Cloudinary by the Django backend.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Local media served by `manage.py runserver` during development.
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      // Media the dashboard shows straight from the API (logos, ticket templates).
      { protocol: "https", hostname: apiHost, pathname: "/media/**" },
    ],
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
