import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Smartphone } from "lucide-react";
import PageHero from "@/components/PageHero";
import VotePicker from "@/components/VotePicker";
import { getPublicCampaign } from "@/lib/api";
import { imageUrl } from "@/lib/images";
import { formatDate, plainText, truncate } from "@/lib/format";
import { isEnabled } from "@/config/site";

/**
 * A campaign's vote page — the API's public_path, /voting/<slug>/<public_id>.
 * Nominees grouped by category; voting is MoMo number + vote package only.
 */
type Props = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const campaign = await getPublicCampaign(slug, id);
  if (!campaign) return { title: "Voting not found" };
  const description =
    truncate(plainText(campaign.description ?? ""), 160) || `Vote in ${campaign.title} with MoMo.`;
  return {
    title: `Vote — ${campaign.title}`,
    description,
    openGraph: {
      title: campaign.title,
      description,
      images: campaign.cover_image ? [imageUrl(campaign.cover_image, "/images/awards.jpg")] : undefined,
    },
  };
}

export default async function CampaignVotePage({ params }: Props) {
  if (!isEnabled("voting")) notFound();

  const { slug, id } = await params;
  const campaign = await getPublicCampaign(slug, id);
  if (!campaign) notFound();

  const closed = campaign.end_date !== null && new Date(campaign.end_date) < new Date();

  return (
    <>
      <PageHero
        eyebrow="Award Voting"
        title={campaign.title}
        image={imageUrl(campaign.cover_image, "/images/awards.jpg")}
        height="h-[45vh] md:h-[50vh]"
        compact={campaign.title.length > 40}
      >
        <div className="flex flex-wrap gap-6 justify-center text-white/80 text-[11px] uppercase tracking-[0.2em] font-semibold">
          <span className="inline-flex items-center gap-2">
            <Smartphone size={14} className="text-[var(--orange-accent)]" /> Vote with MTN MoMo
          </span>
          {campaign.end_date && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} className="text-[var(--orange-accent)]" />
              {closed ? "Closed" : "Closes"} {formatDate(campaign.end_date)}
            </span>
          )}
        </div>
      </PageHero>

      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <Link
            href="/voting"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-[var(--orange-accent)] mb-10"
          >
            <ArrowLeft size={14} /> All campaigns
          </Link>

          <VotePicker
            categories={campaign.categories}
            packages={campaign.packages}
            closed={closed}
          />
        </div>
      </section>
    </>
  );
}
