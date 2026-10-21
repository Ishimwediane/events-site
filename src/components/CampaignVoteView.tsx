import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Smartphone, Users, Vote } from "lucide-react";
import PageHero from "@/components/PageHero";
import VotePicker from "@/components/VotePicker";
import type { Nominee, PublicCampaign } from "@/lib/api";
import { campaignPath, votingSlugs } from "@/lib/slug";
import { imageUrl } from "@/lib/images";
import { formatDate, plainText, truncate } from "@/lib/format";

/**
 * A campaign's vote page, shared by /voting/<campaign> and
 * /voting/<campaign>/<nominee> (the latter opens that nominee's vote popup).
 * Both routes are cached by Vercel and refreshed every minute, so a click on
 * a shared link is served from the edge instead of being rebuilt per visitor.
 */

/** The nominee a link names: their slug, or the old numeric public id. */
export function findNominee(campaign: PublicCampaign, key: string | undefined): Nominee | undefined {
  if (!key) return undefined;
  const slugs = votingSlugs(campaign);
  return campaign.categories
    .flatMap((c) => c.nominees)
    .find((n) => slugs.nominee.get(n.id) === key || String(n.public_id) === key);
}

/** Link previews (WhatsApp, Facebook, X): the nominee when there is one. */
export function campaignMetadata(campaign: PublicCampaign, nominee?: Nominee): Metadata {
  const title = nominee ? `Vote for ${nominee.name} — ${campaign.title}` : `Vote — ${campaign.title}`;
  const description = nominee
    ? `Vote for ${nominee.name} in ${campaign.title} with MTN MoMo.`
    : truncate(plainText(campaign.description ?? ""), 160) || `Vote in ${campaign.title} with MoMo.`;
  const image = nominee?.profile_image ?? campaign.cover_image;
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [imageUrl(image, "/images/awards.jpg")] : undefined },
  };
}

export default function CampaignVoteView({ campaign, openNomineeId }: { campaign: PublicCampaign; openNomineeId?: string }) {
  const closed = campaign.end_date !== null && new Date(campaign.end_date) < new Date();
  const categoryCount = campaign.categories.length;
  const nomineeCount = campaign.categories.reduce((n, c) => n + c.nominees.length, 0);

  return (
    <>
      <PageHero
        eyebrow="Award Voting"
        title={campaign.title}
        image={imageUrl(campaign.cover_image, "/images/awards.jpg")}
        height="h-[45vh] md:h-[50vh]"
        compact={campaign.title.length > 40}
      >
        {/* Same stat row as the /voting hero. */}
        <div className="flex flex-wrap gap-6 justify-center">
          <Stat icon={Vote}>{categoryCount} Categories</Stat>
          <Stat icon={Users}>{nomineeCount} Nominees</Stat>
          <Stat icon={Smartphone}>Vote by MoMo</Stat>
          {campaign.end_date && (
            <Stat icon={CalendarDays}>
              {closed ? "Closed" : "Closes"} {formatDate(campaign.end_date)}
            </Stat>
          )}
        </div>
      </PageHero>

      <section className="section bg-white">
        <div className="container-custom">
          <Link
            href="/voting"
            className="text-gray-600 hover:text-[var(--orange-accent)] transition-colors duration-300 text-sm inline-flex items-center gap-2 mb-12"
          >
            <ArrowLeft className="w-4 h-4" /> All campaigns
          </Link>

          <VotePicker
            categories={campaign.categories}
            packages={campaign.packages}
            closed={closed}
            campaignTitle={campaign.title}
            pagePath={campaignPath(campaign)}
            openNomineeId={openNomineeId}
          />
        </div>
      </section>
    </>
  );
}

function Stat({ icon: Icon, children }: { icon: typeof Vote; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-gray-200">
      <Icon className="w-5 h-5 text-[var(--orange-accent)]" />
      <span className="text-sm">{children}</span>
    </div>
  );
}
