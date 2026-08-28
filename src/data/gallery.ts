/**
 * Gallery source — interim.
 *
 * The Django backend has no photo model yet: `Event` carries a single `flyer`
 * and `venue_logo`, nothing for an album. Until an `EventPhoto` model exists
 * (event FK + image + caption + ordering) the gallery is driven by this file
 * and the optimised images under public/images/gallery/.
 *
 * When that model lands, replace `albums` with a fetch and delete this file —
 * GalleryGrid already takes the same shape either way.
 */

export type Photo = {
  src: string;
  alt: string;
  /** Tiles marked wide span two grid columns, giving the mosaic its rhythm. */
  wide?: boolean;
  /** One tile per album may be tall, anchoring the top-left of the grid. */
  feature?: boolean;
};

export type Album = {
  /** Slug used by the filter chips. Match an event slug where one exists. */
  id: string;
  label: string;
  date: string;
  venue: string;
  photos: Photo[];
};

export const albums: Album[] = [
  {
    id: "agaciro-edition-1",
    label: "Agaciro Ed. 01",
    date: "15 Nov 2025",
    venue: "Kigali",
    photos: [
      { src: "/images/gallery/agaciro-edition-1/model2.jpg", alt: "Model on the runway", feature: true },
      { src: "/images/gallery/agaciro-edition-1/event333.jpg", alt: "Guests arriving" },
      { src: "/images/gallery/agaciro-edition-1/award.jpg", alt: "Award presentation" },
      { src: "/images/gallery/agaciro-edition-1/event5.jpg", alt: "The crowd on the night", wide: true },
      { src: "/images/gallery/agaciro-edition-1/model3.jpg", alt: "Designer collection" },
      { src: "/images/gallery/agaciro-edition-1/event1.jpg", alt: "Runway finale" },
      { src: "/images/gallery/agaciro-edition-1/agaciro.jpg", alt: "Stage and lighting", wide: true },
      { src: "/images/gallery/agaciro-edition-1/model4.jpg", alt: "Backstage portrait" },
      { src: "/images/gallery/agaciro-edition-1/event2.jpg", alt: "Performance on stage" },
      { src: "/images/gallery/agaciro-edition-1/event33.jpg", alt: "Red carpet", wide: true },
      { src: "/images/gallery/agaciro-edition-1/model6.jpg", alt: "Model portrait" },
      { src: "/images/gallery/agaciro-edition-1/event4.jpg", alt: "Guests seated" },
      { src: "/images/gallery/agaciro-edition-1/event3.jpg", alt: "Closing moments" },
    ],
  },
  {
    id: "agaciro-edition-2",
    label: "Agaciro Ed. 02",
    date: "31 Jul 2026",
    venue: "SportsPark Kigali",
    photos: [
      { src: "/images/gallery/agaciro-edition-2/img_0343.jpg", alt: "Agaciro Edition 2", feature: true },
      { src: "/images/gallery/agaciro-edition-2/flyer.jpg", alt: "Agaciro Edition 2 flyer", wide: true },
    ],
  },
];

export function allPhotos(): (Photo & { album: Album })[] {
  return albums.flatMap((album) => album.photos.map((photo) => ({ ...photo, album })));
}

export function photoCount(): number {
  return albums.reduce((n, a) => n + a.photos.length, 0);
}
