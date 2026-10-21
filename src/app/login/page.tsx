"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";

// Pale-blue filled fields, as on the public site's contact form.
const inputClass =
    "w-full pl-11 pr-4 py-3 rounded-lg border-0 bg-[#E8F4F8] text-sm text-[#08283B] placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#08283B] transition-all";

const labelClass =
    "block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await authService.login({ email, password });
            const user = authService.getUserFromStorage();
            if (user?.role === "ADMIN") {
                router.push("/dashboard/admin");
            } else if (user?.role === "COMPANY") {
                router.push("/dashboard");
            } else if (user?.role === "GATE_STAFF") {
                // Door staff only ever need the scanner — skip the dashboard entirely.
                router.push("/scan");
            } else {
                // CUSTOMER role — check if they have a pending application
                try {
                    const res = await api.get("/companies/applications/");
                    const applications = res.data.results || res.data;
                    if (Array.isArray(applications) && applications.length > 0) {
                        // Has an application — send to pending page
                        router.push("/pending");
                    } else {
                        router.push("/");
                    }
                } catch {
                    router.push("/");
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white grid lg:grid-cols-2">

            {/* ── LEFT: Dark visual panel ── */}
            <div className="hidden lg:block relative overflow-hidden bg-[#08283B]">
                <Image
                    src="/image/micro.jpeg"
                    alt=""
                    fill
                    className="object-cover object-center opacity-40"
                />
                <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, rgba(8,40,59,0.92) 0%, rgba(8,40,59,0.55) 100%)" }}
                />

                {/* Soft rings, as on the public site's decorative sections */}
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-white/5" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full border border-white/5" />
                <div
                    className="absolute bottom-0 left-0 w-72 h-72 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(243,156,18,0.12) 0%, transparent 70%)" }}
                />

                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55 }}
                    className="relative z-10 flex flex-col justify-center h-full px-14 py-20"
                >
                    {/* rule — label — rule, the public site's eyebrow */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-px bg-[#F39C12]" />
                        <span className="text-[9px] font-semibold tracking-[0.4em] uppercase text-[#F39C12]">
                            Organiser Access
                        </span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-normal tracking-tight leading-tight text-white/95 uppercase mb-6">
                        Welcome Back
                    </h1>

                    <p className="text-gray-300 text-sm leading-relaxed mb-10 max-w-sm">
                        Sign in to manage your events, ticket sales and voting campaigns.
                    </p>

                    <ul className="space-y-4">
                        {[
                            "Manage your events & ticket sales",
                            "Run and monitor voting campaigns",
                            "Track revenue in real-time",
                            "Full organizer dashboard access",
                        ].map((feat) => (
                            <li key={feat} className="flex items-center gap-3 text-sm text-white/70">
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#F39C12]" />
                                {feat}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* ── RIGHT: Form panel ── */}
            <div className="flex items-center justify-center px-6 py-14 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="w-full max-w-md"
                >
                    {/* Logo — only place the mark appears on this page */}
                    <div className="flex items-center gap-3 mb-10 lg:hidden">
                        <div className="relative w-12 h-12">
                            <Image src="/image/logo.jpg" alt="Ozone Entertainment" fill className="object-contain rounded-lg" />
                        </div>
                        <span className="text-lg font-semibold text-[#08283B]">OZONE EVENT</span>
                    </div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F39C12] mb-3 pb-2 inline-block border-b border-[#F39C12]/30">
                        Account Login
                    </p>

                    <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-[#08283B] mb-3">
                        Sign In
                    </h2>
                    <p className="text-gray-500 text-sm mb-8">
                        Enter your credentials to reach your dashboard.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email" required
                                    placeholder="name@example.com"
                                    className={inputClass}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password" required
                                    placeholder="••••••••"
                                    className={inputClass}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-lg bg-[#F39C12] hover:bg-[#D68910] text-white font-semibold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            No account yet?{" "}
                            <Link href="/company/register" className="font-semibold text-[#F39C12] hover:text-[#D68910] hover:underline transition-colors">
                                Register as Company
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
