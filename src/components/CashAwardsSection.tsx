import Link from "next/link";
import { Check, Trophy } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { cashAwards, isEnabled } from "@/config/site";

/** Podium order on wide screens: 2nd · 1st · 3rd. On phones they stack 1st, 2nd, 3rd. */
const PODIUM = ["md:order-2", "md:order-1", "md:order-3"];

/** Homepage block for Edition 3's Top 3 Voting Cash Awards; hidden when `cashAwards.open` is false. */
export default function CashAwardsSection() {
  if (!cashAwards.open || !isEnabled("voting")) return null;

  return (
    <section className="py-20 bg-[var(--primary-blue)] relative overflow-hidden" id="cash-awards">
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[var(--orange-accent)]/10 rounded-full blur-3xl -mr-32 -mb-32" />

      <div className="container-custom relative z-10">
        <ScrollReveal animation="fadeInDown">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-[var(--orange-accent)] text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase mb-4">
              {cashAwards.edition}
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight font-heading">{cashAwards.title}</p>
            <p className="text-gray-300 text-sm md:text-base">{cashAwards.tagline}</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:items-end max-w-4xl mx-auto mb-12">
          {cashAwards.prizes.map((p, i) => {
            const first = i === 0;
            return (
              <ScrollReveal key={p.place} animation="scaleIn" delay={i * 0.1} className={PODIUM[i]}>
                <div
                  className={`rounded-xl text-center px-6 ${first
                    ? "bg-white py-10 shadow-2xl ring-2 ring-[var(--orange-accent)]"
                    : "bg-white/5 border border-white/10 py-8"}`}
                >
                  <Trophy className={`mx-auto mb-3 ${first ? "w-9 h-9 text-[var(--orange-accent)]" : "w-7 h-7 text-[var(--orange-accent)]/80"}`} />
                  <p className={`text-[10px] font-semibold tracking-[0.3em] uppercase mb-2 ${first ? "text-[var(--orange-accent)]" : "text-gray-400"}`}>
                    {p.place} place
                  </p>
                  <p className={`font-heading font-bold leading-none mb-1 ${first ? "text-4xl text-[var(--primary-blue)]" : "text-3xl text-white"}`}>
                    {p.amount}
                  </p>
                  <p className={`text-xs font-semibold mb-4 ${first ? "text-[var(--primary-blue)]/70" : "text-gray-400"}`}>RWF</p>
                  <p className={`text-sm font-semibold ${first ? "text-[var(--primary-blue)]" : "text-gray-200"}`}>{p.name}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal animation="fadeInUp">
          <div className="max-w-3xl mx-auto">
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-10">
              {cashAwards.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-gray-300 text-[13px] leading-relaxed">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--orange-accent)]" />
                  {rule}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <Link href={cashAwards.votePath} className="btn-primary">
                Vote now
              </Link>
              <p className="text-gray-400 text-xs">
                Total prize money <span className="text-white font-semibold">{cashAwards.total} RWF</span>
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
