import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import GalleryGrid from "@/components/GalleryGrid";
import { photoCount, albums } from "@/data/gallery";
import { getEvents, splitByDate } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { isEnabled } from "@/config/site";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Runways, red carpets and awards nights from every Ozone Entertainment production.",
};

export default async function GalleryPage() {
  if (!isEnabled("gallery")) notFound();

  // Upcoming events get a filter chip too, so people can see what is coming and
  // that photos will land there — rather than the event simply being absent.
  const events = isEnabled("events") ? await getEvents() : [];
  const { upcoming } = splitByDate(events);
  const shot = new Set(albums.map((a) => a.id));

  const pendingAlbums = upcoming
    .filter((event) => !shot.has(event.slug))
    .slice(0, 3)
    .map((event) => ({
      id: event.slug,
      label: event.title.length > 22 ? `${event.title.slice(0, 21)}…` : event.title,
      date: formatDate(event.start_date),
    }));

  const total = photoCount();

  return (
    <>
      <PageHero
        eyebrow="The Archive"
        title="Every Moment Captured"
        intro="Runways, red carpets and awards nights from every production we have staged."
        image="/images/gallery/agaciro-edition-1/event333.jpg"
      />

      <section className="py-20 bg-white">
        <div className="container-custom">
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-4">Event Photos</MiniHeader>
          </ScrollReveal>

          <p className="text-center text-gray-500 text-sm mb-10">
            {total} {total === 1 ? "photo" : "photos"} across {albums.length}{" "}
            {albums.length === 1 ? "event" : "events"}
          </p>

          <GalleryGrid pendingAlbums={pendingAlbums} />
        </div>
      </section>
    </>
  );
}
