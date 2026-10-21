"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Users, Building, CalendarDays,
    ShieldCheck, Bell
} from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import { adminService } from "@/platform/services/admin.service";
import { api } from "@/platform/lib/api";
import { TrendingUp } from "lucide-react";

export default function AdminOverviewPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [payStats, setPayStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
            setUser(userData);

            try {
                const [systemStats, paymentStats] = await Promise.all([
                    adminService.getSystemStats(),
                    api.get("/payments/stats/")
                ]);
                setStats(systemStats);
                setPayStats(paymentStats.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
            setIsLoading(false);
        };
        init();
    }, [router]);

    if (isLoading) return null;

    const statCards = [
        { label: "Total Revenue", value: `${Number(payStats?.total_revenue ?? 0).toLocaleString()} RWF`, icon: TrendingUp, bg: "#1e8a5e", change: "Live" },
        { label: "Organizers", value: stats?.total_companies ?? 0, icon: Building, bg: "#F39C12", change: "+15%" },
        { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, bg: "#08283B", change: "+5%" },
        { label: "Active Events", value: stats?.total_events ?? 0, icon: CalendarDays, bg: "#6c4ef2", change: "+12%" },
    ];

    return (
        <>
            {/* Top bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">
                <div className="flex items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">System Overview</h1>
                        <p className="text-xs text-gray-400">
                            Hello {user?.first_name || "Admin"}, platform command center
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" /> Admin
                    </span>
                    <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0 underline-offset-4" style={{ background: "#F39C12" }}>
                            {user?.first_name?.[0] ?? "A"}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 px-6 lg:px-10 py-8">
                {/* Welcome strip */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl px-8 py-6 mb-8 flex items-center justify-between overflow-hidden relative"
                    style={{ background: "#08283B" }}
                >
                    <div
                        className="absolute right-0 top-0 w-64 h-full pointer-events-none"
                        style={{ background: "radial-gradient(circle at right, rgba(243,156,18,0.12) 0%, transparent 70%)" }}
                    />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F39C12" }}>System Administration</p>
                        <h2 className="text-xl font-bold text-white">
                            {user?.first_name ? `Hello, ${user.first_name} 👋` : "Command Center 👋"}
                        </h2>
                        <p className="text-white/40 text-sm mt-1">Monitor platform growth.</p>
                    </div>
                </motion.div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg + "18" }}>
                                    <card.icon className="w-5 h-5" style={{ color: card.bg }} />
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#1e8a5e18", color: "#1e8a5e" }}>
                                    {card.change}
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </>
    );
}
