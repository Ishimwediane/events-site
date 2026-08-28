/**
 * Single place for everything the client may want to reword or switch off.
 *
 * The point of the `features` list is that nothing is deleted to give the
 * client their events-only site — sections are switched off. Drop a name from
 * NEXT_PUBLIC_FEATURES and its page 404s and its nav entry disappears, but the
 * code stays here for the full-platform build.
 */

export type Feature = "events" | "tickets" | "voting" | "gallery";

const ALL_FEATURES: Feature[] = ["events", "tickets", "voting", "gallery"];

const enabled = new Set<Feature>(
  (process.env.NEXT_PUBLIC_FEATURES ?? ALL_FEATURES.join(","))
    .split(",")
    .map((f) => f.trim())
    .filter((f): f is Feature => (ALL_FEATURES as string[]).includes(f)),
);

export function isEnabled(feature: Feature): boolean {
  return enabled.has(feature);
}

export const brand = {
  name: "Ozone Entertainment",
  legalName: "Ozone Hapi Entertainment Ltd",
  tagline:
    "Capturing moments, creating experiences. Event management, ticketing, entrance control and award voting across Kigali.",
  phone: "+250 784 731 957",
  phoneAlt: "+250 790 305 483",
  email: "ozoneentertainments1@gmail.com",
  address: "Kimironko, Kigali",
  country: "Rwanda",
  momoCode: "676866",
  /** Where ticket pick-up happens for hard tickets. */
  pickupPoints: "Kicukiro, Kimironko",
} as const;

/** Public navigation. Entries whose feature is switched off are filtered out. */
const NAV: { name: string; href: string; feature?: Feature }[] = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events", feature: "events" },
  { name: "Voting", href: "/voting", feature: "voting" },
  { name: "Gallery", href: "/gallery", feature: "gallery" },
  { name: "Contact", href: "/contact" },
];

export function navLinks() {
  return NAV.filter((l) => !l.feature || isEnabled(l.feature));
}

/** The four things this business does, now that the service lines are gone. */
export const solutions = [
  {
    id: "management",
    icon: "layout",
    title: "Full Management",
    description:
      "From concept to execution, we handle every detail of your event including logistics, staffing, and creative direction.",
  },
  {
    id: "ticketing",
    icon: "ticket",
    title: "Smart Ticketing",
    description:
      "Seamless digital ticket sales and management for events of any scale, ensuring a smooth attendee experience.",
  },
  {
    id: "entrance",
    icon: "scan",
    title: "Entrance Control",
    description:
      "Reliable QR scanning systems and staff for secure, rapid entry management and real-time attendance tracking.",
  },
  {
    id: "voting",
    icon: "vote",
    title: "Award Voting",
    description:
      "Integrated real-time voting systems for award shows and competitions, providing transparency and engagement.",
  },
] as const;

/**
 * Home page carousel. Each slide points at a feature; slides for switched-off
 * features are dropped so the carousel never links somewhere that 404s.
 */
export const heroSlides: {
  image: string;
  message: string;
  buttonText: string;
  buttonLink: string;
  feature?: Feature;
}[] = [
  {
    image: "/images/hero-events.jpg",
    message: "Unforgettable Events",
    buttonText: "Explore Events",
    buttonLink: "/events",
    feature: "events",
  },
  {
    image: "/images/awards.jpg",
    message: "Vote For Your Favourites",
    buttonText: "Cast Your Vote",
    buttonLink: "/voting",
    feature: "voting",
  },
  {
    image: "/images/gallery/agaciro-edition-1/event333.jpg",
    message: "Every Moment Captured",
    buttonText: "View Gallery",
    buttonLink: "/gallery",
    feature: "gallery",
  },
];

export function activeHeroSlides() {
  const slides = heroSlides.filter((s) => !s.feature || isEnabled(s.feature));
  return slides.length > 0 ? slides : [heroSlides[0]];
}
