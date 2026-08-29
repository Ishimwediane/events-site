"use client";

import { useMemo, useState } from "react";
import { Ticket, AlertCircle, ArrowRight } from "lucide-react";
import type { TicketType } from "@/lib/api";
import PaymentModal, { Shell } from "./PaymentModal";
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
 * Tier list in the page, then the same two steps the organiser platform uses:
 * a checkout modal for who the tickets are for, then the payment modal.
 */
export default function TicketPicker({ tiers }: { tiers: TicketType[] }) {
  const now = useMemo(() => new Date(), []);
  const states = useMemo(() => new Map(tiers.map((t) => [t.id, saleState(t, now)])), [tiers, now]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const selected = tiers.find((t) => t.id === selectedId) ?? null;
  const total = selected ? Number(selected.price) * quantity : 0;
  const anyOpen = tiers.some((t) => states.get(t.id) === "open");

  function choose(tier: TicketType) {
    setSelectedId(tier.id);
    setQuantity(1);
    setCheckoutOpen(true);
  }

  if (tiers.length === 0) {
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
      <div className="bg-white rounded-2xl border border-[var(--border-color)] p-6 md:p-8">
        <h3 className="text-xs font-bold text-[var(--primary-blue)] uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[var(--orange-accent)]" />
          Get Tickets
        </h3>

        <div className="space-y-2">
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
                    {NOTE[state]}
                    {state === "open" && ` · ${tier.remaining} left`}
                  </p>
                </div>
                <p className="text-sm font-bold text-[var(--primary-blue)]">
                  {formatPrice(tier.price)}
                </p>
              </button>
            );
          })}
        </div>

        {!anyOpen && (
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
            <span>
              Online sales are not open for this event. Call {brand.phone} or {brand.phoneAlt} to
              reserve.
            </span>
          </div>
        )}

        {anyOpen && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-gray-400">Secure payment by MoMo or card</span>
          </div>
        )}
      </div>

      {/* Step 1 — who the tickets are for. */}
      {selected && checkoutOpen && !paymentOpen && (
        <Shell title="Checkout" subtitle={selected.name} onClose={() => setCheckoutOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPaymentOpen(true);
            }}
            className="space-y-5"
          >
            <div className="bg-[var(--tint-blue)] rounded-lg p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">Selected</p>
              <div className="flex items-center justify-between">
                <p className="text-[var(--primary-blue)] font-semibold text-sm">{selected.name}</p>
                <p className="text-[var(--orange-accent)] font-bold">
                  {formatPrice(selected.price)}
                </p>
              </div>
            </div>

            {/* Quantity is locked to 1, as on the organiser platform: multi-ticket
                totals land on uncalibrated amounts for the mobile-money fee.
                Restore a stepper once the full fee schedule is configured. */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-[var(--orange-accent)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--primary-blue)]">Quantity</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                    One ticket per order
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-[var(--primary-blue)] w-4 text-center">
                {quantity}
              </span>
            </div>

            <div>
              <Label htmlFor="co-name">Full Name</Label>
              <input id="co-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="field" />
            </div>

            <div>
              <Label htmlFor="co-email">Email</Label>
              <input id="co-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Your QR ticket is emailed here — check the address carefully.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                Total
              </span>
              <span className="text-lg font-bold text-[var(--primary-blue)]">
                {formatPrice(total)}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-lg bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Checkout Now <ArrowRight size={16} />
            </button>
          </form>
        </Shell>
      )}

      {/* Step 2 — pay. */}
      {selected && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => {
            setPaymentOpen(false);
            setCheckoutOpen(false);
          }}
          amount={total}
          targetId={selected.id}
          quantity={quantity}
          fullName={fullName.trim()}
          email={email.trim()}
        />
      )}
    </>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2"
    >
      {children}
    </label>
  );
}
