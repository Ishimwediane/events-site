"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Share2, Smartphone } from "lucide-react";
import type { Nominee, PublicCampaign, VotePackage } from "@/lib/api";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import ShareModal from "./ShareModal";
import { ussdVote, votingSlugs } from "@/lib/slug";
import { brand } from "@/config/site";
import ScrollReveal from "./ScrollReveal";
import { Shell, PayStep, FieldLabel, FormError, PayButton } from "./PaymentModal";

/** Shown until a nominee has a photo: the AGACIRO "Vote nominee / how to vote" poster. */
const NOMINEE_FALLBACK = "/images/nominee-placeholder.jpg";
/** How long a vote choice must stay selected before its payment is prepared. */
const PREPARE_DELAY_MS = 400;

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
  campaignTitle,
  pagePath,
  openNomineeId,
}: {
  categories: PublicCampaign["categories"];
  packages: VotePackage[];
  closed: boolean;
  campaignTitle: string;
  /** This page's readable path, /voting/<campaign-name> — the base of every share link. */
  pagePath: string;
  /** The nominee named by ?nominee= in a shared link: open their vote popup. */
  openNomineeId?: string;
}) {
  const sorted = [...packages].sort((a, b) => a.number_of_votes - b.number_of_votes);

  const [nominee, setNominee] = useState<Nominee | null>(() =>
    openNomineeId && !closed
      ? (categories.flatMap((c) => c.nominees).find((n) => n.id === openNomineeId) ?? null)
      : null,
  );
  const [share, setShare] = useState<{ title: string; text: string; url: string } | null>(null);
  const [packageId, setPackageId] = useState<string>(sorted[0]?.id ?? "");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "pay">("form");

  /** The choice whose payment is being prepared in the background. */
  const [preparedId, setPreparedId] = useState<string | null>(null);
  /** Bumped by "Try again" so a fresh payment is prepared. */
  const [attempt, setAttempt] = useState(0);

  const chosen = sorted.find((p) => p.id === packageId) ?? null;
  const prepared = nominee ? (sorted.find((p) => p.id === preparedId) ?? null) : null;
  const canVote = !closed && sorted.length > 0;

  // Prepare the payment for the selected choice once it has been the choice for
  // a moment — quick clicks between packages do not each start a payment.
  // Unused prepared payments expire on their own after an hour.
  useEffect(() => {
    if (!nominee || step !== "form" || !packageId) return;
    const timer = setTimeout(() => setPreparedId(packageId), PREPARE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [nominee, packageId, step]);

  function open(n: Nominee) {
    setNominee(n);
    setPreparedId(null);
    setError("");
    setStep("form");
  }
  /** Absolute link to this page (+ ?nominee=… or #category-…) for sharing. */
  const link = (suffix: string) => `${window.location.origin}${pagePath}${suffix}`;
  // Names, not ids, in every public link: #best-female-artist, ?nominee=keza.
  const slugs = votingSlugs({ title: campaignTitle, categories });

  const close = () => {
    setNominee(null);
    setPreparedId(null);
  };

  const withNominees = categories.filter((c) => c.nominees.length > 0);
  if (withNominees.length === 0) {
    return <p className="text-center text-gray-600 text-sm py-16">Nominees will be announced soon.</p>;
  }

  return (
    <>
      <div className="space-y-10">
        {withNominees.map((category) => (
          <ScrollReveal key={category.id} animation="fadeInUp">
            {/* Each category is one card: title, count and share, then its nominees. */}
            <section
              id={slugs.category.get(category.id)}
              className="scroll-mt-28 bg-white rounded-lg border border-gray-100 shadow-sm p-5 md:p-8"
            >
              <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-gray-200">
                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-semibold text-[var(--primary-blue)] leading-tight">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {category.nominees.length} {category.nominees.length === 1 ? "nominee" : "nominees"}
                    {category.description && <span className="text-gray-400"> · {category.description}</span>}
                  </p>
                </div>
                <IconButton
                  label={`Share ${category.name}`}
                  onClick={() =>
                    setShare({
                      title: `Share ${category.name}`,
                      text: `Vote in ${category.name} — ${campaignTitle}.`,
                      url: link(`#${slugs.category.get(category.id)}`),
                    })
                  }
                />
              </div>

              {/* Flex, not grid, so a short last row stays centred. */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {category.nominees.map((n) => (
                  <div
                    key={n.id}
                    className="w-full max-w-sm sm:max-w-none sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500 flex flex-col border border-gray-100 group"
                  >
                    <button
                      type="button"
                      disabled={!canVote}
                      onClick={() => open(n)}
                      className="relative aspect-square w-full p-2 pb-0 disabled:cursor-not-allowed"
                      aria-label={`Vote for ${n.name}`}
                    >
                      <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={imageUrl(n.profile_image, NOMINEE_FALLBACK)}
                          alt={n.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        />
                        {n.public_id !== null && (
                          <div className="absolute top-2 right-2 z-20">
                            <span className="px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--orange-accent)] border border-[var(--orange-accent)]/20">
                              #{n.public_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <div className="flex-1 text-center">
                        {/* Same type as the footer headings and links. */}
                        <h3 className="text-base md:text-lg font-semibold text-[var(--primary-blue)] leading-snug group-hover:text-[var(--orange-accent)] transition-colors duration-300 line-clamp-2">
                          {n.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1.5">
                          <span className="text-[var(--orange-accent)] font-semibold text-base">
                            {n.votes.toLocaleString("en-GB")}
                          </span>{" "}
                          {n.votes === 1 ? "vote" : "votes"}
                        </p>
                        {/* Any phone, no internet: dial, press 1, type the code. On a
                            phone, tapping opens the dialer with the code typed in. */}
                        {n.public_id !== null && !closed && (
                          <a
                            href={ussdVote(brand.ussdCode, n.public_id).href}
                            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[var(--tint-blue)] px-2 py-2 text-[var(--primary-blue)] hover:text-[var(--orange-accent)] transition-colors duration-300"
                            title="Vote by USSD from any phone"
                          >
                            <Smartphone className="w-4 h-4 shrink-0 text-[var(--orange-accent)]" />
                            <span className="text-xs leading-tight text-left">
                              <span className="block text-gray-500">Vote by USSD</span>
                              <span className="font-semibold tracking-wide">
                                {ussdVote(brand.ussdCode, n.public_id).steps}
                              </span>
                            </span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 md:gap-2 mt-4">
                        <button
                          type="button"
                          disabled={!canVote}
                          onClick={() => open(n)}
                          className="btn-primary flex-1 min-w-0 px-2 md:px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {closed ? "Voting closed" : "Vote"}
                        </button>
                        <IconButton
                          small
                          label={`Share ${n.name}`}
                          onClick={() =>
                            setShare({
                              title: `Share ${n.name}`,
                              text:
                                `Vote for ${n.name} in ${category.name} — ${campaignTitle}.` +
                                (n.public_id !== null
                                  ? ` No internet? Dial ${ussdVote(brand.ussdCode, n.public_id).steps}.`
                                  : ""),
                              url: link(`?nominee=${encodeURIComponent(slugs.nominee.get(n.id) ?? "")}`),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        ))}
      </div>

      {share && <ShareModal {...share} onClose={() => setShare(null)} />}

      {nominee && (
        <Shell
          title={step === "pay" ? "Pay with MoMo" : `Vote for ${nominee.name}`}
          subtitle={chosen ? `${votesLabel(chosen.number_of_votes)} · ${formatPrice(chosen.price)}` : undefined}
          wide={step === "pay"}
          onClose={close}
        >
          {/* The payment for the selected choice is prepared while the buyer is
              still on the form — hidden here — so "Pay" just reveals it. */}
          {prepared && (
            <div hidden={step !== "pay"}>
              <PayStep
                key={`${nominee.id}:${prepared.id}:${attempt}`}
                active={step === "pay"}
                input={{ service: "VOTE", targetId: nominee.id, packageId: prepared.id }}
                successTitle="Thank you for voting"
                successText={
                  <>
                    Your {votesLabel(prepared.number_of_votes)} for{" "}
                    <span className="font-semibold text-[var(--primary-blue)]">{nominee.name}</span> have been
                    counted.
                  </>
                }
                onBack={() => {
                  setAttempt((a) => a + 1);
                  setStep("form");
                }}
                onClose={close}
              />
            </div>
          )}
          {step === "form" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(chosen ? "" : "Choose how many votes.");
                if (!chosen) return;
                setPreparedId(chosen.id); // in case Pay beat the short preparation delay
                setStep("pay");
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
                {nominee.public_id !== null && (
                  <p className="text-gray-400 text-xs mt-1">
                    Or from any phone: dial{" "}
                    <a
                      href={ussdVote(brand.ussdCode, nominee.public_id).href}
                      className="font-semibold text-[var(--primary-blue)] hover:text-[var(--orange-accent)]"
                    >
                      {ussdVote(brand.ussdCode, nominee.public_id).steps}
                    </a>
                  </p>
                )}
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

/** Square share button, as in the category header and on each nominee. */
function IconButton({ label, onClick, small = false }: { label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`shrink-0 ${small ? "w-9 h-9 md:w-10 md:h-10" : "w-10 h-10"} rounded-lg border border-gray-200 text-gray-600 hover:text-[var(--orange-accent)] hover:border-[var(--orange-accent)] flex items-center justify-center transition-colors duration-300`}
    >
      <Share2 className="w-4 h-4" />
    </button>
  );
}
