"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
    Building2, Mail, Phone, FileText, Lock, Loader2,
    ArrowRight, CheckCircle2, Ticket, Vote, Layers, Eye, EyeOff
} from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import { companyService } from "@/platform/services/company.service";

const inputClass =
    "w-full px-4 py-3.5 pl-11 rounded-xl border-2 border-gray-100 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-hidden focus:border-amber-300 transition-all bg-white";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2";

const AUTH_OPTIONS = [
    {
        value: "EVENTS",
        label: "Events & Tickets",
        desc: "Host events and sell tickets",
        icon: Ticket,
        color: "#F39C12",
    },
    {
        value: "VOTING",
        label: "Voting Only",
        desc: "Run voting campaigns",
        icon: Vote,
        color: "#6c4ef2",
    },
    {
        value: "BOTH",
        label: "Both",
        desc: "Events and voting",
        icon: Layers,
        color: "#1e8a5e",
    },
];

export default function CompanyRegisterPage() {
    const [formData, setFormData] = useState({
        company_name: "",
        email: "",
        phone: "",
        description: "",
        authorization: "BOTH",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            // Step 1: Create the user account
            await authService.registerCompany({
                first_name: formData.company_name,
                last_name: "",
                email: formData.email,
                password: formData.password,
            });

            // Step 2: Submit the company application (auto-logged in by registerCompany)
            await companyService.applyToBeHost({
                company_name: formData.company_name,
                phone: formData.phone,
                email: formData.email,
                description: formData.description,
                authorization: formData.authorization,
            });

            setSubmitted(true);
        } catch (err: any) {
            const data = err.response?.data;
            if (!data) { setError("Cannot connect to server. Make sure the backend is running."); return; }
            const messages: string[] = [];
            if (typeof data === "string") {
                messages.push(data);
            } else {
                Object.entries(data).forEach(([field, errors]: [string, any]) => {
                    const label = field === "non_field_errors" ? "" : `${field}: `;
                    if (Array.isArray(errors)) errors.forEach((m: string) => messages.push(`${label}${m}`));
                    else messages.push(`${label}${errors}`);
                });
            }
            setError(messages.join(" · ") || "Registration failed. Please verify your details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white grid lg:grid-cols-2">

            {/* ── LEFT: Visual panel ── */}
            <div className="hidden lg:block relative overflow-hidden" style={{ background: "#08283B" }}>
                <Image
                    src="/image/micro.jpeg"
                    alt="Event hosting"
                    fill
                    className="object-cover object-center opacity-20"
                />
                <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, rgba(8,40,59,0.97) 0%, rgba(8,40,59,0.65) 100%)" }}
                />
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-white/5" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full border border-white/5" />
                <div
                    className="absolute bottom-0 left-0 w-72 h-72 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(243,156,18,0.1) 0%, transparent 70%)" }}
                />

                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55 }}
                    className="relative z-10 flex flex-col justify-center h-full px-14 py-20"
                >
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 w-fit"
                        style={{ background: "rgba(243,156,18,0.15)", color: "#F39C12" }}
                    >
                         Company Portal
                    </div>

                    <h1 className="font-bold text-white leading-tight mb-6" style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}>
                        Apply to Host{" "}
                        <span style={{ color: "#F39C12" }}>Events</span>
                    </h1>

                    <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm">
                        One application. Choose your package — events, voting, or both. Our team reviews and activates your account within 24 hours.
                    </p>

                    <ul className="space-y-4 mb-12">
                        {[
                            "Organizer dashboard on approval",
                            "Events, tickets & voting campaigns",
                            "Real-time sales analytics",
                            "Dedicated support team",
                        ].map((feat) => (
                            <li key={feat} className="flex items-center gap-3 text-sm text-white/70 font-medium">
                                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#F39C12" }} />
                                {feat}
                            </li>
                        ))}
                    </ul>

                    {/* Package preview */}
                    <div className="space-y-3 pt-8 border-t border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Available Plans</p>
                        {AUTH_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => (
                            <div key={value} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white/80">{label}</p>
                                    <p className="text-[10px] text-white/30">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── RIGHT: Form ── */}
            <div className="flex items-start justify-center px-6 py-12 bg-white overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="w-full max-w-md"
                >
                    <AnimatePresence mode="wait">
                        {submitted ? (
                            /* ── Success state ── */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-16"
                            >
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                    style={{ background: "#1e8a5e18" }}
                                >
                                    <CheckCircle2 className="w-10 h-10" style={{ color: "#1e8a5e" }} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
                                <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
                                    Your application is being reviewed. You'll be notified once an admin approves your account.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
                                    style={{ background: "#F39C12", color: "#08283B" }}
                                >
                                    Back to Home <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        ) : (
                            /* ── Form ── */
                            <motion.div key="form">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#F39C12" }}>
                                    Company Registration
                                </p>
                                <h2
                                    className="font-bold leading-tight mb-2"
                                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1a1a1a" }}
                                >
                                    Register Your{" "}
                                    <span className="inline-block px-1 rounded-sm" style={{ background: "#F39C12", color: "#08283B" }}>
                                        Company
                                    </span>
                                </h2>
                                <p className="text-gray-400 text-sm mb-8">
                                    Fill in your details — an admin will review and activate your account.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {/* Company / Host Name */}
                                    <div>
                                        <label className={labelClass}>Company / Host Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Gala Events Ghana"
                                                className={inputClass}
                                                value={formData.company_name}
                                                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Email + Phone */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="info@company.com"
                                                    className={inputClass}
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input
                                                    required
                                                    type="tel"
                                                    placeholder="+233 00 000 0000"
                                                    className={inputClass}
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                                            <textarea
                                                required
                                                rows={3}
                                                placeholder="Tell us what you plan to do — events you'll host, voting campaigns, etc."
                                                className={inputClass.replace("pl-11", "pl-11 pt-3") + " resize-none"}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Authorization type */}
                                    <div>
                                        <label className={labelClass}>What do you want to manage?</label>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {AUTH_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => {
                                                const selected = formData.authorization === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, authorization: value })}
                                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all"
                                                        style={{
                                                            borderColor: selected ? color : "#e5e7eb",
                                                            background: selected ? `${color}10` : "#f9fafb",
                                                        }}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                            style={{ background: selected ? color : "#e5e7eb" }}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" style={{ color: selected ? "#fff" : "#9ca3af" }} />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-800 leading-tight">{label}</p>
                                                        <p className="text-[9px] text-gray-400 leading-tight">{desc}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className={labelClass}>Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                required
                                                minLength={8}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className={inputClass + " font-mono pr-11"}
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-300 mt-1.5 ml-1">Min 8 chars</p>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className={labelClass}>Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                required
                                                type={showConfirm ? "text" : "password"}
                                                placeholder="••••••••"
                                                className={inputClass + " font-mono pr-11"}
                                                value={formData.confirmPassword}
                                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowConfirm(v => !v)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                            >
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-500 p-4 rounded-xl text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                                        style={{ background: "#F39C12", color: "#08283B" }}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>Submit Application <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 space-y-2 text-center">
                                    <p className="text-sm text-gray-400">
                                        Already have an account?{" "}
                                        <Link href="/login" className="font-bold hover:underline" style={{ color: "#F39C12" }}>
                                            Sign In
                                        </Link>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
