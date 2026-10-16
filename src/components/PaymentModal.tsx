"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, preconnect } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import type { InitiatePaymentInput } from "@/lib/api";
import { initiatePayment, getPaymentStatus } from "@/lib/api";
import { brand } from "@/config/site";

/** Same cadence the organiser platform polls at. */
const POLL_MS = 3000;
/** While the payment page URL is still on its way. */
const FAST_POLL_MS = 1000;
const WEFLEXFY_URL = "https://weflexfy.com";
/** The buyer is approving on the Weflexfy page meanwhile; give them time. */
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
/** Only trust status messages that really come from the payment page. */
const WEFLEXFY_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*weflexfy\.com$/;

/**
 * The modal frame. Checkout and payment share ONE instance of this, switching
 * only their contents — mounting a second modal for step two tore the first
 * portal down before the second appeared, which flashed blank and let the page
 * behind jump as the scroll lock was released and retaken.
 *
 * Rendered through a portal on purpose: the event page wraps its content in a
 * `relative z-20` container, and a modal nested inside that stacking context
 * can never rise above the fixed navbar however high its own z-index.
 */
export function Shell({
  title,
  subtitle,
  wide = false,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Room for the embedded payment page. */
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Warm up the connection to the payment page while the buyer fills the
  // form, so it opens without a fresh DNS + TLS handshake after "Pay".
  preconnect(WEFLEXFY_URL);

  // One place owns the scroll lock, for the whole time the modal is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

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
        className={`bg-white rounded-lg border border-gray-100 w-full ${
          wide ? "max-w-md" : "max-w-sm"
        } shadow-xl relative max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden transition-[max-width] duration-300`}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[var(--primary-blue)] leading-tight">{title}</h3>
            {subtitle && <p className="text-gray-600 text-sm mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-[var(--orange-accent)] transition-colors duration-300 mt-0.5"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--primary-blue)] mb-2">
      {children}
    </label>
  );
}

type PayState =
  | { kind: "starting" }
  | { kind: "paying"; url: string }
  | { kind: "confirming" }
  | { kind: "success" }
  | { kind: "failed"; message: string }
  | { kind: "cancelled" }
  | { kind: "timeout" };

/**
 * The payment step, for tickets and votes alike. Starts the charge, shows the
 * Weflexfy payment page inside the modal (the buyer never leaves the site),
 * and ends on our own success screen.
 *
 * Weflexfy completes every payment on its hosted page — it asks for the MoMo
 * number and sends the prompt, so our forms never ask for it. The page posts PAYMENT_STATUS messages (init, success,
 * failed, close), but the backend status endpoint is the source of truth: the
 * order is fulfilled only when Weflexfy's webhook has marked it SUCCESS.
 */
