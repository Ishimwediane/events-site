"use client";

import { useMemo, useState } from "react";
import { Ticket, CheckCircle2, AlertCircle, Loader2, Minus, Plus } from "lucide-react";
import type { TicketType } from "@/lib/api";
import { purchaseTickets } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { brand } from "@/config/site";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; count: number; email: string }
  | { kind: "error"; message: string };

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
  // Evaluated once per mount so the server and client agree on first paint.
  const now = useMemo(() => new Date(), []);
  const states = useMemo(
    () => new Map(tiers.map((t) => [t.id, saleState(t, now)])),
    [tiers, now],
  );

  const firstOpen = tiers.find((t) => states.get(t.id) === "open");
  const [selectedId, setSelectedId] = useState<string | null>(firstOpen?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const selected = tiers.find((t) => t.id === selectedId) ?? null;
  const maxQuantity = selected ? Math.min(selected.remaining, 10) : 1;
  const total = selected ? Number(selected.price) * quantity : 0;
  const anyOpen = tiers.some((t) => states.get(t.id) === "open");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setStatus({ kind: "sending" });
    const result = await purchaseTickets({
      ticket_type_id: selected.id,
      quantity,
      full_name: fullName.trim(),
      email: email.trim(),
    });

    if (result.ok) {
      setStatus({ kind: "done", count: quantity, email: email.trim() });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
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

  if (status.kind === "done") {
    return (
      <div className="bg-white rounded-2xl border-2 border-[var(--orange-accent)] p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[var(--orange-accent)] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)] mb-2">
          {status.count} {status.count === 1 ? "ticket" : "tickets"} reserved
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your QR {status.count === 1 ? "ticket has" : "tickets have"} been sent to{" "}
          <span className="font-semibold text-[var(--primary-blue)]">{status.email}</span>. Show it
          at the gate to be scanned in.
        </p>
        <button
          onClick={() => {
            setStatus({ kind: "idle" });
            setQuantity(1);
          }}
          className="mt-5 text-sm font-semibold text-[var(--orange-accent)] underline"
        >
          Book more tickets
        </button>
      </div>
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
                setStatus({ kind: "idle" });
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
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
          <span>
            Online sales are not open for this event. Call {brand.phone} or{" "}
            {brand.phoneAlt} to reserve.
          </span>
        </div>
      )}

      {selected && anyOpen && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[var(--primary-blue)] disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="text-lg font-semibold text-[var(--primary-blue)] w-8 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[var(--primary-blue)] disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
              <span className="text-xs text-gray-400 ml-auto">max {maxQuantity}</span>
            </div>
          </div>

          <div>
            <label htmlFor="tp-name" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
              Full Name
            </label>
            <input
              id="tp-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="tp-email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
              Email
            </label>
            <input
              id="tp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Your QR ticket is emailed here — check the address carefully.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em]">
              Total
            </span>
            <span className="text-lg font-bold text-[var(--primary-blue)]">
              {formatPrice(total)}
            </span>
          </div>

          {status.kind === "error" && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{status.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status.kind === "sending"}
            className="w-full bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-8 py-4 rounded-lg transition-all text-sm font-semibold uppercase tracking-wider shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status.kind === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Reserving…
              </>
            ) : (
              "Reserve Now"
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            Pay by MTN MoMo to {brand.momoCode} — {brand.legalName}
          </p>
        </form>
      )}
    </div>
  );
}
