"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard, Calendar, Ticket, TrendingUp,
    Users, Plus, Settings, LogOut, Bell,
    ChevronRight, BarChart3, Loader2, Menu, X,
    Sparkles, ArrowUpRight,
} from "lucide-react";
import { companyService } from "@/platform/services/company.service";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";
import CreateEventModal from "@/platform/components/CreateEventModal";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [dataType, setDataType] = useState<"events" | "voting" | "both">("both");
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const fetchDashboardData = async (userData: any) => {
        try {
            // 1. Fetch High-Level Financial Stats (Revenue, Tickets, Votes) from the new consolidated endpoint
            const statsRes = await api.get("/payments/stats/");
            setStats(statsRes.data);

            // 2. Fetch specific list data for the tables based on authorization
            if (userData.role === "COMPANY") {
                const auth = (userData.authorization || "").toUpperCase().trim();
                
                if (auth === "VOTING" || auth === "BOTH") {
                    const res = await api.get("/voting/campaigns/mine/");
                    setCampaigns(res.data.results || res.data);
                }
                
                if (auth === "EVENTS" || auth === "BOTH") {
                    const companyEvents = await companyService.getMyEvents();
                    setEvents(companyEvents.results || companyEvents);
                }
                
                setDataType(auth === "VOTING" ? "voting" : auth === "EVENTS" ? "events" : "both");
            }
        } catch (err) {
            console.error("Dashboard fetch failed", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const userData = authService.getUserFromStorage();
                if (!userData || (userData.role !== "COMPANY" && userData.role !== "ADMIN")) {
                    router.push("/login"); return;
                }

                if (userData.role === "ADMIN") {
                    router.push("/dashboard/admin");
                    return;
                }

                // Fetch company profile to get authorization
                if (userData.role === "COMPANY") {
                    try {
                        const profile = await api.get("/companies/profile/me/");
                        userData.authorization = (profile.data.authorization || "BOTH").toUpperCase().trim();
                    } catch {
                        userData.authorization = "BOTH"; // Default to BOTH to match model default if fetch fails
                    }
                }

                setUser(userData);
                await fetchDashboardData(userData);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    if (isLoading) return null; // Let parent layout handle loading or show minimal

    const eventStatCards = [
        { label: "Total Events", value: stats?.total_events ?? 0, icon: Calendar, bg: "#F39C12", change: "+12%" },
        { label: "Tickets Sold", value: stats?.total_tickets ?? 0, icon: Ticket, bg: "#08283B", change: "+8%" },
    ];

    const votingStatCards = [
        { label: "Total Campaigns", value: stats?.total_campaigns ?? 0, icon: BarChart3, bg: "#F39C12", change: "+15%" },
        { label: "Total Votes", value: stats?.total_votes ?? 0, icon: Users, bg: "#08283B", change: "+24%" },
    ];

    const ticketRevenueCard = { 
        label: "Ticket Revenue", 
        value: `${Number(stats?.ticket_revenue ?? 0).toLocaleString()} RWF`, 
        icon: TrendingUp, 
        bg: "#1e8a5e", 
        change: "Live" 
    };

    const votingRevenueCard = { 
        label: "Voting Revenue", 
        value: `${Number(stats?.voting_revenue ?? 0).toLocaleString()} RWF`, 
        icon: TrendingUp, 
        bg: "#F39C12", 
        change: "Live" 
    };

    const customersCard = { label: "Engagement", value: stats?.activeUsers ?? "85%", icon: Sparkles, bg: "#6c4ef2", change: "+10%" };

    const currentCards = dataType === "voting" 
        ? [...votingStatCards, votingRevenueCard, customersCard]
        : dataType === "events" 
            ? [...eventStatCards, ticketRevenueCard, { ...customersCard, label: "Customers", value: stats?.activeUsers ?? 0 }]
            : [
                eventStatCards[0], eventStatCards[1], 
                votingStatCards[0], votingStatCards[1], 
                ticketRevenueCard, votingRevenueCard
              ];

    return (
        <div className="flex flex-col min-h-screen w-full">

            {/* Top bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">

                {/* Left — title + subtitle */}
                <div className="shrink-0 min-w-[180px]">
                    <h1 className="text-lg font-bold text-gray-800 leading-tight">Dashboard</h1>
                    <p className="text-xs text-gray-400">
                        Hello {user?.first_name || "there"}, welcome back!
                    </p>
                </div>

                {/* Center — search */}
                <div className="flex-1 max-w-md mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search anything"
                            className="w-full pl-5 pr-12 py-2.5 rounded-full text-sm bg-gray-100 border-0 focus:outline-hidden focus:ring-2 text-gray-700 placeholder:text-gray-400"
                            style={{ focusRingColor: "#F39C12" } as any}
                        />
                        <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Right — actions + user */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* User */}
                    <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                            {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{user?.first_name || "User"} {user?.last_name || ""}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase() || "company"}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page body */}
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
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F39C12" }}>Welcome back</p>
                        <h2 className="text-xl font-bold text-white">
                            {user?.first_name ? `Hello, ${user.first_name} 👋` : "Good to have you back 👋"}
                        </h2>
                        <p className="text-white/40 text-sm mt-1">Here's what's happening with your {dataType === 'voting' ? 'campaigns' : 'events'} today.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {(dataType === "events" || dataType === "both") && (
                            <Link href="/events"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/60 border border-white/10 hover:border-white/30 transition-all">
                                View Public Events <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {currentCards.map((card, i) => (
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

                <div className={`grid gap-6 ${dataType === 'both' ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Events Table */}
                    {(dataType === "events" || dataType === "both") && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                                <h3 className="text-sm font-bold text-gray-800">Your Active Events</h3>
                                <button className="text-xs font-bold" style={{ color: "#F39C12" }}>View All →</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Event Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {events.length === 0 ? (
                                            <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400 text-sm">No events found</td></tr>
                                        ) : (
                                            events.slice(0, 5).map(event => (
                                                <tr key={event.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.status === "ACTIVE" || event.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                            {event.status || "DRAFT"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Campaigns Table */}
                    {(dataType === "voting" || dataType === "both") && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                                <h3 className="text-sm font-bold text-gray-800">Your Active Campaigns</h3>
                                <button className="text-xs font-bold" style={{ color: "#F39C12" }}>View All →</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {campaigns.length === 0 ? (
                                            <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400 text-sm">No campaigns found</td></tr>
                                        ) : (
                                            campaigns.slice(0, 5).map(campaign => (
                                                <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/voting/${campaign.id}`)}>
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-800 text-sm">{campaign.title}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${campaign.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                            {campaign.status || "DRAFT"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => user && fetchDashboardData(user)}
            />
        </div>
    );
}
