import Link from "next/link";
import { Layout, Ticket, Scan, Vote, Printer } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import MiniHeader from "./MiniHeader";
import { solutions } from "@/config/site";

const ICONS = { layout: Layout, ticket: Ticket, scan: Scan, vote: Vote, printer: Printer } as const;

/**
 * The event services as the /events page presents them — icon cards at
 * aspect-[4/5]. The home page uses the navy-card treatment in
 * ServicesSection instead; both layouts exist on the Ozone website.
 */
export default function SolutionsSection({
  heading = "Event Management Solutions",
}: {
  heading?: string;
}) {
  return (
    <section className="py-20 bg-[var(--bg-secondary)]">
      <div className="container-custom">
        <ScrollReveal animation="fadeInDown">
          <MiniHeader className="mb-16">{heading}</MiniHeader>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {solutions.map((solution, i) => {
            const Icon = ICONS[solution.icon];
            return (
              <ScrollReveal key={solution.id} animation="scaleIn" delay={i * 0.1} className="h-full">
                <Link
                  href={`/services#${solution.id}`}
                  id={solution.id}
                  className="group relative flex flex-col items-start justify-end p-6 bg-[var(--bg-primary)] rounded-3xl overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-[var(--orange-accent)]/10 hover:-translate-y-2 h-full border border-[var(--border-color)] hover:border-[var(--orange-accent)] aspect-square md:aspect-[4/5]"
                >
                  <div className="mb-auto w-12 h-12 rounded-2xl bg-[var(--orange-accent)]/10 flex items-center justify-center text-[var(--orange-accent)] transition-transform duration-500 group-hover:scale-110">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--orange-accent)] transition-colors duration-500">
                    {solution.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-8 italic opacity-80">
                    {solution.description}
                  </p>

                  <div className="flex items-center justify-between w-full mt-auto">
                    <div className="w-8 h-0.5 bg-[var(--orange-accent)]/50 group-hover:w-16 group-hover:bg-[var(--orange-accent)] transition-all duration-700" />
                    <span className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] uppercase text-[var(--orange-accent)] border border-[var(--orange-accent)]/30 px-3 py-1.5 rounded-full group-hover:bg-[var(--orange-accent)] group-hover:text-white transition-all whitespace-nowrap">
                      Work With Us
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
