"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { brand, navLinks, isEnabled } from "@/config/site";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = navLinks();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on navigation, and stop the page scrolling behind it.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md shadow-lg ${
        scrolled ? "py-1.5" : "py-2"
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group" aria-label={brand.name}>
            <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110">
              <Image src="/logos.png" alt={brand.name} fill className="object-contain" priority />
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`transition-all duration-300 hover:text-[var(--orange-accent)] animated-underline ${
                  isActive(link.href)
                    ? "text-[var(--orange-accent)] font-medium"
                    : "text-gray-700"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isEnabled("tickets") && (
              <Link
                href="/events"
                className="bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-5 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm whitespace-nowrap"
              >
                Buy Tickets
              </Link>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg transition-colors duration-300 text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 h-[100dvh] z-99 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-[400px] bg-white z-100 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 -ml-2 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-8 h-8 font-light" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xl font-medium text-gray-900 py-2.5 border-b border-gray-200 transition-all duration-200 hover:pl-2 hover:text-[var(--orange-accent)]"
                >
                  {link.name}
                </Link>
              ))}

              {isEnabled("tickets") && (
                <div className="mt-6">
                  <Link
                    href="/events"
                    className="block w-full text-center bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium shadow-md"
                  >
                    Buy Tickets
                  </Link>
                </div>
              )}

              <div className="mt-8 space-y-3 pt-6 border-t border-gray-100">
                <Link href="/contact" className="block text-sm text-gray-600 hover:text-gray-900">
                  Get Assistance
                </Link>
                <p className="text-sm text-gray-500 mt-6">
                  &copy; {new Date().getFullYear()} {brand.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
