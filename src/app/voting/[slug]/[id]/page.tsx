import { notFound, permanentRedirect } from "next/navigation";
import { getPublicCampaign } from "@/lib/api";
import { campaignPath, votingSlugs } from "@/lib/slug";

/**
 * The old vote page address, /voting/<short-slug>/<public_id> (?nominee=<public_id>),
 * which the API's public_path and links already shared still use. Redirects
 * to the readable one: /voting/<campaign-name>?nominee=<nominee-name>.
 */
type Props = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ nominee?: string | string[] }>;
};

export default async function LegacyVotePage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { nominee } = await searchParams;
  const campaign = await getPublicCampaign(slug, id);
  if (!campaign) notFound();

  let query = "";
  if (typeof nominee === "string" && nominee) {
    const found = campaign.categories.flatMap((c) => c.nominees).find((n) => String(n.public_id) === nominee);
    const name = found && votingSlugs(campaign).nominee.get(found.id);
    if (name) query = `?nominee=${encodeURIComponent(name)}`;
  }
  permanentRedirect(`${campaignPath(campaign)}${query}`);
}
