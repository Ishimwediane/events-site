/**
 * Single place for everything the client may want to reword or switch off.
 *
 * The point of the `features` list is that nothing is deleted to give the
 * client their events-only site — sections are switched off. Drop a name from
 * NEXT_PUBLIC_FEATURES and its page 404s and its nav entry disappears, but the
 * code stays here for the full-platform build.
 */
import { envOr } from "@/lib/env";

export type Feature = "events" | "tickets" | "voting" | "gallery";

const ALL_FEATURES: Feature[] = ["events", "tickets", "voting", "gallery"];

const enabled = new Set<Feature>(
  envOr(process.env.NEXT_PUBLIC_FEATURES, ALL_FEATURES.join(","))
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

/**
 * What this business does, now that the photography / film / modelling /
 * artist-management lines are gone. Every one of these is something the
 * platform in ../backend actually supports, rather than marketing copy:
 * tiered tickets with QR email, printed hard-ticket sheets, per-event gate
 * staff and scan logs, and paid vote packages.
 *
 * `description` is the short line on the cards; `detail` is the longer one on
 * the /services page.
 */
export const solutions = [
  {
    id: "management",
    icon: "layout",
    title: "Event Management",
    description:
      "Concept to execution — logistics, venue, staffing and creative direction, so the night runs the way it was planned.",
    detail:
      "We take an event from an idea to a finished night: venue and supplier negotiation, run-of-show, staffing, stage and lighting direction, and someone accountable on the floor while it happens. You approve the plan; we carry it.",
  },
  {
    id: "ticketing",
    icon: "ticket",
    title: "Smart Ticketing",
    description:
      "Tiered tickets sold online and paid by MoMo, each issued as a scannable QR code emailed to the buyer.",
    detail:
      "Set as many tiers as the event needs, each with its own price, capacity and sale window. Buyers pay by MTN MoMo and the ticket arrives as a QR code in their inbox. Capacity is held atomically, so two people cannot buy the same last seat.",
  },
  {
    id: "hard-tickets",
    icon: "printer",
    title: "Hard Ticket Printing",
    description:
      "Printed ticket sheets carrying the same QR codes, for pick-up points and door sales.",
    detail:
      "Not everyone buys online. We generate printed sheets of tickets carrying the same QR codes as the digital ones, ready for pick-up points and door sales, and they scan identically at the gate. Printed and online stock are tracked separately so the numbers still reconcile.",
  },
  {
    id: "entrance",
    icon: "scan",
    title: "Entrance Control",
    description:
      "Gate staff scanning at the door, so every ticket is checked once and attendance is counted live.",
    detail:
      "Door staff are given scanning access to one specific event — a person hired for Friday cannot check anyone into Saturday's show. Every scan is logged, a ticket cannot be used twice, and you watch attendance climb in real time.",
  },
  {
    id: "voting",
    icon: "vote",
    title: "Award Voting",
    description:
      "Public voting campaigns with paid vote packages and tallies that update in real time.",
    detail:
      "Run award categories with nominees the public votes for, with paid vote packages from a hundred francs upward. Tallies update live, every transaction is recorded against a nominee, and results can be shown on the night.",
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
