"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { X, ImageIcon } from "lucide-react";
import { albums, allPhotos, type Photo, type Album } from "@/data/gallery";

const PAGE_SIZE = 12;

export default function GalleryGrid({
  /** Slugs of upcoming events that have no photos yet, shown as an empty chip. */
  pendingAlbums = [],
}: {
  pendingAlbums?: { id: string; label: string; date: string }[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<(Photo & { album: Album }) | null>(null);

  const photos = useMemo(() => {
    const all = allPhotos();
    return filter === "all" ? all : all.filter((p) => p.album.id === filter);
  }, [filter]);

  const visible = photos.slice(0, shown);
  const pending = pendingAlbums.find((a) => a.id === filter);

  function choose(id: string) {
    setFilter(id);
    setShown(PAGE_SIZE);
  }

  return (
    <>
      <div className="flex justify-center gap-3 mb-12 flex-wrap">
        <Chip active={filter === "all"} onClick={() => choose("all")}>
          All
        </Chip>
        {albums.map((album) => (
          <Chip key={album.id} active={filter === album.id} onClick={() => choose(album.id)}>
            {album.label}
          </Chip>
        ))}
        {pendingAlbums.map((album) => (
          <Chip key={album.id} active={filter === album.id} onClick={() => choose(album.id)}>
            {album.label}
          </Chip>
        ))}
      </div>

      {pending && visible.length === 0 ? (
        <div className="max-w-xl mx-auto text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 py-16 px-8">
          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">
            No photos yet
          </h3>
          <p className="text-sm text-gray-500">
            {pending.label} takes place {pending.date}. Photos land here after the night.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-4 md:gap-5">
            {visible.map((photo) => (
              <button
                key={photo.src}
                onClick={() => setLightbox(photo)}
                className={`group relative overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-[var(--orange-accent)] ${
                  photo.feature ? "col-span-2 row-span-2" : photo.wide ? "col-span-2" : ""
                }`}
                aria-label={`${photo.alt} — ${photo.album.label}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-white/95 text-[var(--primary-blue)] text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full">
                  {photo.album.label}
                </span>

                {photo.feature && (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[var(--primary-blue)]/90 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-left">
                      <p className="text-[9px] font-semibold tracking-[0.3em] uppercase text-[var(--orange-accent)] mb-2">
                        {photo.album.date}
                      </p>
                      <p className="text-xl md:text-2xl font-semibold text-white leading-tight font-heading">
                        {photo.album.label} — {photo.album.venue}
                      </p>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>

          {shown < photos.length && (
            <div className="flex justify-center mt-12">
              <button onClick={() => setShown((n) => n + PAGE_SIZE)} className="btn-outline">
                Load More Photos
              </button>
            </div>
          )}
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-100 bg-[var(--primary-blue)]/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div
            className="relative w-full max-w-4xl aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.src}
              alt={lightbox.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-[0.2em] uppercase">
            {lightbox.album.label} · {lightbox.album.date}
          </p>
        </div>
      )}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-5 py-2 rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase transition-all duration-300 ${
        active
          ? "bg-[var(--orange-accent)] text-white"
          : "border border-[var(--border-color)] text-[var(--primary-blue)] hover:border-[var(--orange-accent)]"
      }`}
    >
      {children}
    </button>
  );
}
