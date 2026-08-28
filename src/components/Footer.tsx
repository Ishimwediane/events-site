import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Smartphone } from "lucide-react";
import { brand, navLinks, solutions } from "@/config/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4">
            <Link href="/" className="group inline-block">
              <div className="relative w-24 h-24 transition-transform duration-300 group-hover:scale-110">
                <Image src="/logo.png" alt={brand.name} fill className="object-contain" />
              </div>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed">{brand.tagline}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary-blue)]">Quick Links</h3>
            <ul className="space-y-2">
              {navLinks().map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300 text-sm inline-flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-[var(--orange-accent)] transition-all duration-300 mr-0 group-hover:mr-2" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary-blue)]">What We Do</h3>
            <ul className="space-y-2">
              {solutions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/contact?about=${s.id}`}
                    className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300 text-sm inline-flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-[var(--orange-accent)] transition-all duration-300 mr-0 group-hover:mr-2" />
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary-blue)]">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[var(--orange-accent)] flex-shrink-0 mt-0.5" />
                <a
                  href={`tel:${brand.phone.replace(/\s/g, "")}`}
                  className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300 text-sm"
                >
                  {brand.phone}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-[var(--orange-accent)] flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${brand.email}`}
                  className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300 text-sm break-all"
                >
                  {brand.email}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-[var(--orange-accent)] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">
                  MoMo {brand.momoCode}
                  <span className="block text-gray-400 text-xs">{brand.legalName}</span>
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[var(--orange-accent)] flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">{brand.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 text-sm text-center md:text-left">
              &copy; {year} {brand.name}. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
