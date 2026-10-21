"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/platform/lib/api";
import { CheckCircle2, XCircle, Loader2, Home, TicketCheck } from "lucide-react";

type PollStatus = "LOADING" | "SUCCESS" | "FAILED" | "TIMEOUT";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

export default function PaymentReturnPage() {
    const router = useRouter();
    const [pollStatus, setPollStatus] = useState<PollStatus>("LOADING");
    const [serviceType, setServiceType] = useState<string | null>(null);
    const [txnRef, setTxnRef] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    const checkStatus = useCallback(async (ref: string, count: number) => {
        if (count >= MAX_POLLS) {
            setPollStatus("TIMEOUT");
            return;
        }
        try {
            const res = await api.get(`/payments/status/${ref}/`);
            const s = res.data.status;
            if (s === "SUCCESS") {
                sessionStorage.removeItem("card_txn_ref");
                sessionStorage.removeItem("card_service_type");
                setPollStatus("SUCCESS");
            } else if (s === "FAILED") {
                setPollStatus("FAILED");
            } else {
                // Still PENDING — schedule next poll
                setPollCount(count + 1);
            }
        } catch {
            setPollCount(count + 1); // retry on network error
        }
    }, []);

    // Read from sessionStorage on mount
    useEffect(() => {
        const ref = sessionStorage.getItem("card_txn_ref");
        const svc = sessionStorage.getItem("card_service_type");
        if (ref) {
            setTxnRef(ref);
            setServiceType(svc);
        } else {
            // No ref — likely direct navigation, redirect home
            router.replace("/");
        }
    }, [router]);

    // Polling loop — fires whenever pollCount changes and we're still loading
    useEffect(() => {
        if (!txnRef || pollStatus !== "LOADING") return;
        const timer = setTimeout(() => checkStatus(txnRef, pollCount), POLL_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [txnRef, pollCount, pollStatus, checkStatus]);

    // ── UI States ─────────────────────────────────────────────────────────
    if (pollStatus === "SUCCESS") {
        return (
            <div className="min-h-screen bg-[#04161f] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-green-400" size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-tight mb-2">
                            Payment Confirmed!
                        </h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {serviceType === "TICKET"
                                ? "Your ticket has been issued. Check your email for the ticket confirmation."
                                : "Your votes have been recorded. Thank you for your support!"}
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <Home size={14} /> Home
                        </button>
                        {serviceType === "TICKET" && (
                            <button
                                onClick={() => router.push("/events")}
                                className="flex items-center gap-2 px-6 py-3 bg-[#F39C12] hover:bg-[#B6750E] text-white transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <TicketCheck size={14} /> View Events
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-600">Ref: {txnRef}</p>
                </div>
            </div>
        );
    }

    if (pollStatus === "FAILED") {
        return (
            <div className="min-h-screen bg-[#04161f] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="text-red-400" size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-tight mb-2">
                            Payment Failed
                        </h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your card payment could not be completed. No charge has been made.
                            Please try again or use Mobile Money.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <Home size={14} /> Home
                        </button>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem("card_txn_ref");
                                sessionStorage.removeItem("card_service_type");
                                router.back();
                            }}
                            className="px-6 py-3 bg-[#F39C12] hover:bg-[#B6750E] text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            Try Again
                        </button>
                    </div>
                    <p className="text-xs text-gray-600">Ref: {txnRef}</p>
                </div>
            </div>
        );
    }

    if (pollStatus === "TIMEOUT") {
        return (
            <div className="min-h-screen bg-[#04161f] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="text-amber-400" size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-tight mb-2">
                            Still Processing
                        </h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            We haven&apos;t received payment confirmation yet. If your card was charged,
                            your order will be fulfilled once the bank confirms. Check your email shortly.
                        </p>
                        <p className="text-xs text-gray-600 mt-3">Ref: <span className="font-mono">{txnRef}</span></p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mx-auto"
                    >
                        <Home size={14} /> Go Home
                    </button>
                </div>
            </div>
        );
    }

    // LOADING state
    return (
        <div className="min-h-screen bg-[#04161f] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-[#F39C12]/10 border border-[#F39C12]/20 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="text-[#F39C12] animate-spin" size={40} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">
                        Verifying Payment
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Please wait while we confirm your transaction with the bank…
                    </p>
                </div>
                <div className="flex justify-center gap-1.5 pt-2">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-[#F39C12]/60 animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-700 font-mono">{txnRef}</p>
            </div>
        </div>
    );
}
