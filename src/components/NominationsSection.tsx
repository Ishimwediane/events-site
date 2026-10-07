import Image from "next/image";
import { MessageCircle, Phone } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { nominations, nominationsWhatsappUrl } from "@/config/site";

const STEPS = [
  {
    title: "Send the name and category",
    body: "Send your own name, or the name of the person you want to nominate, and the award category to our WhatsApp.",
  },
  {
    title: "Say why, with proof of work",
    body: "State your reasons for the nomination and attach proof of the nominee's work.",
  },
  {
    title: "Send a professional photo",
    body: "Send a professional picture of the nominee to the same WhatsApp number.",
  },
];

/** Homepage call for Agaciro Awards nominations; hidden when `nominations.open` is false. */
export default function NominationsSection() {
  if (!nominations.open) return null;

  const [firstWord, ...rest] = nominations.awardName.split(" ");

  return (
    <section className="py-20 bg-white relative overflow-hidden" id="nominations">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--orange-accent)]/5 rounded-full blur-3xl -ml-32 -mt-32" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <ScrollReveal animation="slideInLeft">
              <div className="relative bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100">
                <Image
                  src={nominations.flyer}
                  alt={nominations.flyerAlt}
                  width={1600}
                  height={1280}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="w-full h-auto"
                />
              </div>
            </ScrollReveal>
          </div>

          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <ScrollReveal animation="slideInRight">
              <h2 className="text-[var(--orange-accent)] text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase mb-4 inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-px after:bg-[var(--orange-accent)]/30">
                Nominations Are Open
              </h2>

              <p className="text-2xl md:text-3xl font-bold text-[var(--primary-blue)] mb-3 leading-tight font-heading">
                {firstWord}{" "}
                {rest.length > 0 && (
                  <span className="text-[var(--orange-accent)]">{rest.join(" ")}</span>
                )}
              </p>
              <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-8">
                Presented by {nominations.presentedBy}
              </p>

              <ol className="space-y-5 mb-8 text-left max-w-xl mx-auto lg:mx-0">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="flex items-start gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--orange-accent)] text-white text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[var(--primary-blue)] text-sm font-semibold">{step.title}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6">
                <a
                  href={nominationsWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-xl flex items-center gap-2 text-[9px] tracking-[.3em] uppercase"
                >
                  <MessageCircle className="w-5 h-5" />
                  Nominate on WhatsApp
                </a>
              </div>

              <div className="border-t border-gray-100 pt-5 text-left max-w-xl mx-auto lg:mx-0">
                <p className="text-gray-500 text-xs mb-2">For more information, call:</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {nominations.callNumbers.map((number) => (
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
