import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import MiniHeader from "./MiniHeader";
import { solutions } from "@/config/site";

/**
 * The navy card grid from the Ozone Entertainment website, reproduced exactly:
 * #08283B blocks at aspect-[16/11], copy anchored bottom-left, the title going
 * orange on hover, and the short rule that doubles in width. Only the content
 * differs — the five event services rather than the old photography, film,
 * modelling and artist-management lines.
 *
 * Row one holds three cards; row two holds the rest plus the "View All
 * Services" slot, as on the original.
 */
export default function ServicesSection({
  heading = "Our Services",
  showViewAll = true,
}: {
  heading?: string;
  showViewAll?: boolean;
}) {
  const firstRow = solutions.slice(0, 3);
  const secondRow = solutions.slice(3);

  return (
    <section className="section bg-[var(--bg-primary)]">
      <div className="container-custom">
        <ScrollReveal animation="fadeInDown">
          <MiniHeader>{heading}</MiniHeader>
        </ScrollReveal>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {firstRow.map((service, index) => (
              <ScrollReveal
                key={service.id}
                animation="scaleIn"
                delay={index * 0.1}
                className="h-full"
              >
                <ServiceCard service={service} />
              </ScrollReveal>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {secondRow.map((service, index) => (
              <ScrollReveal
                key={service.id}
                animation="scaleIn"
                delay={(index + 3) * 0.1}
                className="h-full"
              >
                <ServiceCard service={service} />
              </ScrollReveal>
            ))}

            {showViewAll && (
              <ScrollReveal animation="scaleIn" delay={0.5} className="h-full">
                <Link
                  href="/services"
                  className="group relative flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] rounded-3xl overflow-hidden transition-all duration-700 hover:-translate-y-2 h-full text-center border border-[var(--border-color)] hover:border-[var(--orange-accent)]"
                >
                  <div className="w-16 h-16 rounded-full border border-[var(--orange-accent)]/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[var(--orange-accent)] transition-all duration-500">
                    <ArrowRight className="w-8 h-8 text-[var(--orange-accent)]" />
                  </div>
                  <h3 className="text-2xl text-[var(--text-primary)] mb-2">View All Services</h3>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--orange-accent)] opacity-80">
                    Full Expertise
                  </p>
                </Link>
              </ScrollReveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
}: {
  service: { id: string; title: string; description: string };
}) {
  return (
    <div
      className="group relative rounded-3xl overflow-hidden transition-all duration-700 hover:-translate-y-2 h-full aspect-[16/11]"
      style={{ backgroundColor: "#08283B" }}
    >
      <div className="absolute inset-0 flex flex-col items-start justify-end p-8 text-left z-10">
        <h3 className="text-xl md:text-2xl text-white mb-2 transform transition-all duration-700 group-hover:text-[var(--orange-accent)] tracking-tight">
          {service.title}
        </h3>

        <p className="text-[10px] md:text-xs text-white/90 leading-[1.6] mb-1">
          {service.description}
        </p>

        <div className="mt-4 w-8 h-[2px] bg-[var(--orange-accent)]/50 group-hover:w-16 group-hover:bg-[var(--orange-accent)] transition-all duration-700" />
      </div>

      <Link
        href={`/services#${service.id}`}
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label={`View ${service.title} details`}
      />
    </div>
  );
}
