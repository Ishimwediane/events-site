import Image from "next/image";
import ScrollReveal from "./ScrollReveal";
import { partners } from "@/config/site";

/**
 * The partner logo row from the Ozone Entertainment website, unchanged: a
 * white band above a top border, three logos with the middle one larger.
 */
export default function PartnersSection() {
  if (partners.length === 0) return null;

  return (
    <section className="section bg-white border-t border-gray-200">
      <div className="container-custom">
        <ScrollReveal animation="fadeInDown" className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--primary-blue)] mb-3">
            Our Partners
          </h2>
          <p className="text-sm text-gray-600">Trusted by leading brands and organizations</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          {partners.map((partner, index) => (
            <ScrollReveal
              key={partner.name}
              animation="fadeInUp"
              delay={index * 0.1}
              className="flex justify-center"
            >
              <div
                className={`relative transition-transform duration-500 hover:scale-105 ${
                  index === 1 ? "w-80 h-40" : "w-60 h-28"
                }`}
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  sizes="320px"
                  className="object-contain"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
