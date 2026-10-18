import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Smartphone, Users, Vote } from "lucide-react";
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
type Props = {
  params: Promise<{ slug: string; id: string }>;
  /** ?nominee=<public_id> — a shared nominee link opens that nominee's vote popup. */
  searchParams: Promise<{ nominee?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const { nominee: nomineeId } = await searchParams;
  const campaign = await getPublicCampaign(slug, id);
  if (!campaign) return { title: "Voting not found" };

  // A shared nominee link previews as that nominee (WhatsApp, Facebook, X).
  const nominee =
    typeof nomineeId === "string"
      ? campaign.categories.flatMap((c) => c.nominees).find((n) => String(n.public_id) === nomineeId)
      : undefined;
  const title = nominee ? `Vote for ${nominee.name} — ${campaign.title}` : `Vote — ${campaign.title}`;
  const description = nominee
    ? `Vote for ${nominee.name} in ${campaign.title} with MTN MoMo.`
    : truncate(plainText(campaign.description ?? ""), 160) || `Vote in ${campaign.title} with MoMo.`;
  const image = nominee?.profile_image ?? campaign.cover_image;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [imageUrl(image, "/images/awards.jpg")] : undefined,
    },
  };
}

export default async function CampaignVotePage({ params, searchParams }: Props) {
  if (!isEnabled("voting")) notFound();

  const { slug, id } = await params;
  const { nominee } = await searchParams;
  const campaign = await getPublicCampaign(slug, id);
  if (!campaign) notFound();

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
            pagePath={`/voting/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`}
            openNomineeId={typeof nominee === "string" ? nominee : undefined}
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
