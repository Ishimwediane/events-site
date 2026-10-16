"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Vote } from "lucide-react";
import type { Nominee, PublicCampaign, VotePackage } from "@/lib/api";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import MiniHeader from "./MiniHeader";
import ScrollReveal from "./ScrollReveal";
import { Shell, PayStep, FieldLabel, FormError, PayButton } from "./PaymentModal";

const NOMINEE_FALLBACK = "/images/nominees.jpg";

const votesLabel = (n: number) => `${n.toLocaleString("en-GB")} ${n === 1 ? "vote" : "votes"}`;

/**
 * Nominees by category, each with a Vote button. Voting is one choice — how
 * many votes — then the Weflexfy payment page inside the same modal, which
 * asks for the MoMo number itself. No name, email or phone here.
 *
 * Cards and choices reuse the site's own patterns: EventCard for nominees,
 * the ticket tier rows for vote packages.
 */
export default function VotePicker({
  categories,
  packages,
  closed,
}: {
  categories: PublicCampaign["categories"];
  packages: VotePackage[];
  closed: boolean;
}) {
  const sorted = [...packages].sort((a, b) => a.number_of_votes - b.number_of_votes);

  const [nominee, setNominee] = useState<Nominee | null>(null);
  const [packageId, setPackageId] = useState<string>(sorted[0]?.id ?? "");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "pay">("form");

  const chosen = sorted.find((p) => p.id === packageId) ?? null;
  const canVote = !closed && sorted.length > 0;

  function open(n: Nominee) {
    setNominee(n);
    setError("");
    setStep("form");
  }
  const close = () => setNominee(null);

  const withNominees = categories.filter((c) => c.nominees.length > 0);
  if (withNominees.length === 0) {
    return <p className="text-center text-gray-600 text-sm py-16">Nominees will be announced soon.</p>;
  }

  return (
    <>
      <div className="space-y-20">
        {withNominees.map((category) => (
          <section key={category.id}>
            <ScrollReveal animation="fadeInDown">
              <MiniHeader className="mb-3">
                {`${category.nominees.length} ${category.nominees.length === 1 ? "Nominee" : "Nominees"}`}
              </MiniHeader>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--primary-blue)] leading-tight">
                {category.name}
              </h2>
            </ScrollReveal>
            {category.description && (
              <p className="text-gray-600 text-sm text-center max-w-2xl mx-auto mt-3">{category.description}</p>
            )}

            {/* Flex, not grid, so a short last row (or a 3-nominee category) stays centred. */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8">
              {category.nominees.map((n, i) => (
                <ScrollReveal
                  key={n.id}
                  animation="scaleIn"
                  delay={(i % 4) * 0.08}
                  className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)]"
                >
                  <button
                    type="button"
                    disabled={!canVote}
                    onClick={() => open(n)}
                    className="block w-full h-full text-left group disabled:cursor-not-allowed"
                  >
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm group-enabled:hover:shadow-md group-enabled:hover:-translate-y-1 transition-all duration-500 h-full flex flex-col border border-gray-100">
                      <div className="relative aspect-square w-full p-2 pb-0">
                        <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={imageUrl(n.profile_image, NOMINEE_FALLBACK)}
                            alt={n.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover object-top group-enabled:group-hover:scale-105 transition-transform duration-700"
                          />
                          {n.public_id !== null && (
                            <div className="absolute top-2 right-2 z-20">
                              <span className="px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--orange-accent)] border border-[var(--orange-accent)]/20">
                                #{n.public_id}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex-1">
                          <h3 className="text-base font-bold mb-1.5 leading-tight text-[var(--primary-blue)] group-enabled:group-hover:text-[var(--orange-accent)] transition-colors line-clamp-2">
                            {n.name}
                          </h3>
                          <div className="h-px w-full bg-gray-50 my-3" />
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-4">
                            <Vote className="w-3 h-3 text-gray-300" />
                            {votesLabel(n.votes)}
                          </div>
                        </div>
                        <span className="block w-full py-2.5 rounded-lg bg-[var(--orange-accent)] group-enabled:group-hover:bg-[var(--orange-hover)] group-disabled:opacity-40 transition-all text-white font-bold text-[11px] uppercase tracking-widest shadow-sm text-center">
                          {closed ? "Voting closed" : "Vote"}
                        </span>
                      </div>
                    </div>
                  </button>
                </ScrollReveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      {nominee && (
        <Shell
          title={step === "pay" ? "Pay with MoMo" : `Vote for ${nominee.name}`}
          subtitle={chosen ? `${votesLabel(chosen.number_of_votes)} · ${formatPrice(chosen.price)}` : undefined}
          wide={step === "pay"}
          onClose={close}
        >
          {step === "pay" && chosen ? (
            <PayStep
              input={{ service: "VOTE", targetId: nominee.id, packageId: chosen.id }}
              successTitle="Thank you for voting"
              successText={
                <>
                  Your {votesLabel(chosen.number_of_votes)} for{" "}
                  <span className="font-semibold text-[var(--primary-blue)]">{nominee.name}</span> have been
                  counted.
                </>
              }
              onBack={() => setStep("form")}
              onClose={close}
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(chosen ? "" : "Choose how many votes.");
                if (chosen) setStep("pay");
              }}
              className="space-y-5"
            >
              <div>
                <FieldLabel>How many votes?</FieldLabel>
                {/* Same rows as the ticket tiers on an event page. */}
                <div className="space-y-2" role="radiogroup" aria-label="How many votes">
                  {sorted.map((p) => {
                    const active = p.id === packageId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPackageId(p.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all group ${
                          active
                            ? "border-[var(--orange-accent)] bg-[var(--orange-accent)]/5"
                            : "border-gray-200 hover:border-[var(--orange-accent)] hover:bg-[var(--orange-accent)]/5"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              active
                                ? "bg-[var(--orange-accent)] border-[var(--orange-accent)] text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {active && <Check size={12} />}
                          </span>
                          <span
                            className={`text-sm font-semibold transition-colors ${
                              active ? "text-[var(--orange-accent)]" : "text-[var(--primary-blue)] group-hover:text-[var(--orange-accent)]"
                            }`}
                          >
                            {votesLabel(p.number_of_votes)}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-[var(--primary-blue)]">{formatPrice(p.price)}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-gray-400 text-xs mt-2">You enter your MTN MoMo number on the next step.</p>
              </div>

              <FormError message={error} />

              <PayButton>
                Pay {chosen ? formatPrice(chosen.price) : ""} <ArrowRight size={16} />
              </PayButton>
            </form>
          )}
        </Shell>
      )}
    </>
  );
}
