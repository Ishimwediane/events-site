import Image from "next/image";
import { Quote } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { testimonials } from "@/config/site";

const AVATAR_TINT = {
  navy: "bg-[var(--primary-blue)]/10",
  orange: "bg-[var(--orange-accent)]/10",
} as const;

/**
 * The tilted quote cards from the Ozone Entertainment website: rounded-3xl,
 * alternating rotation that straightens on hover, the orange quote mark bottom
 * right. Content comes from src/config/site.ts.
 */
export default function TestimonialsSection() {
  if (testimonials.length === 0) return null;

  return (
    <section className="section bg-gray-50">
      <div className="container-custom">
        <ScrollReveal animation="fadeInDown" className="text-left mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary-blue)]">
            Real Stories. Real People. Real Excellence.
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <ScrollReveal
              key={`${t.name}-${index}`}
              animation="fadeInUp"
              delay={index * 0.1}
              className="h-full"
            >
              <div
                className={`bg-white ${t.rotation} rounded-3xl p-8 relative transition-all duration-500 hover:rotate-0 hover:-translate-y-2 hover:shadow-xl border border-gray-200 h-full flex flex-col`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`relative w-12 h-12 ${AVATAR_TINT[t.tint]} rounded-full flex items-center justify-center overflow-hidden shrink-0`}
                  >
                    {t.avatar ? (
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--primary-blue)]">
                        {t.name.replace(/[^A-Za-z]/g, "").slice(0, 1) || "—"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--primary-blue)]">{t.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-6 grow">{t.content}</p>

                <div className="flex justify-end">
                  <Quote
                    className="w-8 h-8 text-[var(--orange-accent)] opacity-40"
                    fill="currentColor"
                  />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
