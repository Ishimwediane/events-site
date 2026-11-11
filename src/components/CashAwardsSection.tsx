import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, MapPin, Phone, Trophy, Vote } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { cashAwards, isEnabled } from "@/config/site";

/**
 * Homepage announcement for Edition 3's Top 3 Voting Cash Awards, in the same
 * layout as the upcoming-event call (flyer left, details right). Hidden when
 * `cashAwards.open` is false.
 */
export default function CashAwardsSection() {
  if (!cashAwards.open || !isEnabled("voting")) return null;

  const [firstWord, ...rest] = cashAwards.title.split(" ");

  return (
    <section className="py-20 bg-white relative overflow-hidden" id="cash-awards">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--orange-accent)]/5 rounded-full blur-3xl -ml-32 -mt-32" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-5/12">
            <ScrollReveal animation="slideInLeft">
              <div className="relative bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 max-w-md mx-auto">
                <Image
                  src={cashAwards.flyer}
                  alt={cashAwards.flyerAlt}
                  width={1254}
                  height={1254}
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="w-full h-auto"
                />
              </div>
            </ScrollReveal>
          </div>

          <div className="w-full lg:w-7/12 text-center lg:text-left">
            <ScrollReveal animation="slideInRight">
              <h2 className="text-[var(--orange-accent)] text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase mb-4 inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-px after:bg-[var(--orange-accent)]/30">
                {cashAwards.edition}
              </h2>

              <p className="text-2xl md:text-3xl font-bold text-[var(--primary-blue)] mb-3 leading-tight font-heading">
                {firstWord}{" "}
                {rest.length > 0 && <span className="text-[var(--orange-accent)]">{rest.join(" ")}</span>}
              </p>
              <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-4">{cashAwards.tagline}</p>
              <p className="text-gray-600 text-sm md:text-base mb-8">{cashAwards.intro}</p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
                {cashAwards.prizes.map((p, i) => (
                  <div
                    key={p.place}
                    className={`rounded-xl border p-5 shadow-sm ${i === 0 ? "border-[var(--orange-accent)]/40 bg-[var(--orange-accent)]/5" : "border-gray-100"}`}
                  >
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--orange-accent)] mb-2">
                      <Trophy className="w-4 h-4" />
                      {p.place} place
                    </p>
                    <p className="text-[var(--primary-blue)] font-bold text-xl leading-tight">
                      {p.amount} <span className="text-xs font-semibold">RWF</span>
                    </p>
                    <p className="text-gray-600 text-[13px] mt-1">{p.name}</p>
                  </div>
                ))}
              </div>

              <ul className="space-y-1.5 text-gray-600 text-[13px] leading-relaxed text-left mb-8">
                {cashAwards.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--orange-accent)]" />
                    {rule}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6">
                <Link
                  href={cashAwards.votePath}
                  className="bg-[var(--orange-accent)] hover:opacity-90 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-xl flex items-center gap-2 text-[9px] tracking-[.3em] uppercase"
                >
                  <Vote className="w-5 h-5" />
                  Vote now
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-5 text-left">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3">
                  <span className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold">
                    <CalendarDays className="w-4 h-4 text-[var(--orange-accent)]" />
                    {cashAwards.eventDate}
                  </span>
                  <span className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold">
                    <MapPin className="w-4 h-4 text-[var(--orange-accent)]" />
                    {cashAwards.eventPlace}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mb-2">For sponsorship and enquiries, call:</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {cashAwards.callNumbers.map((number) => (
                    <a
                      key={number}
                      href={`tel:${number.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold hover:text-[var(--orange-accent)] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[var(--orange-accent)]" />
                      {number}
                    </a>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
