import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Vote, Smartphone } from "lucide-react";
import PageHero from "@/components/PageHero";
import MiniHeader from "@/components/MiniHeader";
import ScrollReveal from "@/components/ScrollReveal";
import CampaignCard from "@/components/CampaignCard";
import { getCampaigns } from "@/lib/api";
import { brand, isEnabled } from "@/config/site";

export const metadata: Metadata = {
  title: "Award Voting",
  description: "Vote in Ozone Entertainment's award campaigns with MTN MoMo.",
};

/**
 * The live voting campaigns as cards, like the Events page. Categories,
 * nominees and vote packages are on each campaign's own page.
 */
export default async function VotingPage() {
  if (!isEnabled("voting")) notFound();

  const campaigns = await getCampaigns();

  return (
    <>
      <PageHero eyebrow="Award Voting" title="Vote For Your Favourites" image="/images/awards.jpg" compact>
        <div className="flex flex-wrap gap-6 justify-center">
          <Stat icon={Vote}>
            {campaigns.length} {campaigns.length === 1 ? "Live Campaign" : "Live Campaigns"}
          </Stat>
          <Stat icon={Smartphone}>Vote by MoMo</Stat>
        </div>
      </PageHero>

      <section className="py-20 bg-white">
        <div className="container-custom">
          <ScrollReveal animation="fadeInDown">
            <MiniHeader className="mb-12">{campaigns.length > 1 ? "Live Campaigns" : "Live Campaign"}</MiniHeader>
          </ScrollReveal>

          {campaigns.length === 0 ? (
            <div className="max-w-xl mx-auto text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 py-16 px-8">
              <Vote className="w-8 h-8 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">No voting open right now</h3>
              <p className="text-sm text-gray-500">
                Campaigns appear here once they are published. Call {brand.phone} to ask about nominations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {campaigns.map((campaign, i) => (
                <ScrollReveal key={campaign.id} animation="scaleIn" delay={(i % 4) * 0.1}>
                  <CampaignCard campaign={campaign} />
                </ScrollReveal>
              ))}
            </div>
          )}
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
