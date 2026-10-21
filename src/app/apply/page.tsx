"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, Mail, Phone, FileText, Loader2, CheckCircle2, Lock, Ticket, Vote, Layers } from "lucide-react";
import { companyService } from "@/platform/services/company.service";
import { authService } from "@/platform/services/auth.service";

export default function ApplyPage() {
    const [formData, setFormData] = useState({
        company_name: "",
        email: "",
        phone: "",
        description: "",
        authorization: "BOTH",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const user = authService.getUserFromStorage();
        if (!user) {
            setIsAuthenticated(false);
        } else {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus("idle");
        setErrorMessage("");

        try {
            await companyService.applyToBeHost(formData);
            setStatus("success");
            setTimeout(() => router.push("/"), 3000);
        } catch (err: any) {
            setStatus("error");
            // Extract error from multiple possible backend response shapes
            const data = err.response?.data;
            if (typeof data === "string") {
                setErrorMessage(data);
            } else if (data?.error) {
                setErrorMessage(data.error);
            } else if (data?.non_field_errors) {
                setErrorMessage(data.non_field_errors[0]);
            } else if (data?.detail) {
                setErrorMessage(data.detail);
            } else {
                setErrorMessage("Failed to submit application. Please check your details and try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while auth state is being determined
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-deep-navy">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Show auth gate for unauthenticated users
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen py-20 px-6 bg-deep-navy flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-12 rounded-3xl border border-white/10 text-center max-w-md mx-auto"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Sign In Required</h2>
                    <p className="text-text-muted mb-8">You must have an account to apply as a host. Join us first — it's free!</p>
                    <div className="flex flex-col gap-4">
                        <Link href="/login" className="btn-primary w-full">Sign In</Link>
                        <Link href="/register" className="glass px-6 py-3 rounded-xl font-semibold hover:border-primary/50 transition-all text-center">
                            Create an Account
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 px-6 bg-deep-navy relative overflow-hidden">
            <div className="max-w-3xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Become a <span className="text-primary">Host</span></h1>
                    <p className="text-text-muted text-lg">Apply to organize elite events on the OZONE platform.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl"
                >
                    {status === "success" ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
                            <p className="text-text-muted mb-8">Role will be updated once admin approves your request. Redirecting you home...</p>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3 }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Company Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl focus:outline-hidden focus:border-primary/50 transition-all text-white"
                                            placeholder="Gala Events Inc."
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Official Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl focus:outline-hidden focus:border-primary/50 transition-all text-white"
                                            placeholder="contact@company.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl focus:outline-hidden focus:border-primary/50 transition-all text-white"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Company Description</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl focus:outline-hidden focus:border-primary/50 transition-all text-white resize-none"
                                        placeholder="Tell us about your event hosting experience..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Authorization type */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">
                                    What do you want to manage?
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { value: "EVENTS", label: "Events & Tickets", desc: "Host events and sell tickets", icon: Ticket, color: "#F39C12" },
                                        { value: "VOTING", label: "Voting Only", desc: "Run voting campaigns", icon: Vote, color: "#6c4ef2" },
                                        { value: "BOTH", label: "Both", desc: "Events and voting", icon: Layers, color: "#1e8a5e" },
                                    ].map(({ value, label, desc, icon: Icon, color }) => {
                                        const selected = formData.authorization === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, authorization: value })}
                                                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all"
                                                style={{
                                                    borderColor: selected ? color : "rgba(255,255,255,0.1)",
                                                    background: selected ? `${color}18` : "rgba(255,255,255,0.03)",
                                                }}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                                                    style={{ background: selected ? color : "rgba(255,255,255,0.08)" }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color: selected ? "#fff" : "#6b7280" }} />
                                                </div>
                                                <p className="text-sm font-bold text-white">{label}</p>
                                                <p className="text-[10px] text-white/40">{desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {status === "error" && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
                                    {errorMessage}
                                </div>
                            )}


                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-4 text-lg font-bold uppercase tracking-widest"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Application"}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
