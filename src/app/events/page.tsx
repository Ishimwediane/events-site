import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import PageHero from "@/components/PageHero";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import EventCard from "@/components/EventCard";
import SolutionsSection from "@/components/SolutionsSection";
import { getEvents, splitByDate } from "@/lib/api";
import { isEnabled } from "@/config/site";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Every Ozone Entertainment show — what is coming up, what is on sale, and what we have already staged.",
};

export default async function EventsPage() {
  if (!isEnabled("events")) notFound();

  const events = await getEvents();
  const { upcoming, past } = splitByDate(events);

  return (
    <>
      <PageHero
        eyebrow={upcoming[0] ? "Next Up" : "Premium Events"}
        title="Professional Management. Unforgettable Experiences."
        image="/images/hero-events.jpg"
      />

      <section className="py-20 bg-white">
        <div className="container-custom">
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-12">Upcoming Events</MiniHeader>
          </ScrollReveal>

          {upcoming.length === 0 ? (
            <div className="max-w-xl mx-auto text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 py-16 px-8">
              <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">
                Nothing scheduled yet
              </h3>
              <p className="text-sm text-gray-500">
                New shows are published here as soon as tickets go on sale.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {upcoming.map((event, i) => (
                <ScrollReveal key={event.id} animation="scaleIn" delay={(i % 4) * 0.1}>
                  <EventCard event={event} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="py-20 bg-white text-[var(--primary-blue)]">
          <div className="container-custom">
            <ScrollReveal animation="fadeInDown">
              <MiniHeader className="mb-12">Event History</MiniHeader>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {past.map((event, i) => (
                <ScrollReveal key={event.id} animation="scaleIn" delay={(i % 4) * 0.1}>
                  <EventCard event={event} past />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <SolutionsSection />
    </>
  );
}
