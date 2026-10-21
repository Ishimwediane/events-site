"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Loader2, Search, Bell, Menu,
    Users, TrendingUp, Calendar, CreditCard, Ticket
} from "lucide-react";
import { customerService } from "@/platform/services/customer.service";
import { authService } from "@/platform/services/auth.service";
import DashboardSidebar from "@/platform/components/DashboardSidebar";

export default function GlobalCustomersPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || userData.role !== "COMPANY") { router.push("/login"); return; }
            setUser(userData);

            try {
                const data = await customerService.getGlobalCustomers();
                setCustomers(Array.isArray(data) ? data : data.results || []);
            } catch (error) {
                console.error("Failed to load global customers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    const filtered = customers.filter(c =>
        c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate Global Customer Stats
    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((acc, c) => acc + (c.total_tickets || 0), 0);
    const totalLifetimeValue = customers.reduce((acc, c) => acc + Number(c.total_spent || 0), 0);
    const avgOrderValue = totalOrders > 0 ? (totalLifetimeValue / totalOrders) : 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Customers…</span>
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
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Customers</h1>
                        <p className="text-xs text-gray-400">Manage the people attending your events</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md mx-auto hidden md:block">
                    <div className="relative">
                        <input type="text" placeholder="Search by name or email..."
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Total Customers</h3>
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Unique individuals</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Total Orders</h3>
                            <Ticket className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Tickets purchased</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Total LTV</h3>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalLifetimeValue.toLocaleString()} RWF</p>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Lifetime value generated</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500">Avg. Order Value</h3>
                            <CreditCard className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{avgOrderValue.toLocaleString()} RWF</p>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Across all purchases</p>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Customer Directory</h2>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Customer</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Tickets Bought</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Total Spent</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((customer: any, idx: number) => (
                                    <motion.tr
                                        key={customer.id || idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                                                    {customer.first_name?.[0] ?? customer.email?.[0]?.toUpperCase() ?? "C"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {customer.first_name || customer.last_name ? `${customer.first_name} ${customer.last_name}` : "Unknown User"}
                                                    </div>
                                                    <div className="text-xs font-semibold text-gray-400 mt-0.5 max-w-[200px] truncate">
                                                        {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-semibold text-gray-700">
                                                <Ticket className="w-4 h-4 text-gray-400 shrink-0" />
                                                {customer.total_tickets}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">
                                            {Number(customer.total_spent || 0).toLocaleString()} RWF
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                                <Calendar className="w-4 h-4 shrink-0" />
                                                {customer.last_active
                                                    ? new Date(customer.last_active).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                    : "Unknown"}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users className="w-10 h-10 text-gray-300 mb-3" />
                                                <h3 className="text-sm font-bold text-gray-900">No customers found</h3>
                                                <p className="text-xs text-gray-500 mt-1">Check back once you start selling tickets.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
