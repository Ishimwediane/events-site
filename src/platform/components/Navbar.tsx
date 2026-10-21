"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Search, User as UserIcon, Menu, X } from "lucide-react";
import { authService } from "@/platform/services/auth.service";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [now, setNow] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = () => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
      }
    };
    checkUser();

    // Live clock
    const tick = () => {
      const d = new Date();
      setNow(
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) +
        " · " +
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "Voting", href: "/voting" },
    { name: "Contact", href: "/contact" },
    { name: "Services", href: "/services" },
  ];

  if (user?.role === "COMPANY") {
    navLinks.push({ name: "Dashboard", href: "/dashboard" });
  }
  if (user?.role === "ADMIN") {
    navLinks.push({ name: "Admin Panel", href: "/dashboard/admin" });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "#08283B" }}>
      {/* ── ROW 1: Logo | Center label | Right actions ── */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-16 flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center p-0.5 border border-white/5 group-hover:border-primary/30 transition-all">
              <Image
                src="/image/logo.jpg"
                alt="OZONE EVENT Logo"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            <span
              className="text-xl font-bold tracking-tight text-white"
              style={{ fontFamily: "Georgia, serif", letterSpacing: "0.02em" }}
            >
              OZONE EVENT
            </span>
          </Link>


          {/* Right actions */}
          <div className="hidden md:flex items-center gap-5">
            {/* Clock */}
            <span className="text-[10px] text-white font-mono tracking-widest">{now}</span>

            <div className="w-px h-4 bg-white/10" />

            {/* Search icon */}
            <button className="text-white hover:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </button>

            {/* Auth */}
            {user ? (
              <>
                <span className="text-[11px] text-white font-semibold">
                  {user.email.split("@")[0]}
                </span>
                <button
                  onClick={() => authService.logout()}
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-[11px] font-semibold text-white hover:text-primary transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                {/* CTA button — dark bordered like reference */}
                <Link
                  href="/company/register"
                  className="text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── ROW 2: Nav links centered ── */}
      <div className="hidden md:flex items-center justify-center gap-10 h-10 border-b border-white/5">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white hover:text-primary transition-colors"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: "#08283B" }}
            className="flex flex-col gap-4 px-6 py-6 border-t border-white/5 overflow-hidden md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-white hover:text-primary uppercase tracking-widest"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => authService.logout()}
                className="text-sm font-bold text-red-400 text-left"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="btn-primary w-full text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
