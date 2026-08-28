import Link from "next/link";
import Hero from "@/components/Hero";
import FeaturedEvent from "@/components/FeaturedEvent";
import ServicesSection from "@/components/ServicesSection";
import EventCard from "@/components/EventCard";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { getEvents, splitByDate } from "@/lib/api";
import { isEnabled } from "@/config/site";

export default async function HomePage() {
  const events = isEnabled("events") ? await getEvents() : [];
  const { upcoming, past } = splitByDate(events);

  const featured = upcoming[0] ?? null;
  const alsoUpcoming = upcoming.slice(1, 4);

  return (
    <>
      <Hero />

      {featured && <FeaturedEvent event={featured} />}

      {alsoUpcoming.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <ScrollReveal animation="fadeInDown">
              <MiniHeader className="mb-12">Also Coming Up</MiniHeader>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {alsoUpcoming.map((event, i) => (
                <ScrollReveal key={event.id} animation="scaleIn" delay={i * 0.1}>
                  <EventCard event={event} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* With nothing scheduled, point people at the archive rather than an empty page. */}
      {!featured && isEnabled("events") && (
        <section className="py-20 bg-white">
          <div className="container-custom text-center">
            <MiniHeader className="mb-6">Between Shows</MiniHeader>
            <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Nothing is on sale right now. Have a look at what we have already staged, or get in
              touch about your own event.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {isEnabled("gallery") && (
                <Link href="/gallery" className="btn-primary">
                  View the Gallery
                </Link>
              )}
              <Link href="/contact" className="btn-outline">
                Work With Us
              </Link>
            </div>
          </div>
        </section>
      )}

      <ServicesSection />

      {past.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <ScrollReveal animation="fadeInDown">
              <MiniHeader className="mb-12">Event History</MiniHeader>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {past.slice(0, 3).map((event, i) => (
                <ScrollReveal key={event.id} animation="scaleIn" delay={i * 0.1}>
                  <EventCard event={event} past />
                </ScrollReveal>
              ))}
            </div>

            {past.length > 3 && (
              <div className="flex justify-center mt-12">
                <Link href="/events" className="btn-outline">
                  See All Events
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
