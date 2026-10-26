"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";

const inputClass =
    "w-full px-3.5 py-3 rounded-[10px] border border-[#D1D5DB] bg-white text-[15px] text-[#111827] focus:outline-hidden focus:border-[#F39C12] focus:ring-2 focus:ring-[#F39C12]/30";

/** Sign in — one page for organisers, Ozone admins, the developer and door staff. */
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
            } else if (user?.role === "DEVELOPER") {
                router.push("/dashboard/dev");
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
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(detail || "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-wrap bg-white font-body text-[#111827]">
            <section className="flex-[1_1_420px] bg-[#08283B] text-white p-8 sm:p-14 box-border flex flex-col justify-between gap-10 min-h-[320px]">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F39C12] text-[#08283B] flex items-center justify-center font-heading font-bold text-xl">O</div>
                    <span className="font-heading font-bold text-xl">Ozone Events</span>
                </div>
                <div className="flex flex-col gap-4 max-w-[460px]">
                    <h1 className="m-0 font-heading text-4xl sm:text-[44px] leading-[1.1] font-bold">
                        Run your awards and events in one place.
                    </h1>
                    <p className="m-0 text-base leading-relaxed text-[#C9D4DC]">
                        Voting by MoMo and USSD, tickets with QR codes, and your money in real time.
                    </p>
                </div>
                <span className="text-[13px] text-[#C9D4DC]">
                    Powered by <b className="text-white">Vexta Ltd</b> · Help: 0790 755 673
                </span>
            </section>

            <section className="flex-[1_1_420px] px-6 py-14 box-border flex items-center justify-center">
                <form onSubmit={handleLogin} className="w-full max-w-[400px] flex flex-col gap-[18px]">
                    <div>
                        <h2 className="m-0 font-heading text-[28px] font-bold text-[#08283B]">Sign in</h2>
                        <p className="mt-1.5 mb-0 text-sm text-[#5B6472]">You will land on your own dashboard.</p>
                    </div>
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[#374151]">
                        Email
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="name@company.rw"
                            className={inputClass}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[#374151]">
                        Password
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            className={inputClass}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                    <div className="flex flex-wrap justify-end items-center gap-3 text-sm">
                        <a href="tel:0790755673" className="font-semibold text-[#08283B] hover:text-[#B86E00]">
                            Forgot password? Call us
                        </a>
                    </div>

                    {error && (
                        <p role="alert" className="m-0 rounded-xl bg-[#FFF4F2] border border-[#F3C4BF] px-4 py-3 text-sm text-[#912018]">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 p-3.5 rounded-[10px] bg-[#F39C12] hover:bg-[#E08E0B] text-[#111827] text-[15px] font-semibold disabled:opacity-60"
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Sign in
                    </button>

                    <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#F4F5F7] text-[13px] text-[#4B5563]">
                        <span className="font-semibold text-[#374151]">Where you land</span>
                        <span>Clients → their event dashboard</span>
                        <span>Ozone Events → admin</span>
                        <span>Developer → earnings and system</span>
                        <span>Door staff → the ticket scanner</span>
                    </div>

                    <p className="m-0 text-center text-sm text-[#5B6472]">
                        No account yet?{" "}
                        <Link href="/company/register" className="font-semibold text-[#B86E00] hover:underline">
                            Register your organisation
                        </Link>
                    </p>
                </form>
            </section>
        </div>
    );
}
