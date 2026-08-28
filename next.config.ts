import type { NextConfig } from "next";

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
   * This site replaces the previous corporate site on the same domain, so the
   * URLs that site had are redirected rather than left to 404 — old links,
   * shared posts and search results keep working.
   *
   * Kept in next.config.ts instead of vercel.json so they survive a move to
   * any other host.
   */
  async redirects() {
    return [
      // The portfolio became the events-only gallery.
      { source: "/portfolio", destination: "/gallery", permanent: true },

      // The service lines are gone; "What We Do" on the home page replaces them.
      { source: "/about", destination: "/", permanent: true },
      { source: "/services", destination: "/", permanent: true },
      { source: "/services/naf-model-empire", destination: "/", permanent: true },
      { source: "/services/artist-management", destination: "/", permanent: true },
      { source: "/services/film-production", destination: "/", permanent: true },
      { source: "/services/photography", destination: "/", permanent: true },
      { source: "/services/:path*", destination: "/", permanent: true },

      // Old hand-built event pages now come from the API under /events.
      { source: "/events/agaciro-fashion-gala", destination: "/events", permanent: true },
      { source: "/events/agaciro-fashion-gala/:path*", destination: "/events", permanent: true },
      { source: "/events/agaciro-gala-partnership", destination: "/events", permanent: true },
      { source: "/events/empowering-her-partnership", destination: "/events", permanent: true },
    ];
  },
};

export default nextConfig;
