"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Vote } from "lucide-react";
import type { Nominee, PublicCampaign, VotePackage } from "@/lib/api";
import { toRwandaMomo } from "@/lib/api";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import { Shell, PayStep, MomoField, FieldLabel, FormError, PayButton, momoError } from "./PaymentModal";

const NOMINEE_FALLBACK = "/images/nominees.jpg";

/**
 * Nominees by category, each with a Vote button. Voting is one short form —
 * MoMo number and how many votes — then the Weflexfy payment page inside the
 * same modal. No name or email: buyers are in Rwanda and pay by phone.
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
  const [phone, setPhone] = useState("");
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

  if (categories.every((c) => c.nominees.length === 0)) {
    return <p className="text-center text-gray-500 py-16">Nominees will be announced soon.</p>;
  }

  return (
    <>
      <div className="space-y-16">
        {categories
          .filter((c) => c.nominees.length > 0)
          .map((category) => (
            <div key={category.id}>
              <h2 className="text-xl md:text-2xl font-semibold text-[var(--primary-blue)] mb-1">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-gray-500 mb-6">{category.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
                {category.nominees.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white border border-[var(--border-color)] rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <Image
                        src={imageUrl(n.profile_image, NOMINEE_FALLBACK)}
                        alt={n.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover object-top"
                      />
                      {n.public_id !== null && (
                        <span className="absolute top-2 left-2 bg-white/90 text-[var(--primary-blue)] text-[10px] font-bold px-2 py-1 rounded-full">
                          #{n.public_id}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[var(--primary-blue)] leading-snug">{n.name}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {n.votes.toLocaleString("en-GB")} {n.votes === 1 ? "vote" : "votes"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canVote}
                        onClick={() => open(n)}
                        className="w-full py-2.5 rounded-lg bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-1.5"
                      >
                        <Vote size={14} /> {closed ? "Closed" : "Vote"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {nominee && (
        <Shell
          title={step === "pay" ? "Pay with MoMo" : `Vote for ${nominee.name}`}
          subtitle={chosen ? `${chosen.number_of_votes} ${chosen.number_of_votes === 1 ? "vote" : "votes"} · ${formatPrice(chosen.price)}` : undefined}
          wide={step === "pay"}
          onClose={close}
        >
          {step === "pay" && chosen ? (
            <PayStep
              input={{
                service: "VOTE",
                targetId: nominee.id,
                phone: toRwandaMomo(phone)!,
                packageId: chosen.id,
              }}
              successTitle="Thank you!"
              successText={
                <>
                  Your {chosen.number_of_votes} {chosen.number_of_votes === 1 ? "vote" : "votes"} for{" "}
                  <b className="text-[var(--primary-blue)]">{nominee.name}</b> have been counted.
                </>
              }
              onBack={() => setStep("form")}
              onClose={close}
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const problem = chosen ? momoError(phone) : "Choose how many votes.";
                setError(problem ?? "");
                if (!problem) setStep("pay");
              }}
              className="space-y-5"
            >
              <MomoField value={phone} onChange={setPhone} id="vote-phone" />

              <div>
                <FieldLabel>Number of votes</FieldLabel>
                <div className="space-y-2" role="radiogroup" aria-label="Number of votes">
                  {sorted.map((p) => {
                    const active = p.id === packageId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPackageId(p.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-lg border text-left transition-all ${
                          active
                            ? "border-[var(--orange-accent)] bg-[var(--orange-accent)]/5"
                            : "border-gray-200 hover:border-[var(--orange-accent)]/50"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              active ? "bg-[var(--orange-accent)] border-[var(--orange-accent)] text-white" : "border-gray-300"
                            }`}
                          >
                            {active && <Check size={12} />}
                          </span>
                          <span className="text-sm font-semibold text-[var(--primary-blue)]">
                            {p.number_of_votes} {p.number_of_votes === 1 ? "vote" : "votes"}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-[var(--primary-blue)]">{formatPrice(p.price)}</span>
                      </button>
                    );
                  })}
                </div>
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
