"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard, Building2, Users, Settings, LogOut, Bell,
    ChevronRight, Loader2, Sparkles, CheckCircle2, Clock, XCircle,
    RefreshCw, Mail, AlertTriangle, Send
} from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import { ticketService, UnsentTicket } from "@/platform/services/ticket.service";

const ADMIN_NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", active: true },
    { label: "Applications", icon: Building2, href: "/admin/applications", active: false },
    { label: "Users", icon: Users, href: "/admin/users", active: false },
    { label: "Settings", icon: Settings, href: "/admin/settings", active: false },
];

export default function AdminDashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unsentTickets, setUnsentTickets] = useState<UnsentTicket[]>([]);
    const [unsentLoading, setUnsentLoading] = useState(false);
    const [resendingCode, setResendingCode] = useState<string | null>(null);
    const [resendResult, setResendResult] = useState<Record<string, 'sent' | 'failed'>>({});
    const [manualCode, setManualCode] = useState('');
    const [manualResending, setManualResending] = useState(false);
    const [manualResult, setManualResult] = useState<'sent' | 'failed' | null>(null);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const [appsRes, usersRes] = await Promise.all([
                api.get("/companies/applications/"),
                api.get("/users/"),
            ]);
            setApplications(appsRes.data.results ?? appsRes.data);
            setUsers(usersRes.data.results ?? usersRes.data);
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        }
    };

    const fetchUnsentTickets = async () => {
        setUnsentLoading(true);
        try {
            const res = await ticketService.getUnsentEmails(72);
            setUnsentTickets(res.tickets);
        } catch (err) {
            console.error("Failed to fetch unsent tickets", err);
        } finally {
            setUnsentLoading(false);
        }
    };

    const handleResendEmail = async (ticketCode: string) => {
        setResendingCode(ticketCode);
        try {
            const res = await ticketService.resendTicketEmail(ticketCode);
            if (res.sent.length > 0) {
                setResendResult(prev => ({ ...prev, [ticketCode]: 'sent' }));
                setUnsentTickets(prev => prev.filter(t => t.ticket_code !== ticketCode));
            } else {
                setResendResult(prev => ({ ...prev, [ticketCode]: 'failed' }));
            }
        } catch {
            setResendResult(prev => ({ ...prev, [ticketCode]: 'failed' }));
        } finally {
            setResendingCode(null);
        }
    };

    const handleManualResend = async () => {
        if (!manualCode.trim()) return;
        setManualResending(true);
        setManualResult(null);
        try {
            const res = await ticketService.resendTicketEmail(manualCode.trim());
            setManualResult(res.sent.length > 0 ? 'sent' : 'failed');
        } catch {
            setManualResult('failed');
        } finally {
            setManualResending(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || userData.role !== "ADMIN") {
                router.push("/login");
                return;
            }
            setUser(userData);
            await Promise.all([fetchData(), fetchUnsentTickets()]);
            setIsLoading(false);
        };
        init();
    }, [router]);

    const updateApplicationStatus = async (appId: string, status: "APPROVED" | "REJECTED") => {
        setActionLoading(appId + status);
        try {
            await api.patch(`/companies/applications/${appId}/`, { status });
            await fetchData();
        } catch (err) {
            console.error("Failed to update application", err);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Admin Panel…</span>
            </div>
        );
    }

    const pendingApps = applications.filter((a) => a.status === "PENDING");
    const approvedApps = applications.filter((a) => a.status === "APPROVED");
    const rejectedApps = applications.filter((a) => a.status === "REJECTED");
    const companyUsers = users.filter((u) => u.role === "COMPANY");

    const statCards = [
        { label: "Total Users", value: users.length, icon: Users, bg: "#6c4ef2", change: "Up to date" },
        { label: "Companies", value: companyUsers.length, icon: Building2, bg: "#F39C12", change: "Up to date" },
        { label: "Pending Apps", value: pendingApps.length, icon: Clock, bg: "#eab308", change: "Action needed" },
        { label: "Approved Apps", value: approvedApps.length, icon: CheckCircle2, bg: "#1e8a5e", change: "Up to date" },
    ];

    const statusBadge = (status: string) => {
        if (status === "APPROVED") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#1e8a5e18", color: "#1e8a5e" }}>APPROVED</span>;
        if (status === "REJECTED") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#ef444418", color: "#ef4444" }}>REJECTED</span>;
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#eab30818", color: "#eab308" }}>PENDING</span>;
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-7 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F39C12" }}>
                    <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="text-lg font-bold tracking-tight" style={{ color: "#08283B" }}>OZONE</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-300 px-3 mb-4">Admin Menu</p>
                {ADMIN_NAV_ITEMS.map(({ label, icon: Icon, href, active }) => (
                    <Link key={label} href={href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${active
                            ? "text-white"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        style={active ? { background: "#F39C12" } : {}}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </Link>
                ))}
            </nav>

            {/* User / Logout */}
            <div className="px-4 pb-6 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-black" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{user?.first_name || user?.email?.split("@")[0]}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button onClick={() => authService.logout()}
                    className="flex items-center gap-2 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen" style={{ background: "#f4f5f7" }}>
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-screen z-30">
                <SidebarContent />
            </aside>

            {/* ── Mobile Sidebar overlay ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-64 h-full bg-white">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* ── Main Content ── */}
            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">
                    {/* Left — title + subtitle */}
                    <div className="shrink-0 min-w-[180px] hidden sm:block">
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Admin Dashboard</h1>
                        <p className="text-xs text-gray-400">
                            Manage platform activity and users
                        </p>
                    </div>

                    {/* Mobile menu toggle */}
                    <button className="lg:hidden p-2 rounded-xl bg-gray-50 text-gray-600" onClick={() => setSidebarOpen(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Center — search */}
                    <div className="flex-1 max-w-md mx-auto hidden md:block">
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
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <button onClick={fetchData} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                        {/* Bell */}
                        <button className="relative w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#08283B" }}>
                            <Bell className="w-4 h-4 text-white" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white" style={{ background: "#F39C12" }} />
                        </button>

                        {/* Settings */}
                        <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center" style={{ background: "#08283B" }}>
                            <Settings className="w-4 h-4 text-white" />
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-3 pl-2 sm:border-l border-gray-100">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                                {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-gray-800 leading-tight">{user?.first_name || "Admin"} {user?.last_name || ""}</p>
                                <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase() || "admin"}</p>
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
                        <div className="relative z-10">
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F39C12" }}>Admin Overview</p>
                            <h2 className="text-xl font-bold text-white">
                                {user?.first_name ? `Hello, ${user.first_name} 👋` : "Good to have you back 👋"}
                            </h2>
                            <p className="text-white/40 text-sm mt-1">Here's a summary of platform activity today.</p>
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
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#4b5563" }}>
                                        {card.change}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                        {/* Company Applications */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-[500px]"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    Company Applications
                                    {pendingApps.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] uppercase tracking-widest">{pendingApps.length} pending</span>
                                    )}
                                </h3>
                                <button className="text-xs font-bold" style={{ color: "#F39C12" }}>View All →</button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-4">
                                {applications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                        <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400">No applications yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {applications.map((app) => (
                                            <div key={app.id} className="p-4 rounded-xl border border-gray-50 hover:border-gray-100 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center gap-4 bg-white group">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-sm font-bold text-gray-800 truncate group-hover:text-amber-600 transition-colors">{app.company_name}</h3>
                                                        {statusBadge(app.status)}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-1">{app.email} · {app.phone}</p>
                                                    <p className="text-[11px] text-gray-500 line-clamp-1">{app.description}</p>
                                                </div>

                                                {app.status === "PENDING" && (
                                                    <div className="flex gap-2 shrink-0 border-t sm:border-t-0 border-gray-50 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                                        <button
                                                            onClick={() => updateApplicationStatus(app.id, "APPROVED")}
                                                            disabled={!!actionLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-all disabled:opacity-50"
                                                        >
                                                            {actionLoading === app.id + "APPROVED" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateApplicationStatus(app.id, "REJECTED")}
                                                            disabled={!!actionLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                                                        >
                                                            {actionLoading === app.id + "REJECTED" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Recent Users */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-[500px]"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
                                <h3 className="text-sm font-bold text-gray-800">Recent Users</h3>
                                <button className="text-xs font-bold" style={{ color: "#F39C12" }}>View All →</button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-0">
                                {users.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400">No users found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {users.slice(0, 10).map((u) => (
                                            <div key={u.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: u.role === "ADMIN" ? "#F39C12" : "#08283B" }}>
                                                    {u.first_name?.[0] || u.email?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{u.first_name} {u.last_name || ""}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase shrink-0 ${u.role === "ADMIN" ? "bg-amber-100 text-amber-700" :
                                                        u.role === "COMPANY" ? "bg-blue-100 text-blue-700" :
                                                            "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Unsent Email Panel — always visible ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl border border-amber-100 overflow-hidden mb-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-50" style={{ background: "#fffbeb" }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F39C1218" }}>
                                    <AlertTriangle className="w-4 h-4" style={{ color: "#F39C12" }} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">Unsent Ticket Emails</h3>
                                    <p className="text-[11px] text-gray-400">Buyers who paid but didn&apos;t receive their ticket — last 72 hrs</p>
                                </div>
                                {unsentTickets.length > 0 && (
                                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#F39C1220", color: "#F39C12" }}>
                                        {unsentTickets.length} pending
                                    </span>
                                )}
                            </div>
                            <button
                                id="refresh-unsent-emails"
                                onClick={fetchUnsentTickets}
                                disabled={unsentLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{ background: "#F39C1215", color: "#F39C12" }}
                            >
                                <RefreshCw className={`w-3 h-3 ${unsentLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {/* Manual resend by ticket code */}
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Resend by Ticket Code</p>
                            <div className="flex gap-2">
                                <input
                                    id="manual-ticket-code-input"
                                    type="text"
                                    value={manualCode}
                                    onChange={e => { setManualCode(e.target.value); setManualResult(null); }}
                                    onKeyDown={e => e.key === 'Enter' && handleManualResend()}
                                    placeholder="e.g. TICK-ABCD1234"
                                    className="flex-1 px-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-hidden focus:ring-2 font-mono"
                                    style={{ focusRingColor: '#F39C12' } as any}
                                />
                                <button
                                    id="manual-resend-btn"
                                    onClick={handleManualResend}
                                    disabled={manualResending || !manualCode.trim()}
                                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ background: "#08283B" }}
                                >
                                    {manualResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send
                                </button>
                            </div>
                            {manualResult === 'sent' && (
                                <p className="flex items-center gap-1 text-xs font-bold text-green-600 mt-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Email sent successfully to {manualCode}!
                                </p>
                            )}
                            {manualResult === 'failed' && (
                                <p className="flex items-center gap-1 text-xs font-bold text-red-500 mt-2">
                                    <XCircle className="w-3.5 h-3.5" /> Failed — check that the ticket code is correct.
                                </p>
                            )}
                        </div>

                        {/* Unsent tickets list */}
                        {unsentLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#F39C12" }} />
                            </div>
                        ) : unsentTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Mail className="w-8 h-8 mb-3 text-gray-200" />
                                <p className="text-sm font-bold text-gray-400">All tickets emailed ✓</p>
                                <p className="text-xs text-gray-300 mt-1">No unsent tickets in the last 72 hours</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {unsentTickets.map((ticket) => (
                                    <div key={ticket.ticket_code} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-mono text-xs font-bold text-gray-700">{ticket.ticket_code}</span>
                                                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-gray-100 text-gray-500">{ticket.ticket_type}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{ticket.full_name || '—'}</p>
                                            <p className="text-xs text-gray-400 truncate">{ticket.email} · {ticket.event}</p>
                                            <p className="text-[10px] text-gray-300 mt-0.5">{new Date(ticket.purchase_date).toLocaleString()}</p>
                                        </div>
                                        <div className="shrink-0">
                                            {resendResult[ticket.ticket_code] === 'sent' ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent!
                                                </span>
                                            ) : resendResult[ticket.ticket_code] === 'failed' ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                                                    <XCircle className="w-3.5 h-3.5" /> Failed
                                                </span>
                                            ) : (
                                                <button
                                                    id={`resend-email-${ticket.ticket_code}`}
                                                    onClick={() => handleResendEmail(ticket.ticket_code)}
                                                    disabled={resendingCode === ticket.ticket_code}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                                                    style={{ background: "#08283B" }}
                                                >
                                                    {resendingCode === ticket.ticket_code
                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                        : <Send className="w-3 h-3" />}
                                                    Resend Email
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>


                </div>
            </main>
        </div>
    );
}
