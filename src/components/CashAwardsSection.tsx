import Image from "next/image";
import Link from "next/link";
import { Check, Vote } from "lucide-react";
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
        <div className="flex flex-col lg:flex-row items-center gap-10 xl:gap-14">
          <div className="w-full lg:w-5/12">
            <ScrollReveal animation="slideInLeft">
              <div className="relative bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 max-w-md lg:max-w-none mx-auto">
                <Image
                  src={cashAwards.flyer}
                  alt={cashAwards.flyerAlt}
                  width={1254}
                  height={1254}
                  sizes="(min-width: 1024px) 500px, 100vw"
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

              <p className="text-2xl md:text-4xl font-bold text-[var(--primary-blue)] mb-4 leading-tight font-heading">
                {firstWord}{" "}
                {rest.length > 0 && <span className="text-[var(--orange-accent)]">{rest.join(" ")}</span>}
              </p>
              <p className="text-gray-600 text-sm md:text-base mb-8">{cashAwards.intro}</p>

              {/* The flyer already shows the prizes, date, place and phone numbers; only the rules are added here. */}
              <p className="text-[var(--primary-blue)] text-sm font-semibold mb-3 text-left">How it works</p>
              <ul className="space-y-3 text-gray-600 text-sm leading-relaxed text-left mb-10">
                {cashAwards.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <Check className="w-4 h-4 mt-1 shrink-0 text-[var(--orange-accent)]" />
                    {rule}
                  </li>
                ))}
              </ul>

              <div className="flex justify-center lg:justify-start">
                <Link
                  href={cashAwards.votePath}
                  className="bg-[var(--orange-accent)] hover:opacity-90 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-xl flex items-center gap-2 text-[9px] tracking-[.3em] uppercase"
                >
                  <Vote className="w-5 h-5" />
                  Vote now
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
