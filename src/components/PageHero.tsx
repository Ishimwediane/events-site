import Image from "next/image";
import type { ReactNode } from "react";
import ScrollReveal from "./ScrollReveal";

/**
 * The dark page header every inner page opens with: photo at 40% opacity under
 * a navy wash, then rule — orange eyebrow — rule, then the title.
 */
export default function PageHero({
  eyebrow,
  title,
  intro,
  image,
  height = "h-[60vh] md:h-[70vh]",
  compact = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image: string;
  height?: string;
  /** Smaller type, for titles that would otherwise wrap past two lines. */
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      className={`relative ${height} flex items-center justify-center overflow-hidden text-center bg-[var(--primary-blue)]`}
    >
      <div className="absolute inset-0 z-0">
        <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-blue)]/90 to-[var(--primary-blue)]/50" />
      </div>

      <div className="container-custom relative z-10 flex flex-col items-center">
        <ScrollReveal animation="fadeInUp">
          <div className="max-w-3xl flex flex-col items-center">
            <div className="eyebrow-ruled mb-6">
              <span className="rule" />
              <span className="label">{eyebrow}</span>
              <span className="rule" />
            </div>

            <h1
              className={`font-normal tracking-tight leading-tight text-white/95 uppercase mb-6 text-balance ${
                compact
                  ? "text-3xl md:text-4xl lg:text-5xl"
                  : "text-4xl md:text-5xl lg:text-6xl"
              }`}
            >
              {title}
            </h1>

            {intro && (
              <p className="text-sm md:text-base text-gray-200 leading-relaxed max-w-xl">{intro}</p>
            )}

            {children && <div className="mt-8">{children}</div>}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
