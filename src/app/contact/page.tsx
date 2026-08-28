import type { Metadata } from "next";
import Image from "next/image";
import { Phone, Mail, Smartphone, MapPin } from "lucide-react";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import ContactForm from "@/components/ContactForm";
import { brand, solutions } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reserve a table, ask about a ticket, or bring your brand to an Ozone Entertainment night.",
};

type Props = { searchParams: Promise<{ about?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { about } = await searchParams;
  const topic = solutions.find((s) => s.id === about);

  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Let's Talk"
        intro="Reserving a table, chasing a ticket, or bringing your brand to one of our nights? Talk to us."
        image="/images/gallery/agaciro-edition-1/event5.jpg"
      />

      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <InfoCard icon={Phone} title="Call Us" value={brand.phone} note={brand.phoneAlt} />
            <InfoCard icon={Mail} title="Email Us" value={brand.email} />
            <InfoCard
              icon={Smartphone}
              title="MoMo Pay"
              value={brand.momoCode}
              note={brand.legalName}
            />
            <InfoCard icon={MapPin} title="Visit Us" value={brand.address} note={brand.country} />
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <ScrollReveal animation="slideInLeft">
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold text-[var(--primary-blue)] mb-4">
                  Send Us a Message
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-md">
                  Tell us which event you are asking about and we will come back to you within 24
                  hours.
                </p>

                <ContactForm
                  defaultSubject={topic ? `Enquiry about ${topic.title}` : ""}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="slideInRight" delay={0.15}>
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
                  <Image
                    src="/images/gallery/agaciro-edition-1/model2.jpg"
                    alt="An Ozone Entertainment event"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                {/* Decorative dot grid and orange hatching from the original design. */}
                <div
                  className="absolute -bottom-8 -right-8 w-32 h-32 grid grid-cols-4 gap-2 opacity-30"
                  aria-hidden="true"
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 bg-[var(--primary-blue)] rounded-full" />
                  ))}
                </div>
                <div className="absolute -top-6 -left-6 w-20 h-20 overflow-hidden" aria-hidden="true">
                  <div className="absolute top-0 right-0 w-full h-0.5 bg-[var(--orange-accent)] rotate-45" />
                  <div className="absolute top-3 right-0 w-full h-0.5 bg-[var(--orange-accent)] rotate-45" />
                  <div className="absolute top-6 right-0 w-full h-0.5 bg-[var(--orange-accent)] rotate-45" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: typeof Phone;
  title: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-[var(--tint-blue)] rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-[var(--primary-blue)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--primary-blue)] mt-4 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm break-words">{value}</p>
      {note && <p className="text-gray-400 text-[13px] mt-0.5 break-words">{note}</p>}
    </div>
  );
}
