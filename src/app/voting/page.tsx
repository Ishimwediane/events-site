import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Vote, Users, Smartphone, CalendarDays } from "lucide-react";
import PageHero from "@/components/PageHero";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { getCampaigns, countNominees, type VotingCampaign } from "@/lib/api";
import { imageUrl } from "@/lib/images";
import { formatDate, formatPrice, plainText, truncate } from "@/lib/format";
import { brand, isEnabled } from "@/config/site";

export const metadata: Metadata = {
  title: "Award Voting",
  description:
    "Vote in Ozone Entertainment's award campaigns — live categories, nominees and vote packages.",
};

const NOMINEE_FALLBACK = "/images/nominees.jpg";

export default async function VotingPage() {
  if (!isEnabled("voting")) notFound();

  const campaigns = await getCampaigns();
  const totalCategories = campaigns.reduce((n, c) => n + c.categories.length, 0);
  const totalNominees = campaigns.reduce((n, c) => n + countNominees(c), 0);

  return (
    <>
      <PageHero
        eyebrow="Award Voting"
        title="Vote For Your Favourites"
        image="/images/awards.jpg"
      >
        <div className="flex flex-wrap gap-6 justify-center">
          <Stat icon={Vote}>{totalCategories} Categories</Stat>
          <Stat icon={Users}>{totalNominees} Nominees</Stat>
          <Stat icon={Smartphone}>Vote by MoMo</Stat>
        </div>
      </PageHero>

      <section className="py-20 bg-white">
        <div className="container-custom">
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-12">
              {campaigns.length > 1 ? "Live Campaigns" : "Live Campaign"}
            </MiniHeader>
          </ScrollReveal>

          {campaigns.length === 0 ? (
            <div className="max-w-xl mx-auto text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 py-16 px-8">
              <Vote className="w-8 h-8 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">
                No voting open right now
              </h3>
              <p className="text-sm text-gray-500">
                Campaigns appear here once they are published. Call {brand.phone} to ask about
                nominations.
              </p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-16">
              {campaigns.map((campaign) => (
                <CampaignBlock key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CampaignBlock({ campaign }: { campaign: VotingCampaign }) {
  const nominees = countNominees(campaign);
  const summary = truncate(plainText(campaign.description ?? ""), 300);
  const voteHref = campaign.public_path ?? `/voting`;
  const shownCategories = campaign.categories.slice(0, 6);
  const remaining = campaign.categories.length - shownCategories.length;

  return (
    <div className="space-y-12">
      <ScrollReveal animation="fadeInUp">
        <div className="group relative bg-white rounded-3xl overflow-hidden border border-[var(--border-color)] hover:border-[var(--orange-accent)]/30 transition-all duration-500">
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-video md:aspect-auto md:min-h-[360px]">
              <Image
                src={imageUrl(campaign.cover_image, NOMINEE_FALLBACK)}
                alt={campaign.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute top-4 left-4 bg-[var(--orange-accent)] text-white text-[10px] font-bold px-4 py-2 rounded-full tracking-[0.15em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                VOTING OPEN
              </div>
            </div>

            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl md:text-4xl font-semibold mb-4 text-[var(--text-primary)] leading-tight">
                {campaign.title}
              </h3>

              {summary && (
                <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
                  {summary}
                </p>
              )}

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-semibold">
                  <Vote size={14} className="text-[var(--orange-accent)]" />
                  {campaign.categories.length} Categories
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-semibold">
                  <Users size={14} className="text-[var(--orange-accent)]" />
                  {nominees} Nominees
                </div>
                {campaign.end_date && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-semibold">
                    <CalendarDays size={14} className="text-[var(--orange-accent)]" />
                    Closes {formatDate(campaign.end_date)}
                  </div>
                )}
              </div>

              <Link
                href={voteHref}
                className="inline-flex items-center gap-2 text-[var(--orange-accent)] font-semibold text-xs tracking-widest uppercase group-hover:gap-4 transition-all duration-300"
              >
                Vote Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {shownCategories.length > 0 && (
        <div>
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-10">Award Categories</MiniHeader>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shownCategories.map((category, i) => (
              <ScrollReveal key={category.id} animation="scaleIn" delay={(i % 3) * 0.1}>
                <div className="h-full border border-[var(--border-color)] rounded-2xl p-6 bg-white hover:border-[var(--orange-accent)]/50 transition-colors duration-300">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--orange-accent)] font-bold mb-2">
                    {category.nominees.length === 0
                      ? "Nominees pending"
                      : `${category.nominees.length} ${
                          category.nominees.length === 1 ? "Nominee" : "Nominees"
                        }`}
                  </p>
                  <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2 leading-snug">
                    {category.name}
                  </h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">
                    {category.nominees.length > 0
                      ? category.nominees.map((n) => n.name).join(" · ")
                      : "Nominations still open for this category."}
                  </p>
                </div>
              </ScrollReveal>
            ))}

            {remaining > 0 && (
              <ScrollReveal animation="scaleIn">
                <Link
                  href={voteHref}
                  className="h-full border border-dashed border-[var(--border-color)] rounded-2xl p-6 bg-gray-50 flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--orange-accent)] transition-colors duration-300"
                >
                  <p className="text-3xl font-bold text-[var(--orange-accent)] font-heading">
                    +{remaining}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold">
                    More Categories
                  </p>
                </Link>
              </ScrollReveal>
            )}
          </div>
        </div>
      )}

      {campaign.packages.length > 0 && (
        <div>
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-10">Vote Packages</MiniHeader>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {campaign.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-xl border border-[var(--border-color)] bg-white p-5 text-center hover:border-[var(--orange-accent)]/50 transition-colors duration-300"
              >
                <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--orange-accent)] font-bold mb-2">
                  {pkg.name}
                </p>
                <p className="text-[var(--primary-blue)] text-xl font-bold leading-none mb-1">
                  {formatPrice(pkg.price)}
                </p>
                <p className="text-gray-400 text-[10px]">
                  {pkg.number_of_votes.toLocaleString("en-GB")}{" "}
                  {pkg.number_of_votes === 1 ? "vote" : "votes"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Link href={voteHref} className="btn-primary px-8 py-4 uppercase tracking-wider">
              Cast Your Vote
            </Link>
          </div>
        </div>
      )}
    </div>
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
