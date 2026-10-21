import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CampaignVoteView, { campaignMetadata } from "@/components/CampaignVoteView";
import { getCampaignByName } from "@/lib/api";
import { isEnabled } from "@/config/site";

/**
 * A campaign's vote page, addressed by name: /voting/<campaign-title-slug>.
 * Cached by Vercel and refreshed every 60 s (it reads no query string, so it
 * is the same page for everyone). A nominee's own link is
 * /voting/<campaign>/<nominee> ([id]/page.tsx); old ?nominee= links are
 * opened in the browser by VotePicker.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  return []; // built on first visit, then cached
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaignByName((await params).slug);
  return campaign ? campaignMetadata(campaign) : { title: "Voting not found" };
}

export default async function CampaignVotePage({ params }: Props) {
  if (!isEnabled("voting")) notFound();
  const campaign = await getCampaignByName((await params).slug);
  if (!campaign) notFound();
  return <CampaignVoteView campaign={campaign} />;
}
