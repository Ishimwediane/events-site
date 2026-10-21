"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/platform/lib/api";
import { X, Smartphone, CreditCard, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

const COUNTRY_CODES = [
    { code: "+250", flag: "🇷🇼", name: "Rwanda" },
    { code: "+256", flag: "🇺🇬", name: "Uganda" },
    { code: "+255", flag: "🇹🇿", name: "Tanzania" },
    { code: "+254", flag: "🇰🇪", name: "Kenya" },
];

const MIN_AMOUNT = 100;

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    serviceType: "TICKET" | "VOTE";
    targetId: string;
    metadata?: any;
    onSuccess?: () => void;
    initialEmail?: string;
}

export default function PaymentModal({
    isOpen,
    onClose,
    amount,
    serviceType,
    targetId,
    metadata = {},
    onSuccess,
    initialEmail = "",
}: PaymentModalProps) {
    const [method, setMethod] = useState<"MOMO" | "CARD">("MOMO");
    const [countryCode, setCountryCode] = useState("+250");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "WARNING" | "ERROR">("IDLE");
    const [errorMsg, setErrorMsg] = useState("");
    const [lmbMessage, setLmbMessage] = useState("");
    const [txnRef, setTxnRef] = useState<string | null>(null);

    // FIX: Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setEmail(initialEmail || "");
        } else {
            document.body.style.overflow = 'unset';
            // Reset state
            setStatus("IDLE");
            setTxnRef(null);
            setErrorMsg("");
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialEmail]);

    // ── Status Polling ──
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (txnRef && (status === "PROCESSING" || status === "IDLE" || status === "WARNING")) {
            interval = setInterval(async () => {
                try {
                    const response = await api.get(`/payments/status/${txnRef}/`);
                    if (method === "CARD" && response.data.redirect_url) {
                        sessionStorage.setItem("lmb_pending_ref", txnRef);
                        window.location.href = response.data.redirect_url;
                        clearInterval(interval);
                    } else if (response.data.status === "SUCCESS") {
                        setStatus("SUCCESS");
                        if (onSuccess) onSuccess();
                        clearInterval(interval);
                    } else if (response.data.status === "FAILED") {
                        setStatus("ERROR");
                        setErrorMsg("Payment failed on your device.");
                        clearInterval(interval);
                    }
                } catch (err) { console.error("Polling failed:", err); }
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [txnRef, status, onSuccess, method]);

    if (!isOpen) return null;

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("PROCESSING");
        setErrorMsg("");

        try {
            if (amount < MIN_AMOUNT) {
                setStatus("ERROR");
                setErrorMsg(`Minimum payment is ${MIN_AMOUNT.toLocaleString()} RWF.`);
                return;
            }

            // Build the card redirect URL to handle the post-payment return
            const cardRedirectUrl = typeof window !== "undefined"
                ? `${window.location.origin}/payment-complete`
                : "https://ozone-event.com/payment-complete";

            const payload = {
                amount: Number(amount),
                payment_method: method,
                service_type: serviceType,
                target_id: targetId,
                phone_number: method === "MOMO" ? `${countryCode}${phoneNumber.replace(/^0+/, "")}` : undefined,
                email: email || metadata.email,
                metadata: {
                    ...metadata,
                    full_name: metadata.full_name || "Ozone Customer",
                    card_redirect_url: cardRedirectUrl,
                },
            };

            const response = await api.post("/payments/initiate/", payload);
            if (response.data.txn_ref) setTxnRef(response.data.txn_ref);

            if (response.data.gateway_status === "QUEUED") {
                setLmbMessage("Payment request sent. Waiting for provider confirmation.");
                setStatus("PROCESSING");
            } else if (method === "MOMO" && response.data.lmb_status === "fail") {
                setLmbMessage(response.data.lmb_message || "USSD prompt failed.");
                setStatus("WARNING");
            } else if (method === "CARD" && response.data.redirect_url) {
                // Redirect the user to the Pesapal payment page
                // Store the txn_ref so the /payment-complete page can poll status
                if (response.data.txn_ref) {
                    sessionStorage.setItem("lmb_pending_ref", response.data.txn_ref);
                }
                window.location.href = response.data.redirect_url;
            }
        } catch (err: any) {
            setStatus("ERROR");
            const serverError = err.response?.data;
            if (serverError?.txn_ref) setTxnRef(serverError.txn_ref);
            setErrorMsg(serverError?.details || serverError?.error || "Payment failed.");
        }
    };

    const renderContent = () => {
        if (status === "SUCCESS") {
            return (
                <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                        <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Verified!</h4>
                    <p className="text-gray-400 text-sm leading-relaxed px-4 mb-8"> Funds received and transaction recorded.</p>
                    <button onClick={onClose} className="w-full bg-green-600 py-4 font-bold uppercase text-xs tracking-widest">Done - Close</button>
                </div>
            );
        }

        if (status === "WARNING") {
            return (
                <div className="py-8 text-center animate-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                        <AlertCircle size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2 uppercase">Prompt Failed</h4>
                    <p className="text-gray-400 text-sm mb-4 px-4 leading-relaxed">{lmbMessage || "Please check your phone for the PIN prompt."}</p>
                    <button onClick={onClose} className="w-full bg-amber-500 py-4 font-bold uppercase text-xs">Try Again</button>
                </div>
            );
        }

        return (
            <form onSubmit={handlePayment} className="space-y-6">
                <div className="bg-white/5 p-4 flex items-center justify-between border border-white/5">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-[#F39C12]">{Number(amount).toLocaleString()} RWF</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Service Type</p>
                        <p className="text-white font-bold text-sm uppercase">{serviceType}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 border border-white/5">
                    <button type="button" onClick={() => setMethod("MOMO")} className={`flex items-center justify-center gap-2 py-3 ${method === "MOMO" ? "bg-[#F39C12] text-white" : "text-gray-400"}`}>
                        <Smartphone size={16} /><span className="font-bold uppercase text-xs">MoMo</span>
                    </button>
                    <button type="button" onClick={() => setMethod("CARD")} className={`flex items-center justify-center gap-2 py-3 ${method === "CARD" ? "bg-[#F39C12] text-white" : "text-gray-400"}`}>
                        <CreditCard size={16} /><span className="font-bold uppercase text-xs">Card</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Email required for TICKET purchases OR Card payments */}
                    {((serviceType === "TICKET" && !initialEmail) || method === "CARD") && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Email Address {method === "CARD" && <span className="text-[#F39C12]">*</span>}
                            </label>
                            <input
                                required
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:border-[#F39C12] outline-hidden"
                            />
                            {method === "CARD" && (
                                <p className="text-[10px] text-gray-500">Your email is required to process card payments.</p>
                            )}
                        </div>
                    )}
                    {method === "MOMO" && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">MoMo Number</label>
                            <div className="flex gap-2">
                                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-white/5 border border-white/10 px-2 py-3 text-white text-sm outline-hidden">
                                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.code}</option>)}
                                </select>
                                <input required type="tel" placeholder="780000000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-hidden focus:border-[#F39C12]" />
                            </div>
                        </div>
                    )}
                </div>

                {status === "ERROR" && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex gap-2"><AlertCircle size={14} />{errorMsg}</div>}

                {/* MoMo waiting guidance — the USSD prompt is delivered by the mobile network,
                    so it may not appear if the phone is locked/off. Tell users how to approve. */}
                {status === "PROCESSING" && method === "MOMO" && (
                    <div className="p-3 bg-[#F39C12]/10 border border-[#F39C12]/30 text-[#D68910] text-xs flex gap-2 leading-relaxed">
                        <Smartphone size={16} className="shrink-0 mt-0.5" />
                        <span>
                            <b className="text-white">Check your phone</b> for the MoMo prompt and enter your PIN to approve.
                            <br />
                            If your screen was off or you didn’t see it, unlock your phone, or dial{" "}
                            <b className="text-white tracking-wider">*182*7*1#</b> on your MoMo number to approve the pending payment.
                        </span>
                    </div>
                )}

                {method === "MOMO" && status !== "PROCESSING" && (
                    <p className="text-[10px] text-gray-500 leading-relaxed -mt-2">
                        You’ll get a prompt on your phone to enter your MoMo PIN. If it doesn’t appear, dial <span className="text-gray-300">*182*7*1#</span> to approve.
                    </p>
                )}

                <button type="submit" disabled={status === "PROCESSING"} className="w-full py-4 bg-[#F39C12] hover:bg-[#B6750E] text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                    {status === "PROCESSING" ? <Loader2 className="animate-spin mx-auto"/> : `Pay ${Number(amount).toLocaleString()} RWF`}
                </button>
            </form>
        );
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
            <div className="bg-[#08283B] border border-white/10 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Complete Payment</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
                </div>
                <div className="p-5 overflow-y-auto no-scrollbar">{renderContent()}</div>
            </div>
        </div>
    );
}