export function PayStep({
  input,
  successTitle,
  successText,
  onBack,
  onClose,
}: {
  input: InitiatePaymentInput;
  successTitle: string;
  successText: React.ReactNode;
  /** Back to the form (wrong number, cancelled). */
  onBack: () => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<PayState>({ kind: "starting" });
  const [txnRef, setTxnRef] = useState<string | null>(null);
  const started = useRef(false);
  const startedAt = useRef(0);

  // Start the charge once (guarded: React runs effects twice in development).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startedAt.current = Date.now();
    initiatePayment(input).then((result) => {
      if (!result.ok) {
        if (result.txnRef) setTxnRef(result.txnRef);
        setState({ kind: "failed", message: result.error });
        return;
      }
      setTxnRef(result.txnRef);
      if (result.redirectUrl) setState({ kind: "paying", url: result.redirectUrl });
    });
  }, [input]);

  const settled = state.kind === "success" || state.kind === "failed" || state.kind === "cancelled" || state.kind === "timeout";
  // The API normally returns the payment page with initiate. Only when it fell
  // back to the worker does the URL come from polling — then check every second.
  const waitingForPage = state.kind === "starting";

  // Poll the backend: first for the payment page URL, then for the outcome.
  useEffect(() => {
    if (!txnRef || settled) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      const result = await getPaymentStatus(txnRef);
      if (cancelled) return;
      if (result?.status === "SUCCESS") return setState({ kind: "success" });
      if (result?.status === "FAILED") {
        return setState({
          kind: "failed",
          message: result.gatewayMessage || "The payment was declined. Nothing has been charged.",
        });
      }
      if (result?.redirectUrl) {
        setState((s) => (s.kind === "starting" ? { kind: "paying", url: result.redirectUrl! } : s));
      }
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) setState({ kind: "timeout" });
    }, waitingForPage ? FAST_POLL_MS : POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [txnRef, settled, waitingForPage]);

  // Messages from the embedded payment page.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!WEFLEXFY_ORIGIN.test(e.origin)) return;
      const data = e.data as { type?: string; status?: string } | null;
      if (!data || data.type !== "PAYMENT_STATUS") return;
      setState((s) => {
        if (s.kind === "success") return s;
        if (data.status === "success") return { kind: "confirming" };
        if (data.status === "failed") {
          return { kind: "failed", message: "The payment was declined. Nothing has been charged." };
        }
        if (data.status === "close") return { kind: "cancelled" };
        return s;
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (state.kind === "starting") {
    return (
      <Centered>
        <Loader2 className="animate-spin text-[var(--orange-accent)] w-10 h-10" />
        <p className="text-gray-600 text-sm">Opening secure MoMo payment…</p>
      </Centered>
    );
  }

  if (state.kind === "paying") {
    return (
      <div className="-m-5">
        <iframe
          src={state.url}
          title="Secure MoMo payment"
          allow="payment"
          className="block w-full border-0"
          style={{ height: "min(600px, calc(100dvh - 10rem))" }}
        />
      </div>
    );
  }

  if (state.kind === "confirming") {
    return (
      <Centered>
        <Loader2 className="animate-spin text-[var(--orange-accent)] w-10 h-10" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)]">Payment approved</h3>
        <p className="text-gray-600 text-sm">Confirming with MoMo — a few seconds…</p>
      </Centered>
    );
  }

  // Result screens follow the contact form's "Message sent" layout.
  if (state.kind === "success") {
    return (
      <Centered>
        <CheckCircle2 className="w-14 h-14 text-[var(--orange-accent)]" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)]">{successTitle}</h3>
        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{successText}</p>
        <button onClick={onClose} className="btn-primary w-full py-3 mt-4">
          Done
        </button>
      </Centered>
    );
  }

  if (state.kind === "cancelled") {
    return (
      <Centered>
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)]">Payment not finished</h3>
        <p className="text-gray-600 text-sm">Nothing has been charged.</p>
        <BackButton onBack={onBack} />
      </Centered>
    );
  }

  if (state.kind === "timeout") {
    return (
      <Centered>
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)]">Still waiting on the payment</h3>
        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
          If the money left your account it will still go through. Quote{" "}
          <span className="font-semibold text-[var(--primary-blue)] break-all">{txnRef}</span> if you call us
          on {brand.phone}.
        </p>
        <button onClick={onClose} className="btn-outline w-full py-3 mt-4">
          Close
        </button>
      </Centered>
    );
  }

  return (
    <Centered>
      <AlertCircle className="w-14 h-14 text-red-500" />
      <h3 className="text-xl font-semibold text-[var(--primary-blue)]">Payment failed</h3>
      <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{state.message}</p>
      <BackButton onBack={onBack} />
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">{children}</div>;
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="btn-outline w-full py-3 mt-4 inline-flex items-center justify-center gap-2">
      <ArrowLeft size={16} /> Try again
    </button>
  );
}

/** The site's orange button, full width — as on the event cards. */
export function PayButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2">
      {children}
    </button>
  );
}

/** Same as the contact form's error line. */
export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
