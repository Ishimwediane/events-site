import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — Events, Tickets & Award Voting`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Fashion shows, awards nights and live entertainment in Kigali. Reserve your seat, cast your vote, and browse the gallery.",
  openGraph: {
    siteName: brand.name,
    locale: "en_RW",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {/* Clears the fixed navbar. */}
        <main className="pt-[72px] md:pt-[76px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
