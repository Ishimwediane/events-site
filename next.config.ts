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
};

export default nextConfig;
