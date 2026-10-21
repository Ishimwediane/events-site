"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard, Calendar, Ticket, BarChart3,
    Users, Settings, Sparkles, LogOut, ChevronRight,
    ShieldCheck, Vote, DollarSign, ScanLine
} from "lucide-react";
import { useEffect, useState } from "react";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";

const ADMIN_NAV_ITEMS = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard/admin" },
    { label: "Organizers", icon: Users, href: "/dashboard/admin/companies" },
    { label: "Users", icon: Users, href: "/dashboard/admin/users" },
    { label: "Events", icon: Calendar, href: "/dashboard/admin/events" },
    { label: "Gate Check-ins", icon: ScanLine, href: "/dashboard/checkins" },
    { label: "Voting Campaigns", icon: Vote, href: "/dashboard/admin/voting" },
    { label: "Finance", icon: DollarSign, href: "/dashboard/admin/finance" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Base nav always shown to company users
const BASE_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", auth: null },
    { label: "Customers", icon: Users, href: "/dashboard/customers", auth: null },
    { label: "Settings", icon: Settings, href: "/dashboard/settings", auth: null },
];

// Gated nav items — only shown if authorization matches
const EVENTS_NAV = [
    { label: "Events", icon: Calendar, href: "/dashboard/events", auth: "EVENTS" },
    { label: "Tickets", icon: Ticket, href: "/dashboard/tickets", auth: "EVENTS" },
    { label: "Gate Check-ins", icon: ScanLine, href: "/dashboard/checkins", auth: "EVENTS" },
];

const VOTING_NAV = [
    { label: "Voting Campaigns", icon: Vote, href: "/dashboard/voting", auth: "VOTING" },
];

export default function DashboardSidebar({ user }: { user: any }) {
    const pathname = usePathname();
    const isAdmin = user?.role === "ADMIN";

    // Authorization state for companies
    const [auth, setAuth] = useState<string>("");

    useEffect(() => {
        const fetchAuth = async () => {
            if (user?.role === "COMPANY") {
                // If the parent already passed it, use it to avoid flashing
                if (user.authorization) setAuth(user.authorization.toUpperCase().trim());

                try {
                    const profile = await api.get("/companies/profile/me/");
                    const rawAuth = (profile.data.authorization || "BOTH").toUpperCase().trim();
                    setAuth(rawAuth);
                    // Also sync back to user object for parent
                    user.authorization = rawAuth;
                } catch (e) {
                    console.error("Failed to sidebar auth", e);
                }
            }
        };
        fetchAuth();
    }, [user]);

    const canEvents = auth === "EVENTS" || auth === "BOTH";
    const canVoting = auth === "VOTING" || auth === "BOTH";

    // Build company nav based on authorization
    const companyNav = [
        BASE_NAV[0], // Dashboard
        ...(canEvents ? EVENTS_NAV : []),
        ...(canVoting ? VOTING_NAV : []),
        BASE_NAV[1], // Customers
        BASE_NAV[2], // Settings
    ];

    const navItems = isAdmin ? ADMIN_NAV_ITEMS : companyNav;

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-100">

            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-7 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-0.5" style={{ background: "#F39C12" }}>
                    <Image
                        src="/image/logo.jpg"
                        alt="OZONE Logo"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                    />
                </div>
                <span className="text-lg font-semibold tracking-tight font-heading" style={{ color: "#08283B" }}>OZONE EVENT</span>
            </div>

            {/* Authorization badge — company only */}
            {!isAdmin && (
                <div className="mx-4 mt-4 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: "#E8F4F8" }}>
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#F39C12" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#F39C12" }}>
                        {auth === "EVENTS" ? "Events Only"
                            : auth === "VOTING" ? "Voting Only"
                                : "Events & Voting"}
                    </span>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-300 px-3 mb-4">
                    {isAdmin ? "Administration" : "Main Menu"}
                </p>
                {navItems.map(({ label, icon: Icon, href }) => {
                    const active = pathname === href ||
                        (href !== "/dashboard" && href !== "/dashboard/admin" && pathname?.startsWith(href));
                    return (
                        <Link
                            key={label}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active
                                ? "text-white"
                                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                            style={active ? { background: "#F39C12" } : {}}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                            {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Logout */}
            <div className="px-4 pb-6 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{user?.first_name || user?.email?.split("@")[0]}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => authService.logout()}
                    className="flex items-center gap-2 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </div>
    );
}
