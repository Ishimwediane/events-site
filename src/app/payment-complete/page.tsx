"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getPaymentStatus } from "@/lib/api";
import { brand } from "@/config/site";

const POLL_MS = 4000;
const TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Where the card gateway sends a buyer back to. The gateway appends its own
 * reference, so read whichever parameter it used and poll until the charge
 * settles — the backend issues the tickets on SUCCESS.
 */
function PaymentCompleteInner() {
  const params = useSearchParams();
  const txnRef =
    params.get("txn_ref") ??
    params.get("OrderTrackingId") ??
    params.get("reference") ??
    params.get("ref");

  const [state, setState] = useState<"checking" | "success" | "failed" | "unknown">("checking");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!txnRef) {
      setState("unknown");
      return;
    }

    const started = Date.now();
    let cancelled = false;

    const tick = async () => {
      const result = await getPaymentStatus(txnRef);
      if (cancelled) return;

      if (result?.status === "SUCCESS") {
        setState("success");
        return true;
      }
      if (result?.status === "FAILED") {
        setMessage(result.gatewayMessage ?? null);
        setState("failed");
        return true;
      }
      if (Date.now() - started > TIMEOUT_MS) {
        setState("unknown");
        return true;
      }
      return false;
    };

    let timer: ReturnType<typeof setInterval>;
    void tick().then((done) => {
      if (done || cancelled) return;
      timer = setInterval(async () => {
        if (await tick()) clearInterval(timer);
      }, POLL_MS);
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [txnRef]);

  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-white py-20">
      <div className="container-custom max-w-lg text-center">
        {state === "checking" && (
          <>
            <Loader2 className="w-12 h-12 text-[var(--orange-accent)] mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-3">
              Confirming your payment
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              This takes a few seconds. Please do not close this page.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-[var(--orange-accent)] mx-auto mb-6" />
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-3">
              Payment confirmed
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Your QR ticket has been emailed to you. Show it at the gate to be scanned in.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/events" className="btn-primary">
                Browse More Events
              </Link>
              <Link href="/" className="btn-outline">
                Back to Home
              </Link>
            </div>
          </>
        )}

        {state === "failed" && (
          <>
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-3">
              Payment not completed
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              {message ?? "The payment was declined. Nothing has been charged."}
            </p>
            <Link href="/events" className="btn-primary">
              Try Again
            </Link>
          </>
        )}

        {state === "unknown" && (
          <>
            <AlertCircle className="w-14 h-14 text-gray-400 mx-auto mb-6" />
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-3">
              We could not confirm this yet
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              If the money has left your account your tickets will still be emailed to you.
              {txnRef && (
                <>
                  {" "}
                  Quote reference{" "}
                  <b className="text-[var(--primary-blue)] break-all">{txnRef}</b> if you need to
                  call us on {brand.phone}.
                </>
              )}
            </p>
            <Link href="/events" className="btn-outline">
              Back to Events
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[70vh] flex items-center justify-center bg-white">
          <Loader2 className="w-10 h-10 text-[var(--orange-accent)] animate-spin" />
        </section>
      }
    >
      <PaymentCompleteInner />
    </Suspense>
  );
}
