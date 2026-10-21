"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Loader2, Search, Bell, Menu,
    Ticket, TrendingUp, Calendar, MapPin, QrCode, X, CheckCircle2, AlertCircle, Printer
} from "lucide-react";
import { ticketService } from "@/platform/services/ticket.service";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";
import DashboardSidebar from "@/platform/components/DashboardSidebar";

export default function GlobalTicketsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Hard-ticket (printable QR) generation modal
    const [hardTier, setHardTier] = useState<any | null>(null);
    const [hardQty, setHardQty] = useState<number>(50);
    const [hardStatus, setHardStatus] = useState<"IDLE" | "LOADING" | "DONE" | "ERROR">("IDLE");
    const [hardError, setHardError] = useState("");
    const [hardCount, setHardCount] = useState(0);

    const openHardModal = (tier: any) => {
        setHardTier(tier);
        setHardQty(Math.min(50, tier.remaining || 1));
        setHardStatus("IDLE");
        setHardError("");
        setHardCount(0);
    };

    const handleGenerateHard = async () => {
        if (!hardTier) return;
        setHardStatus("LOADING");
        setHardError("");
        try {
            const res = await ticketService.generateHardTickets(hardTier.id, hardQty);
            await ticketService.downloadHardSheet(res.ticket_ids);
            setHardCount(res.count);
            setHardStatus("DONE");
            // Refresh so the tier's remaining count reflects the tickets just issued.
            const data = await ticketService.getMyTickets();
            setTickets(Array.isArray(data) ? data : data.results || []);
        } catch (e: any) {
            setHardStatus("ERROR");
            setHardError(e.response?.data?.error || "Failed to generate hard tickets.");
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || userData.role !== "COMPANY") { router.push("/login"); return; }

            try {
                const profile = await api.get("/companies/profile/me/");
                if (profile.data.authorization === "VOTING") {
                    router.push("/dashboard");
                    return;
                }
            } catch (e) {
                console.error("Failed to verify authorization");
            }

            setUser(userData);

            try {
                const data = await ticketService.getMyTickets();
                // The API might return paginated results or a direct array
                setTickets(Array.isArray(data) ? data : data.results || []);
            } catch (error) {
                console.error("Failed to load global tickets:", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    const filtered = tickets.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.event_title?.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate Global Stats. Money counts ONLY paying (online) buyers; hard
    // tickets are physical and tracked separately.
    const totalTicketsCreated = tickets.reduce((acc, t) => acc + (t.quantity || 0), 0);
    const totalTicketsSold = tickets.reduce((acc, t) => acc + (t.paid_count || 0), 0);
    const totalHardTickets = tickets.reduce((acc, t) => acc + (t.hard_count || 0), 0);
    // Money = online (paid) tickets only. Printed hard tickets are unsold physical
    // stock, so they are NOT revenue — just an inventory count.
    const globalRevenue = tickets.reduce((acc, t) => acc + ((t.paid_count || 0) * Number(t.price || 0)), 0);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Tickets…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full font-sans text-gray-800">
            {/* Top bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">
                <div className="flex items-center gap-4 shrink-0 min-w-[160px]">
                    <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Global Tickets</h1>
                        <p className="text-xs text-gray-400">Overview of all your ticket tiers</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md mx-auto hidden md:block">
                    <div className="relative">
                        <input type="text" placeholder="Search by ticket or event name..."
                            className="w-full pl-5 pr-12 py-2.5 rounded-full text-sm bg-gray-100 border-0 focus:outline-hidden text-gray-700 placeholder:text-gray-400"
                            value={search} onChange={e => setSearch(e.target.value)} />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                    <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                            {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{user?.first_name || "User"} {user?.last_name || ""}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">

                {/* Global Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Online Revenue</h3>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{globalRevenue.toLocaleString()} RWF</p>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Online sales only</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Paid Tickets Sold</h3>
                            <Ticket className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-gray-900">{totalTicketsSold}</p>
                            <p className="text-sm font-bold text-gray-400">/ {totalTicketsCreated}</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Online purchases only</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Hard Tickets Printed</h3>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalHardTickets}</p>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Physical stock — not yet sold</p>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">All Ticket Tiers</h2>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Event & Tier</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Price</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Sales Progress</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Location</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs text-right">Hard Tickets</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((ticket: any, idx: number) => {
                                    const sold = ticket.quantity - ticket.remaining;
                                    const percent = ticket.quantity > 0 ? (sold / ticket.quantity) * 100 : 0;

                                    return (
                                        <motion.tr
                                            key={ticket.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/dashboard/events/${ticket.event}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                                                    {ticket.name}
                                                </div>
                                                <div className="text-xs font-semibold text-gray-400 mt-0.5 max-w-[200px] truncate">
                                                    {ticket.event_title || "Unknown Event"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-green-600">
                                                {Number(ticket.price) === 0 ? "Free" : `${Number(ticket.price).toLocaleString()} RWF`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-gray-700 min-w-[40px] text-right">
                                                        {sold} <span className="text-gray-400 text-xs">/ {ticket.quantity}</span>
                                                    </span>
                                                    <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                                                        <div className="h-full bg-amber-500 rounded-full relative" style={{ width: `${percent}%` }}>
                                                            <div className="absolute inset-0 bg-white/20 w-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {ticket.remaining > 0 ? (
                                                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md uppercase tracking-wide border border-green-100">On Sale</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md uppercase tracking-wide border border-red-100">Sold Out</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 max-w-[150px] truncate">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    {ticket.event_location || "TBA"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openHardModal(ticket); }}
                                                    disabled={ticket.remaining <= 0}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    title={ticket.remaining <= 0 ? "No tickets remaining in this tier" : "Generate printable QR codes"}
                                                >
                                                    <QrCode className="w-3.5 h-3.5" /> Print QR
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Ticket className="w-10 h-10 text-gray-300 mb-3" />
                                                <h3 className="text-sm font-bold text-gray-900">No tickets found</h3>
                                                <p className="text-xs text-gray-500 mt-1">Check back later or adjust your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Hard-ticket QR generation modal */}
            {hardTier && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                     onClick={() => hardStatus !== "LOADING" && setHardTier(null)}>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-amber-600" /> Print Hard Tickets
                            </h3>
                            <button onClick={() => hardStatus !== "LOADING" && setHardTier(null)}
                                    className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6">
                            {hardStatus === "DONE" ? (
                                <div className="text-center py-4">
                                    <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
                                    <p className="font-bold text-gray-900 text-lg">{hardCount} tickets generated</p>
                                    <p className="text-sm text-gray-500 mt-1">Your printable QR sheet has downloaded. Print, cut, and attach each QR to a ticket.</p>
                                    <button onClick={() => setHardTier(null)}
                                            className="mt-6 w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700">Done</button>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-1 text-sm text-gray-500">Tier</div>
                                    <div className="font-bold text-gray-900 mb-1">{hardTier.name}</div>
                                    <div className="text-xs text-gray-400 mb-5">{hardTier.remaining} of {hardTier.quantity} remaining · these QR tickets use that capacity</div>

                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">How many?</label>
                                    <input
                                        type="number" min={1} max={hardTier.remaining} value={hardQty}
                                        onChange={(e) => setHardQty(Math.max(1, Math.min(hardTier.remaining, Number(e.target.value) || 1)))}
                                        className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-100 border-0 text-gray-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                    />

                                    {hardStatus === "ERROR" && (
                                        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs flex gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />{hardError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleGenerateHard}
                                        disabled={hardStatus === "LOADING" || hardQty < 1}
                                        className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {hardStatus === "LOADING"
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                                            : <><Printer className="w-4 h-4" /> Generate &amp; Download PDF</>}
                                    </button>
                                    <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                                        This creates {hardQty} unique ticket{hardQty === 1 ? "" : "s"} and downloads a QR sheet to print.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
