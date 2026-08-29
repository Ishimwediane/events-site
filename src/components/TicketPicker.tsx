"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ticket, CheckCircle2, AlertCircle, Loader2, Minus, Plus, Smartphone, CreditCard,
} from "lucide-react";
import type { TicketType, PaymentMethod } from "@/lib/api";
import { initiatePayment, getPaymentStatus, MIN_PAYMENT } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { brand } from "@/config/site";

/** How often to ask the backend whether the charge has settled. */
const POLL_MS = 4000;
/** Give up waiting after this long — the payment may still land via webhook. */
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

type Stage =
  | { kind: "form" }
  | { kind: "sending" }
  | { kind: "waiting"; txnRef: string; method: PaymentMethod }
  | { kind: "done"; count: number; email: string }
  | { kind: "failed"; message: string }
  | { kind: "timeout"; txnRef: string };

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

export default function TicketPicker({ tiers }: { tiers: TicketType[] }) {
  const now = useMemo(() => new Date(), []);
  const states = useMemo(() => new Map(tiers.map((t) => [t.id, saleState(t, now)])), [tiers, now]);

  const firstOpen = tiers.find((t) => states.get(t.id) === "open");
  const [selectedId, setSelectedId] = useState<string | null>(firstOpen?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("MOMO");
  const [stage, setStage] = useState<Stage>({ kind: "form" });

  const selected = tiers.find((t) => t.id === selectedId) ?? null;
  const maxQuantity = selected ? Math.min(selected.remaining, 10) : 1;
  const total = selected ? Number(selected.price) * quantity : 0;
  const anyOpen = tiers.some((t) => states.get(t.id) === "open");

  // Poll until the charge settles. Card payers are sent to the gateway as soon
  // as it hands us a URL; MoMo payers approve on their handset and we wait.
  const startedAt = useRef<number>(0);
  useEffect(() => {
    if (stage.kind !== "waiting") return;
    startedAt.current = Date.now();
    let cancelled = false;

    const timer = setInterval(async () => {
      const result = await getPaymentStatus(stage.txnRef);
      if (cancelled) return;

      if (result?.status === "SUCCESS") {
        clearInterval(timer);
        setStage({ kind: "done", count: quantity, email: email.trim() });
        return;
      }
      if (result?.status === "FAILED") {
        clearInterval(timer);
        setStage({
          kind: "failed",
          message: result.gatewayMessage || "The payment was declined. Nothing has been charged.",
        });
        return;
      }
      if (stage.method === "CARD" && result?.redirectUrl) {
        clearInterval(timer);
        window.location.href = result.redirectUrl;
        return;
      }
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setStage({ kind: "timeout", txnRef: stage.txnRef });
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stage, quantity, email]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    if (total < MIN_PAYMENT) {
      setStage({ kind: "failed", message: `The minimum payment is ${formatPrice(MIN_PAYMENT)}.` });
      return;
    }

    setStage({ kind: "sending" });

    const result = await initiatePayment({
      amount: total,
      // The gateway wants the full international form, no leading zero.
      phone_number: `+250${phone.replace(/\D/g, "").replace(/^0+/, "").replace(/^250/, "")}`,
      email: email.trim(),
      payment_method: method,
      target_id: selected.id,
      quantity,
      full_name: fullName.trim(),
      card_redirect_url:
        typeof window !== "undefined" ? `${window.location.origin}/payment-complete` : undefined,
    });

    if (result.ok) setStage({ kind: "waiting", txnRef: result.txnRef, method });
    else setStage({ kind: "failed", message: result.error });
  }

  if (tiers.length === 0) {
    return (
      <Panel>
        <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">No tickets have been published yet.</p>
        <p className="text-xs text-gray-400 mt-2">
          Call {brand.phone} to be told when they go on sale.
        </p>
      </Panel>
    );
  }

  if (stage.kind === "done") {
    return (
      <div className="bg-white rounded-2xl border-2 border-[var(--orange-accent)] p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[var(--orange-accent)] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)] mb-2">
          {stage.count} {stage.count === 1 ? "ticket" : "tickets"} confirmed
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your QR {stage.count === 1 ? "ticket has" : "tickets have"} been sent to{" "}
          <span className="font-semibold text-[var(--primary-blue)]">{stage.email}</span>. Show it at
          the gate to be scanned in.
        </p>
        <button
          onClick={() => {
            setStage({ kind: "form" });
            setQuantity(1);
          }}
          className="mt-5 text-sm font-semibold text-[var(--orange-accent)] underline"
        >
          Book more tickets
        </button>
      </div>
    );
  }

  if (stage.kind === "waiting") {
    return (
      <Panel>
        <Loader2 className="w-10 h-10 text-[var(--orange-accent)] mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">
          {stage.method === "MOMO" ? "Approve on your phone" : "Opening the payment page…"}
        </h3>
        {stage.method === "MOMO" && (
          <p className="text-sm text-gray-500 leading-relaxed">
            Check your handset for the payment prompt. If nothing appears, dial{" "}
            <b className="text-[var(--primary-blue)]">*182*7*1#</b> to approve the pending payment.
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-4">
          Keep this page open — your tickets are issued the moment payment clears.
        </p>
      </Panel>
    );
  }

  if (stage.kind === "timeout") {
    return (
      <Panel>
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--primary-blue)] mb-2">
          Still waiting on the payment
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          It has not cleared yet. If the money has left your account the tickets will still be
          emailed to you — quote reference{" "}
          <b className="text-[var(--primary-blue)] break-all">{stage.txnRef}</b> if you need to call
          us on {brand.phone}.
        </p>
        <button
          onClick={() => setStage({ kind: "form" })}
          className="mt-5 text-sm font-semibold text-[var(--orange-accent)] underline"
        >
          Start again
        </button>
      </Panel>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--border-color)] p-6 md:p-8">
      <h3 className="text-xs font-bold text-[var(--primary-blue)] uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
        <Ticket className="w-4 h-4 text-[var(--orange-accent)]" />
        Get Tickets
      </h3>

      <div className="space-y-2 mb-6">
        {tiers.map((tier) => {
          const state = states.get(tier.id)!;
          const disabled = state !== "open";
          const active = tier.id === selectedId;
          return (
            <button
              key={tier.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                setSelectedId(tier.id);
                setQuantity(1);
                setStage({ kind: "form" });
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all ${
                active
                  ? "border-[var(--orange-accent)] bg-[var(--orange-accent)]/5"
                  : "border-gray-200 hover:border-[var(--orange-accent)]/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div>
                <p
                  className={`text-sm font-semibold ${
                    active ? "text-[var(--orange-accent)]" : "text-[var(--primary-blue)]"
                  }`}
                >
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
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
          <span>
            Online sales are not open for this event. Call {brand.phone} or {brand.phoneAlt} to
            reserve.
          </span>
        </div>
      )}

      {selected && anyOpen && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <StepButton onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} label="Decrease quantity">
                <Minus size={16} />
              </StepButton>
              <span className="text-lg font-semibold text-[var(--primary-blue)] w-8 text-center">
                {quantity}
              </span>
              <StepButton onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} disabled={quantity >= maxQuantity} label="Increase quantity">
                <Plus size={16} />
              </StepButton>
              <span className="text-xs text-gray-400 ml-auto">max {maxQuantity}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="tp-name">Full Name</Label>
            <input id="tp-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="field" />
          </div>

          <div>
            <Label htmlFor="tp-email">Email</Label>
            <input id="tp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Your QR ticket is emailed here — check the address carefully.
            </p>
          </div>

          <div>
            <Label>Pay With</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["MOMO", "CARD"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all ${
                    method === m
                      ? "bg-[var(--orange-accent)] text-white border-[var(--orange-accent)]"
                      : "text-gray-500 border-gray-200 hover:border-[var(--orange-accent)]/50"
                  }`}
                >
                  {m === "MOMO" ? <Smartphone size={16} /> : <CreditCard size={16} />}
                  {m === "MOMO" ? "MoMo" : "Card"}
                </button>
              ))}
            </div>
          </div>

          {method === "MOMO" && (
            <div>
              <Label htmlFor="tp-phone">MTN MoMo Number</Label>
              <div className="flex gap-2">
                <span className="px-3 py-3 rounded-lg bg-[var(--tint-blue)] text-sm text-[var(--primary-blue)] font-semibold">
                  +250
                </span>
                <input id="tp-phone" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="78 000 0000" className="field flex-1" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em]">Total</span>
            <span className="text-lg font-bold text-[var(--primary-blue)]">{formatPrice(total)}</span>
          </div>

          {stage.kind === "failed" && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{stage.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={stage.kind === "sending"}
            className="w-full bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-8 py-4 rounded-lg transition-all text-sm font-semibold uppercase tracking-wider shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {stage.kind === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Starting payment…
              </>
            ) : (
              `Pay ${formatPrice(total)}`
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            Tickets are issued once payment clears. MoMo {brand.momoCode} — {brand.legalName}
          </p>
        </form>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border-color)] p-8 text-center">
      {children}
    </div>
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

function StepButton({
  onClick, disabled, label, children,
}: {
  onClick: () => void; disabled: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[var(--primary-blue)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
