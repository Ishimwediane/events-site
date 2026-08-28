import type { Metadata } from "next";
import Link from "next/link";
import { Layout, Ticket, Scan, Vote, Printer, ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import ServicesSection from "@/components/ServicesSection";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { solutions, brand } from "@/config/site";

const ICONS = {
  layout: Layout,
  ticket: Ticket,
  scan: Scan,
  vote: Vote,
  printer: Printer,
} as const;

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Event management, smart ticketing, hard ticket printing, entrance control and award voting — everything Ozone Entertainment runs for an event.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Offer"
        title="Our Services"
        intro="Everything it takes to put on a night and get people through the door — run by the people who stage the shows."
        image="/images/gallery/agaciro-edition-1/agaciro.jpg"
      />

      <ServicesSection showViewAll={false} />

      {/* Anchored detail for each service, linked from the cards above. */}
      <section className="section bg-[var(--bg-secondary)] pt-0">
        <div className="container-custom">
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-16">In Detail</MiniHeader>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto space-y-6">
            {solutions.map((service, i) => {
              const Icon = ICONS[service.icon];
              return (
                <ScrollReveal key={service.id} animation="fadeInUp" delay={(i % 3) * 0.1}>
                  <div
                    id={service.id}
                    className="scroll-mt-28 flex flex-col sm:flex-row gap-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-8 hover:border-[var(--orange-accent)]/50 transition-colors duration-500"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[var(--orange-accent)]/10 flex items-center justify-center text-[var(--orange-accent)] shrink-0">
                      <Icon size={24} />
                    </div>

                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold text-[var(--primary-blue)] mb-3">
                        {service.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-5">
                        {service.detail}
                      </p>
                      <Link
                        href={`/contact?about=${service.id}`}
                        className="inline-flex items-center gap-2 text-[var(--orange-accent)] font-semibold text-xs tracking-widest uppercase hover:gap-4 transition-all duration-300"
                      >
                        Talk to us about this <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-20 bg-[var(--bg-secondary)]">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto rounded-3xl bg-[var(--primary-blue)] p-10 md:p-14 text-center">
            <div className="eyebrow-ruled mb-6">
              <span className="rule" />
              <span className="label">Work With Us</span>
              <span className="rule" />
            </div>
            <h2 className="text-2xl md:text-4xl font-normal tracking-tight text-white/95 uppercase mb-4">
              Planning something?
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto mb-8">
              Tell us the date and the room and we will tell you what it takes. Call {brand.phone} or
              send a message and we will come back within 24 hours.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-lg tracking-wider uppercase text-sm font-semibold"
              >
                Get in Touch
              </Link>
              <Link
                href="/events"
                className="border-2 border-white/30 text-white hover:border-[var(--orange-accent)] hover:text-[var(--orange-accent)] px-8 py-3 rounded-lg transition-all duration-300 tracking-wider uppercase text-sm font-semibold"
              >
                See Our Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
