"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { authService } from "@/platform/services/auth.service";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        router.push("/login");
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await authService.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-deep-navy relative overflow-hidden">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-col justify-center px-20 relative bg-linear-to-br from-primary/20 to-transparent border-r border-white/5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(243,156,18,0.1),transparent)]" />
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                >
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/30">
                        <Sparkles className="text-black w-8 h-8" />
                    </div>
                    <h1 className="text-6xl font-bold mb-6 leading-tight tracking-tighter">
                        Join the <br />
                        <span className="text-gradient">Elite Circle</span>
                    </h1>
                    <p className="text-xl text-text-muted max-w-md">
                        Create your account to access the most exclusive events and secure your atomic tickets today.
                    </p>
                </motion.div>
            </div>

            {/* Form Side */}
            <div className="flex flex-col items-center justify-center p-6 md:p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl"
                >
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold mb-2 text-white">Create Account</h2>
                        <p className="text-text-muted">Start your OZONE EVENT experience now.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:outline-hidden focus:border-primary/50 transition-all text-white"
                                    placeholder="lunar_traveler"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:outline-hidden focus:border-primary/50 transition-all text-white"
                                    placeholder="name@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:outline-hidden focus:border-primary/50 transition-all text-white font-mono"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:outline-hidden focus:border-primary/50 transition-all text-white font-mono"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4 text-lg font-bold uppercase tracking-widest"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Registration"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-text-muted text-sm font-medium">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-bold">
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
