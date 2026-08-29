"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Smartphone, CreditCard, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import type { PaymentMethod } from "@/lib/api";
import {
  initiatePayment, getPaymentStatus, MIN_PAYMENT, COUNTRY_CODES, PENDING_REF_KEY,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { brand } from "@/config/site";

/** Same cadence the organiser platform polls at. */
const POLL_MS = 3000;
/** Stop waiting eventually; the webhook can still fulfil it afterwards. */
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

type Status = "IDLE" | "PROCESSING" | "SUCCESS" | "WARNING" | "ERROR" | "TIMEOUT";

/**
 * Payment step, laid out like the organiser platform's modal — total panel,
 * MoMo/Card toggle, then the fields that method needs — but in this site's
 * palette rather than the platform's dark chrome.
 */
export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  targetId,
  quantity,
  fullName,
  email,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  targetId: string;
  quantity: number;
  fullName: string;
  email: string;
  onSuccess?: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("MOMO");
  const [countryCode, setCountryCode] = useState<string>(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("IDLE");
  const [message, setMessage] = useState("");
  const [txnRef, setTxnRef] = useState<string | null>(null);
  const startedAt = useRef(0);

  // Lock the page behind the modal, and reset when it closes.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setStatus("IDLE");
      setTxnRef(null);
      setMessage("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Poll while a charge is outstanding — including after a failed USSD prompt,
  // because the buyer can still approve it manually.
  useEffect(() => {
    if (!txnRef || (status !== "PROCESSING" && status !== "WARNING")) return;
    startedAt.current = startedAt.current || Date.now();
    let cancelled = false;

    const timer = setInterval(async () => {
      const result = await getPaymentStatus(txnRef);
      if (cancelled) return;

      if (method === "CARD" && result?.redirectUrl) {
        clearInterval(timer);
        sessionStorage.setItem(PENDING_REF_KEY, txnRef);
        window.location.href = result.redirectUrl;
        return;
      }
      if (result?.status === "SUCCESS") {
        clearInterval(timer);
        setStatus("SUCCESS");
        onSuccess?.();
        return;
      }
      if (result?.status === "FAILED") {
        clearInterval(timer);
        setMessage(result.gatewayMessage || "The payment was declined. Nothing has been charged.");
        setStatus("ERROR");
        return;
      }
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setStatus("TIMEOUT");
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [txnRef, status, method, onSuccess]);

  if (!isOpen) return null;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (amount < MIN_PAYMENT) {
      setMessage(`The minimum payment is ${formatPrice(MIN_PAYMENT)}.`);
      setStatus("ERROR");
      return;
    }

    setStatus("PROCESSING");
    startedAt.current = Date.now();

    const result = await initiatePayment({
      amount,
      phone_number: `${countryCode}${phone.replace(/\D/g, "").replace(/^0+/, "")}`,
      email,
      payment_method: method,
      target_id: targetId,
      quantity,
      full_name: fullName,
      card_redirect_url:
        typeof window !== "undefined" ? `${window.location.origin}/payment-complete` : undefined,
    });

    if (!result.ok) {
      if (result.txnRef) setTxnRef(result.txnRef);
      setMessage(result.error);
      setStatus("ERROR");
      return;
    }

    setTxnRef(result.txnRef);

    if (method === "CARD" && result.redirectUrl) {
      sessionStorage.setItem(PENDING_REF_KEY, result.txnRef);
      window.location.href = result.redirectUrl;
      return;
    }

    if (method === "MOMO" && result.lmbStatus === "fail") {
      setMessage(result.lmbMessage || "The prompt could not be delivered to your phone.");
      setStatus("WARNING");
      return;
    }

    setStatus("PROCESSING");
  }

  return (
    <Shell title="Complete Payment" onClose={onClose}>
      {status === "SUCCESS" ? (
        <div className="py-6 text-center">
          <div className="w-20 h-20 bg-[var(--orange-accent)]/10 text-[var(--orange-accent)] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h4 className="text-2xl font-semibold text-[var(--primary-blue)] mb-2">Confirmed</h4>
          <p className="text-gray-500 text-sm leading-relaxed px-2 mb-8">
            Payment received. Your QR {quantity === 1 ? "ticket has" : "tickets have"} been emailed
            to <b className="text-[var(--primary-blue)]">{email}</b> — show it at the gate.
          </p>
          <button onClick={onClose} className="w-full btn-primary py-4 justify-center">
            Done
          </button>
        </div>
      ) : status === "WARNING" ? (
        <div className="py-6 text-center">
          <div className="w-16 h-16 bg-[var(--orange-accent)]/10 text-[var(--orange-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h4 className="text-xl font-semibold text-[var(--primary-blue)] mb-2">
            Prompt did not arrive
          </h4>
          <p className="text-gray-500 text-sm mb-3 px-2 leading-relaxed">{message}</p>
          <p className="text-gray-500 text-sm mb-6 px-2 leading-relaxed">
            Dial <b className="text-[var(--primary-blue)] tracking-wider">*182*7*1#</b> on your MoMo
            number to approve it. We are still watching for the payment.
          </p>
          <button onClick={() => setStatus("IDLE")} className="w-full btn-outline py-4">
            Try Again
          </button>
        </div>
      ) : status === "TIMEOUT" ? (
        <div className="py-6 text-center">
          <AlertCircle size={40} className="text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-[var(--primary-blue)] mb-2">
            Still waiting on the payment
          </h4>
          <p className="text-gray-500 text-sm mb-6 px-2 leading-relaxed">
            If the money has left your account the tickets will still be emailed to you. Quote{" "}
            <b className="text-[var(--primary-blue)] break-all">{txnRef}</b> if you need to call us
            on {brand.phone}.
          </p>
          <button onClick={onClose} className="w-full btn-outline py-4">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={pay} className="space-y-5">
          <div className="bg-[var(--tint-blue)] rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-[var(--orange-accent)]">
                {formatPrice(amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">Tickets</p>
              <p className="text-[var(--primary-blue)] font-semibold text-sm">{quantity}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-lg">
            {(["MOMO", "CARD"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex items-center justify-center gap-2 py-3 rounded-md transition-all ${
                  method === m
                    ? "bg-[var(--orange-accent)] text-white"
                    : "text-gray-500 hover:text-[var(--primary-blue)]"
                }`}
              >
                {m === "MOMO" ? <Smartphone size={16} /> : <CreditCard size={16} />}
                <span className="font-semibold uppercase text-xs">
                  {m === "MOMO" ? "MoMo" : "Card"}
                </span>
              </button>
            ))}
          </div>

          {method === "MOMO" && (
            <div>
              <label
                htmlFor="pm-phone"
                className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2"
              >
                MoMo Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country code"
                  className="field w-auto pr-2 font-semibold"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  id="pm-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="780000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field flex-1"
                />
              </div>
            </div>
          )}

          {status === "ERROR" && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {status === "PROCESSING" && method === "MOMO" ? (
            <div className="p-3 bg-[var(--orange-accent)]/10 border border-[var(--orange-accent)]/30 text-[var(--orange-hover)] text-xs rounded-lg flex gap-2 leading-relaxed">
              <Smartphone size={16} className="shrink-0 mt-0.5" />
              <span>
                <b className="text-[var(--primary-blue)]">Check your phone</b> for the MoMo prompt
                and enter your PIN to approve.
                <br />
                If your screen was off or you did not see it, unlock your phone, or dial{" "}
                <b className="text-[var(--primary-blue)] tracking-wider">*182*7*1#</b> to approve
                the pending payment.
              </span>
            </div>
          ) : (
            method === "MOMO" && (
              <p className="text-[11px] text-gray-400 leading-relaxed -mt-2">
                You will get a prompt on your phone to enter your MoMo PIN. If it does not appear,
                dial <span className="text-[var(--primary-blue)]">*182*7*1#</span> to approve.
              </p>
            )
          )}

          <button
            type="submit"
            disabled={status === "PROCESSING"}
            className="w-full py-4 rounded-lg bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white font-semibold text-xs uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {status === "PROCESSING" ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              `Pay ${formatPrice(amount)}`
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            MoMo {brand.momoCode} — {brand.legalName}
          </p>
        </form>
      )}
    </Shell>
  );
}

/**
 * The modal frame both steps share.
 *
 * Rendered through a portal on purpose. The event page wraps its content in a
 * `relative z-20` container, which opens a stacking context — a modal rendered
 * inside it can never rise above the fixed navbar (z-50), however high its own
 * z-index. Portalling to <body> takes it out of that context entirely.
 */
export function Shell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Escape closes, as it should for any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[var(--primary-blue)]/80 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[var(--border-color)] w-full max-w-sm shadow-2xl relative max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-[var(--primary-blue)] uppercase tracking-[0.2em] leading-none">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[9px] font-bold text-[var(--orange-accent)] uppercase tracking-[0.15em] mt-1.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-[var(--primary-blue)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
