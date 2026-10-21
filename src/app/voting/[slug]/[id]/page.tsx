import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CampaignVoteView, { campaignMetadata, findNominee } from "@/components/CampaignVoteView";
import { getCampaignByName, getPublicCampaign } from "@/lib/api";
import { campaignPath } from "@/lib/slug";
import { isEnabled } from "@/config/site";

/**
 * Two kinds of address share this route:
 *
 *   /voting/<campaign-name>/<nominee-name>   a nominee's own link: the campaign
 *                                            page with their vote popup open,
 *                                            previewing as that nominee
 *   /voting/<short-slug>/<public_id>         the API's old public_path, and
 *                                            links shared before: redirected to
 *                                            the readable campaign address
 *
 * Cached by Vercel and refreshed every 60 s, like the campaign page.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; id: string }> };

async function resolve(slug: string, id: string) {
  const campaign = await getCampaignByName(slug);
  if (campaign) return { campaign, nominee: findNominee(campaign, decodeURIComponent(id)) };
  return { campaign: null, nominee: undefined };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const { campaign, nominee } = await resolve(slug, id);
  return campaign ? campaignMetadata(campaign, nominee) : { title: "Voting" };
}

export default async function NomineeOrLegacyPage({ params }: Props) {
  if (!isEnabled("voting")) notFound();
  const { slug, id } = await params;
  const { campaign, nominee } = await resolve(slug, id);

  if (campaign) {
    // Unknown nominee name: show the campaign rather than an error.
    if (!nominee) permanentRedirect(campaignPath(campaign));
    return <CampaignVoteView campaign={campaign} openNomineeId={nominee.id} />;
  }

  // The old /voting/<short-slug>/<public_id> form.
  const legacy = await getPublicCampaign(slug, id);
  if (!legacy) notFound();
  permanentRedirect(campaignPath(legacy));
}
