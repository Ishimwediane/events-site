"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard, Building2, Users, Settings, LogOut, Bell,
    ChevronRight, Loader2, Sparkles, User, Mail, Save, Menu
} from "lucide-react";
import { authService } from "@/platform/services/auth.service";

const ADMIN_NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", active: false },
    { label: "Applications", icon: Building2, href: "/admin/applications", active: false },
    { label: "Users", icon: Users, href: "/admin/users", active: false },
    { label: "Settings", icon: Settings, href: "/admin/settings", active: true },
];

export default function AdminSettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Personal Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [personalSuccess, setPersonalSuccess] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || userData.role !== "ADMIN") {
                router.push("/login");
                return;
            }
            setUser(userData);

            setFirstName(userData.first_name || "");
            setLastName(userData.last_name || "");

            setIsLoading(false);
        };
        init();
    }, [router]);

    const handleSavePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPersonal(true);
        setPersonalSuccess(false);

        try {
            await authService.updateProfile({
                first_name: firstName,
                last_name: lastName
            });
            // Update local state to reflect what's stored
            const updatedUser = authService.getUserFromStorage();
            setUser(updatedUser);
            setPersonalSuccess(true);
            setTimeout(() => setPersonalSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update personal details", error);
        } finally {
            setIsSavingPersonal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Settings…</span>
            </div>
        );
    }

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
        <div className="flex min-h-screen font-sans text-gray-800" style={{ background: "#f4f5f7" }}>
            <aside className="hidden lg:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-screen z-30">
                <SidebarContent />
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-64 h-full bg-white"><SidebarContent /></aside>
                </div>
            )}

            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 pb-12">
                <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4 shadow-xs">
                    <div className="flex items-center gap-4 shrink-0">
                        <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 leading-tight">Settings</h1>
                            <p className="text-xs text-gray-400">Manage your admin profile</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <button className="relative w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#08283B" }}>
                            <Bell className="w-4 h-4 text-white" />
                        </button>
                        <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                                {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-gray-800 leading-tight">{user?.first_name || "Admin"} {user?.last_name || ""}</p>
                                <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-8 mt-4">

                    {/* PERSONAL SETTINGS */}
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Update your own name and contact details.</p>
                            </div>
                        </div>
                        <form onSubmit={handleSavePersonal} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-sm"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Admin"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-sm"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="User"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-semibold text-sm cursor-not-allowed"
                                            value={user?.email || ""}
                                            disabled
                                        />
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium">Your email address cannot be changed right now.</p>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                {personalSuccess ? (
                                    <span className="text-sm font-bold text-green-600 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                                        Saved successfully!
                                    </span>
                                ) : <div />}

                                <button
                                    type="submit"
                                    disabled={isSavingPersonal}
                                    className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSavingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
