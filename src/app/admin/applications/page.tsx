"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard, Building2, Users, Settings, LogOut, Bell,
    ChevronRight, Loader2, Sparkles, CheckCircle2, Clock, XCircle,
    RefreshCw, Plus, Edit, Trash2, Search, Filter
} from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import ApplicationModal from "@/platform/components/ApplicationModal";

const ADMIN_NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", active: false },
    { label: "Applications", icon: Building2, href: "/admin/applications", active: true },
    { label: "Users", icon: Users, href: "/admin/users", active: false },
    { label: "Settings", icon: Settings, href: "/admin/settings", active: false },
];

export default function AdminApplicationsPage() {
    const [user, setUser] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [filteredApps, setFilteredApps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<any | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const router = useRouter();

    const fetchApplications = async () => {
        try {
            const res = await api.get("/companies/applications/");
            const data = res.data.results ?? res.data;
            setApplications(data);
            setFilteredApps(data);
        } catch (err) {
            console.error("Failed to fetch applications", err);
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
            await fetchApplications();
            setIsLoading(false);
        };
        init();
    }, [router]);

    // Apply filters
    useEffect(() => {
        let result = applications;
        if (statusFilter !== "ALL") {
            result = result.filter(a => a.status === statusFilter);
        }
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.company_name.toLowerCase().includes(query) ||
                a.email.toLowerCase().includes(query)
            );
        }
        setFilteredApps(result);
    }, [applications, statusFilter, searchQuery]);

    const updateStatus = async (appId: string, status: "APPROVED" | "REJECTED") => {
        setActionLoading(appId + status);
        try {
            await api.patch(`/companies/applications/${appId}/`, { status });
            await fetchApplications();
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteApplication = async (appId: string) => {
        if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
        setActionLoading(appId + "DELETE");
        try {
            await api.delete(`/companies/applications/${appId}/`);
            await fetchApplications();
        } catch (err) {
            console.error("Failed to delete application", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleModalSubmit = async (data: any) => {
        setModalLoading(true);
        try {
            if (editingApp) {
                await api.patch(`/companies/applications/${editingApp.id}/`, data);
            } else {
                await api.post(`/companies/applications/`, data);
            }
            await fetchApplications();
            setIsModalOpen(false);
            setEditingApp(null);
        } catch (err) {
            console.error("Failed to save application", err);
            alert("Failed to save. Please review input formatting. If generating locally be sure you don't already have an app for this user account.");
        } finally {
            setModalLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingApp(null);
        setIsModalOpen(true);
    };

    const openEditModal = (app: any) => {
        setEditingApp(app);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Applications…</span>
            </div>
        );
    }

    const statusBadge = (status: string) => {
        if (status === "APPROVED") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#1e8a5e18", color: "#1e8a5e" }}>APPROVED</span>;
        if (status === "REJECTED") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#ef444418", color: "#ef4444" }}>REJECTED</span>;
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#eab30818", color: "#eab308" }}>PENDING</span>;
    };

    const authBadge = (auth: string) => {
        if (auth === "EVENTS") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#F39C1218", color: "#F39C12" }}>Events Only</span>;
        if (auth === "VOTING") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#6c4ef218", color: "#6c4ef2" }}>Voting Only</span>;
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#1e8a5e18", color: "#1e8a5e" }}>Both</span>;
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
            <div className="flex items-center gap-3 px-6 py-7 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F39C12" }}>
                    <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="text-lg font-bold tracking-tight" style={{ color: "#08283B" }}>OZONE</span>
            </div>
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
            <aside className="hidden lg:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-screen z-30">
                <SidebarContent />
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-64 h-full bg-white">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">
                    <div className="shrink-0 min-w-[180px] hidden sm:block">
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Company Applications</h1>
                        <p className="text-xs text-gray-400">Manage incoming requests</p>
                    </div>

                    <button className="lg:hidden p-2 rounded-xl bg-gray-50 text-gray-600" onClick={() => setSidebarOpen(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex-1 max-w-md mx-auto hidden md:block">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search applications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-12 py-2.5 rounded-full text-sm bg-gray-100 border-0 focus:outline-hidden focus:ring-2 text-gray-700 placeholder:text-gray-400"
                                style={{ focusRingColor: "#F39C12" } as any}
                            />
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <button onClick={fetchApplications} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="relative w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#08283B" }}>
                            <Bell className="w-4 h-4 text-white" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white" style={{ background: "#F39C12" }} />
                        </button>
                        <div className="flex items-center gap-3 pl-2 sm:border-l border-gray-100">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                                {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 px-6 lg:px-10 py-8">
                    {/* Page Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl">
                            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === status
                                        ? "bg-gray-800 text-white shadow-xs"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-xs hover:opacity-90 transition-opacity"
                            style={{ background: "#F39C12" }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Company
                        </button>
                    </div>

                    {/* Applications Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-50 bg-gray-50/50">
                                        <th className="px-6 py-4">Company Details</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Authorization</th>
                                        <th className="px-6 py-4">Applied On</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredApps.length > 0 ? filteredApps.map((app: any) => (
                                        <tr key={app.id} className="hover:bg-gray-50/60 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{app.company_name}</p>
                                                        <p className="text-xs text-gray-400">{app.email} • {app.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {statusBadge(app.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {app.status === "APPROVED" ? authBadge(app.authorization || "BOTH") : <span className="text-xs text-gray-300">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(app)}
                                                        className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-bold flex items-center gap-1.5"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Review
                                                    </button>
                                                    <button
                                                        onClick={() => deleteApplication(app.id)}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                                                        title="Delete"
                                                    >
                                                        {actionLoading === app.id + "DELETE" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center">
                                                <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                                <p className="text-sm font-bold text-gray-400">No applications found</p>
                                                <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or search query</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </main>

            <ApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingApp}
                isLoading={modalLoading}
            />
        </div>
    );
}
