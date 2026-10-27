import Image from "next/image";
import { Mail, MessageCircle, Phone, Trophy } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { upcoming, upcomingWhatsappUrl } from "@/config/site";

/** Homepage call for the next upcoming event; hidden when `upcoming.open` is false. */
export default function UpcomingSection() {
  if (!upcoming.open) return null;

  const [firstWord, ...rest] = upcoming.name.split(" ");
  const subject = encodeURIComponent(`Registration: ${upcoming.name}`);

  return (
    <section className="py-20 bg-white relative overflow-hidden" id="upcoming">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--orange-accent)]/5 rounded-full blur-3xl -ml-32 -mt-32" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-5/12">
            <ScrollReveal animation="slideInLeft">
              <div className="relative bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 max-w-md mx-auto">
                <Image
                  src={upcoming.flyer}
                  alt={upcoming.flyerAlt}
                  width={810}
                  height={1080}
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="w-full h-auto"
                />
              </div>
            </ScrollReveal>
          </div>

          <div className="w-full lg:w-7/12 text-center lg:text-left">
            <ScrollReveal animation="slideInRight">
              <h2 className="text-[var(--orange-accent)] text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase mb-4 inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-px after:bg-[var(--orange-accent)]/30">
                Upcoming · Call for entries
              </h2>

              <p className="text-2xl md:text-3xl font-bold text-[var(--primary-blue)] mb-3 leading-tight font-heading">
                {firstWord}{" "}
                {rest.length > 0 && <span className="text-[var(--orange-accent)]">{rest.join(" ")}</span>}
              </p>
              <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-8">{upcoming.tagline}</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
                {upcoming.categories.map((c) => (
                  <div key={c.title} className="rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-[var(--primary-blue)] font-semibold">{c.title}</p>
                    <p className="text-gray-600 text-sm mb-3">{c.pitch}</p>
                    <p className="flex items-center gap-2 text-sm font-bold text-[var(--primary-blue)] mb-3">
                      <Trophy className="w-4 h-4 text-[var(--orange-accent)]" />
                      Win <span className="text-[var(--orange-accent)]">{c.prize}</span>
                    </p>
                    <ul className="space-y-1.5 text-gray-600 text-[13px] leading-relaxed list-disc pl-4">
                      {c.requirements.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6">
                <a
                  href={`mailto:${upcoming.email}?subject=${subject}`}
                  className="bg-[var(--orange-accent)] hover:opacity-90 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-xl flex items-center gap-2 text-[9px] tracking-[.3em] uppercase"
                >
                  <Mail className="w-5 h-5" />
                  Register now
                </a>
                <a
                  href={upcomingWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-xl flex items-center gap-2 text-[9px] tracking-[.3em] uppercase"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </a>
              </div>

              <div className="border-t border-gray-100 pt-5 text-left">
                <p className="text-gray-500 text-xs mb-2">To register or for more information:</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <a href={`mailto:${upcoming.email}`} className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold hover:text-[var(--orange-accent)] transition-colors">
                    <Mail className="w-4 h-4 text-[var(--orange-accent)]" />
                    {upcoming.email}
                  </a>
                  <a
                    href={upcomingWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[var(--primary-blue)] text-sm font-semibold hover:text-[#1DA851] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    WhatsApp +250 725 298 870
                  </a>
                  {upcoming.callNumbers.map((number) => (
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
