"use client";

import { useMemo, useState } from "react";
import { Ticket, AlertCircle, ArrowRight } from "lucide-react";
import type { TicketType } from "@/lib/api";
import { toRwandaMomo } from "@/lib/api";
import { Shell, PayStep, MomoField, FieldLabel, FormError, PayButton, momoError } from "./PaymentModal";
import { formatPrice } from "@/lib/format";
import { brand } from "@/config/site";

/** A tier is buyable only inside its sale window and while stock remains. */
function saleState(tier: TicketType, now: Date) {
  if (tier.remaining <= 0) return "sold-out" as const;
  if (now < new Date(tier.sale_start)) return "not-open" as const;
  if (now > new Date(tier.sale_end)) return "closed" as const;
  return "open" as const;
}

const NOTE: Record<ReturnType<typeof saleState>, string> = {
  open: "Available",
  "sold-out": "Sold out",
  "not-open": "Not on sale yet",
  closed: "Sales closed",
};

/**
 * Tier list in the page, then one modal: MoMo number + email, then the
 * Weflexfy payment page inside the same modal.
 */
export default function TicketPicker({
  tiers,
  variant = "rail",
}: {
  tiers: TicketType[];
  /** "rail" is the boxed Get Tickets panel; "list" is the Ticket Types card. */
  variant?: "rail" | "list";
}) {
  const now = useMemo(() => new Date(), []);
  const states = useMemo(() => new Map(tiers.map((t) => [t.id, saleState(t, now)])), [tiers, now]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  /** null = closed. The modal stays mounted across the step change. */
  const [step, setStep] = useState<null | "checkout" | "pay">(null);

  const selected = tiers.find((t) => t.id === selectedId) ?? null;
  const total = selected ? Number(selected.price) * quantity : 0;
  const anyOpen = tiers.some((t) => states.get(t.id) === "open");

  function choose(tier: TicketType) {
    setSelectedId(tier.id);
    setQuantity(1);
    setError("");
    setStep("checkout");
  }

  const close = () => setStep(null);

  if (tiers.length === 0) {
    if (variant === "list") return null;
    return (
      <div className="bg-white rounded-2xl border border-[var(--border-color)] p-8 text-center">
        <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">No tickets have been published yet.</p>
        <p className="text-xs text-gray-400 mt-2">
          Call {brand.phone} to be told when they go on sale.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={
          variant === "rail"
            ? "bg-white rounded-2xl border border-[var(--border-color)] p-6 md:p-8"
            : ""
        }
      >
        {variant === "rail" && (
          <h3 className="text-xs font-bold text-[var(--primary-blue)] uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[var(--orange-accent)]" />
            Get Tickets
          </h3>
        )}

        <div className={variant === "rail" ? "space-y-2" : "space-y-3"}>
          {tiers.map((tier) => {
            const state = states.get(tier.id)!;
            const disabled = state !== "open";
            return (
              <button
                key={tier.id}
                type="button"
                disabled={disabled}
                onClick={() => choose(tier)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all group ${
                  disabled
                    ? "border-gray-200 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-[var(--orange-accent)] hover:bg-[var(--orange-accent)]/5"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--primary-blue)] group-hover:text-[var(--orange-accent)] transition-colors">
                    {tier.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-0.5">
                    {variant === "list" && state === "open"
                      ? "Click to purchase"
                      : NOTE[state]}
                    {variant === "rail" && state === "open" && ` · ${tier.remaining} left`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--primary-blue)]">
                    {formatPrice(tier.price)}
                  </p>
                  {variant === "list" && state === "open" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--orange-accent)] mt-0.5">
                      Buy Now <ArrowRight size={10} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!anyOpen && variant === "rail" && (
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
            <span>
              Online sales are not open for this event. Call {brand.phone} to reserve.
            </span>
          </div>
        )}

        {anyOpen && variant === "rail" && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-gray-400">Secure payment with MTN MoMo</span>
          </div>
        )}
      </div>

      {/* One modal; the contents move from the form to the payment page. */}
      {selected && step && (
        <Shell
          title={step === "pay" ? "Pay with MoMo" : "Get Ticket"}
          subtitle={`${selected.name} · ${formatPrice(total)}`}
          wide={step === "pay"}
          onClose={close}
        >
          {step === "pay" ? (
            <PayStep
              input={{
                service: "TICKET",
                targetId: selected.id,
                phone: toRwandaMomo(phone)!,
                email: email.trim(),
                quantity,
              }}
              successTitle="You're in!"
              successText={
                <>
                  Your QR ticket has been emailed to{" "}
                  <b className="text-[var(--primary-blue)]">{email.trim()}</b> — show it at the gate.
                </>
              }
              onBack={() => setStep("checkout")}
              onClose={close}
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const problem = momoError(phone);
                setError(problem ?? "");
                if (!problem) setStep("pay");
              }}
              className="space-y-5"
            >
              <MomoField value={phone} onChange={setPhone} id="tk-phone" />

              <div>
                <FieldLabel htmlFor="tk-email">Email</FieldLabel>
                <input
                  id="tk-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="field"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">Your QR ticket is sent here.</p>
              </div>

              <FormError message={error} />

              {/* Quantity is locked to 1, as on the organiser platform: multi-ticket
                  totals land on uncalibrated amounts for the mobile-money fee. */}
              <PayButton>
                Pay {formatPrice(total)} <ArrowRight size={16} />
              </PayButton>
            </form>
          )}
        </Shell>
      )}
    </>
  );
}
