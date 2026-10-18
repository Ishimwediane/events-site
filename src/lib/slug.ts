/**
 * Readable public URLs for voting: names, never database ids.
 *
 *   /voting/test-ozone-awards-2026                       campaign
 *   /voting/test-ozone-awards-2026#best-female-artist    category
 *   /voting/test-ozone-awards-2026?nominee=keza          nominee
 *
 * The backend keeps its short slug + public_id (/voting/test/2, still used by
 * the organiser platform); this site maps between the two, and redirects the
 * old form so links already shared keep working.
 */

/** "Best Female Artist" → "best-female-artist" (accents dropped, ASCII only). */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Returns a function giving each value a slug unused so far ("x", "x-2", …). */
function uniqueSlugs() {
  const used = new Set<string>();
  return (base: string) => {
    const root = base || "item";
    let slug = root;
    for (let n = 2; used.has(slug); n++) slug = `${root}-${n}`;
    used.add(slug);
    return slug;
  };
}

type Named = { id: string; name: string };
type CampaignLike = { title: string; categories: (Named & { nominees: Named[] })[] };

export type VotingSlugs = {
  /** category id → anchor, e.g. "best-female-artist" */
  category: Map<string, string>;
  /** nominee id → ?nominee= value, e.g. "keza" ("keza-best-new-talent" if the name repeats) */
  nominee: Map<string, string>;
};

/** Stable, unique slugs for every category and nominee of one campaign. */
export function votingSlugs(campaign: CampaignLike): VotingSlugs {
  const categorySlug = uniqueSlugs();
  const category = new Map<string, string>();
  for (const c of campaign.categories) category.set(c.id, categorySlug(slugify(c.name)));

  // A nominee name that appears in several categories carries its category.
  const counts = new Map<string, number>();
  for (const c of campaign.categories)
    for (const n of c.nominees) counts.set(slugify(n.name), (counts.get(slugify(n.name)) ?? 0) + 1);

  const nomineeSlug = uniqueSlugs();
  const nominee = new Map<string, string>();
  for (const c of campaign.categories)
    for (const n of c.nominees) {
      const base = slugify(n.name);
      nominee.set(n.id, nomineeSlug((counts.get(base) ?? 0) > 1 ? `${base}-${category.get(c.id)}` : base));
    }
  return { category, nominee };
}

/** The campaign's public path, e.g. /voting/test-ozone-awards-2026. */
export function campaignPath(campaign: { title: string }): string {
  return `/voting/${slugify(campaign.title) || "campaign"}`;
}
