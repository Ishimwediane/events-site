"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard, Building2, Users, Settings, LogOut, Bell,
    ChevronRight, Loader2, Sparkles, RefreshCw, Plus, Edit, Trash2, Search, Filter
} from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import UserModal from "@/platform/components/UserModal";

const ADMIN_NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", active: false },
    { label: "Applications", icon: Building2, href: "/admin/applications", active: false },
    { label: "Users", icon: Users, href: "/admin/users", active: true },
    { label: "Settings", icon: Settings, href: "/admin/settings", active: false },
];

export default function AdminUsersPage() {
    const [user, setUser] = useState<any>(null);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const router = useRouter();

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users/");
            const data = res.data.results ?? res.data;
            setUsersList(data);
            setFilteredUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
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
            await fetchUsers();
            setIsLoading(false);
        };
        init();
    }, [router]);

    // Apply filters
    useEffect(() => {
        let result = usersList;
        if (roleFilter !== "ALL") {
            result = result.filter(u => u.role === roleFilter);
        }
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                (u.first_name || "").toLowerCase().includes(query) ||
                (u.last_name || "").toLowerCase().includes(query) ||
                (u.email || "").toLowerCase().includes(query)
            );
        }
        setFilteredUsers(result);
    }, [usersList, roleFilter, searchQuery]);

    const deleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        setActionLoading(userId + "DELETE");
        try {
            await api.delete(`/users/${userId}/`);
            await fetchUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
            alert("Failed to delete user. There might be related records (applications/events) depending on this user.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleModalSubmit = async (data: any) => {
        setModalLoading(true);
        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}/`, data);
            } else {
                await api.post(`/users/`, data);
            }
            await fetchUsers();
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (err: any) {
            console.error("Failed to save user", err);
            const msg = err.response?.data?.email?.[0] || err.response?.data?.error || "Failed to save user. Please check your inputs.";
            alert(msg);
        } finally {
            setModalLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const openEditModal = (userData: any) => {
        setEditingUser(userData);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Users…</span>
            </div>
        );
    }

    const roleBadge = (role: string) => {
        if (role === "ADMIN") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#f59e0b18", color: "#d97706" }}>ADMIN</span>;
        if (role === "COMPANY") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#3b82f618", color: "#2563eb" }}>COMPANY</span>;
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: "#f3f4f6", color: "#4b5563" }}>USER</span>;
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
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">User Management</h1>
                        <p className="text-xs text-gray-400">View and manage platform accounts</p>
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
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-12 py-2.5 rounded-full text-sm bg-gray-100 border-0 focus:outline-hidden focus:ring-2 text-gray-700 placeholder:text-gray-400"
                                style={{ focusRingColor: "#F39C12" } as any}
                            />
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <button onClick={fetchUsers} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
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
                            {["ALL", "ADMIN", "COMPANY", "USER"].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === role
                                            ? "bg-gray-800 text-white shadow-xs"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-xs hover:opacity-90 transition-opacity"
                            style={{ background: "#F39C12" }}
                        >
                            <Plus className="w-4 h-4" />
                            Add User
                        </button>
                    </div>

                    {/* Users Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-50 bg-gray-50/50">
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined On</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredUsers.length > 0 ? filteredUsers.map((u: any) => (
                                        <tr key={u.id} className="hover:bg-gray-50/60 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: u.role === "ADMIN" ? "#F39C12" : "#08283B" }}>
                                                        {u.first_name?.[0] || u.email?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{u.first_name} {u.last_name}</p>
                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {roleBadge(u.role)}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                {new Date(u.date_joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(u.id)}
                                                        disabled={!!actionLoading || user?.id === u.id}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                                                        title={user?.id === u.id ? "Cannot delete yourself" : "Delete"}
                                                    >
                                                        {actionLoading === u.id + "DELETE" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center">
                                                <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                                <p className="text-sm font-bold text-gray-400">No users found</p>
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

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingUser}
                isLoading={modalLoading}
            />
        </div>
    );
}
