"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Plus, Bell, Settings, Menu, Calendar, MapPin,
    Loader2, Search, MoreVertical, Pencil, Trash2,
    TrendingUp, Ticket, Eye, ArrowRight,
} from "lucide-react";
import { companyService } from "@/platform/services/company.service";
import { authService } from "@/platform/services/auth.service";
import { eventService } from "@/platform/services/event.service";
import { api } from "@/platform/lib/api";
import CreateEventModal from "@/platform/components/CreateEventModal";
import DashboardSidebar from "@/platform/components/DashboardSidebar";

// Helper for status styling
const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'DRAFT':
            return { bg: "#f3f4f6", text: "#4b5563", label: "Draft" }; // Gray
        case 'PUBLISHED':
            return { bg: "#1e8a5e18", text: "#1e8a5e", label: "Published" }; // Green
        case 'ONGOING':
            return { bg: "#dbeafe", text: "#2563eb", label: "Ongoing" }; // Blue
        case 'FINISHED':
            return { bg: "#fef3c7", text: "#d97706", label: "Finished" }; // Yellow/Amber
        case 'CANCELLED':
            return { bg: "#fee2e2", text: "#dc2626", label: "Cancelled" }; // Red
        default:
            return { bg: "#f3f4f6", text: "#4b5563", label: status || "Unknown" };
    }
};

export default function DashboardEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [eventToEdit, setEventToEdit] = useState<any>(null);
    const router = useRouter();

    const fetchEvents = async () => {
        try {
            const data = await companyService.getMyEvents();
            setEvents(data.results || data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || !["COMPANY", "ADMIN"].includes(userData.role)) {
                router.push("/login");
                return;
            }

            try {
                // Only COMPANIES need to check if they are limited to "VOTING" only
                if (userData.role === "COMPANY") {
                    const profile = await api.get("/companies/profile/me/");
                    if (profile.data.authorization === "VOTING") {
                        router.push("/dashboard"); // Block from Events
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to verify authorization", e);
            }

            setUser(userData);
            await fetchEvents();
            setIsLoading(false);
        };
        init();
    }, [router]);

    const filtered = events.filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.location?.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (event: any) => {
        setEventToEdit(event);
        setIsModalOpen(true);
        setOpenMenu(null);
    };

    const handleDelete = async (event: any) => {
        if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
        try {
            await eventService.deleteEvent(event.id);
            await fetchEvents();
            setOpenMenu(null);
        } catch (e) {
            alert("Failed to delete event.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Events…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full">

            {/* Top bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">
                <div className="flex items-center gap-4 shrink-0 min-w-[160px]">
                    <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Events</h1>
                        <p className="text-xs text-gray-400">Hello {user?.first_name || "there"}, welcome back!</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md mx-auto">
                    <div className="relative">
                        <input type="text" placeholder="Search events..."
                            className="w-full pl-5 pr-12 py-2.5 rounded-full text-sm bg-gray-100 border-0 focus:outline-hidden text-gray-700 placeholder:text-gray-400"
                            value={search} onChange={e => setSearch(e.target.value)} />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0">
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

            {/* Body */}
            <div className="flex-1 px-6 lg:px-10 py-8">

                {/* Page header row */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">My Events</h2>
                        <p className="text-sm text-gray-400 mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""} total</p>
                    </div>
                    <button
                        onClick={() => { setEventToEdit(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "#F39C12", color: "#08283B" }}
                    >
                        <Plus className="w-4 h-4" /> Create Event
                    </button>
                </div>

                {/* Events grid */}
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filtered.map((event: any, i: number) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => router.push(`/dashboard/events/${event.id}`)}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                            >
                                {/* Card top color band */}
                                <div className="h-1.5 w-full" style={{ background: "#F39C12" }} />

                                <div className="p-5">
                                    {/* Title + menu */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block"
                                                style={{ background: "rgba(243,156,18,0.1)", color: "#F39C12" }}>
                                                {event.category_name || "General"}
                                            </span>
                                            <h3 className="text-base font-bold text-gray-800 group-hover:text-amber-600 transition-colors leading-tight">
                                                {event.title}
                                            </h3>
                                        </div>
                                        {/* 3-dot menu */}
                                        <div className="relative">
                                            <button
                                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenu(openMenu === i ? null : i);
                                                }}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {openMenu === i && (
                                                <div className="absolute right-0 top-8 bg-white rounded-xl border border-gray-100 shadow-lg z-10 py-1 w-36"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/events/${event.id}`); }}
                                                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 w-full"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> View
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                                                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 w-full"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(event); }}
                                                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-50 w-full"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta info */}
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            {event.start_date
                                                ? new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                : "TBD"}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                {event.location}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Ticket className="w-3.5 h-3.5" style={{ color: "#F39C12" }} />
                                            <span className="font-semibold text-gray-600">
                                                {event.tickets?.reduce((a: number, t: any) => a + (t.quantity - t.remaining), 0) || 0}
                                            </span> sold
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                                            <span className="font-semibold text-gray-600">
                                                {event.tickets?.reduce((a: number, t: any) => a + ((t.quantity - t.remaining) * Number(t.price)), 0).toLocaleString()} RWF
                                            </span>
                                        </div>
                                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                            style={{
                                                background: getStatusBadge(event.status).bg,
                                                color: getStatusBadge(event.status).text
                                            }}>
                                            {getStatusBadge(event.status).label}
                                        </span>
                                    </div>

                                    {/* Manage Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/events/${event.id}`); }}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-white"
                                        style={{ background: "#08283B" }}
                                    >
                                        Manage Event <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-32 rounded-2xl border-2 border-dashed border-gray-100 bg-white">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(243,156,18,0.08)" }}>
                            <Calendar className="w-8 h-8" style={{ color: "#F39C12" }} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No events yet</h3>
                        <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">
                            {search ? "No events match your search." : "Create your first event and start selling tickets!"}
                        </p>
                        {!search && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                                style={{ background: "#F39C12", color: "#08283B" }}
                            >
                                <Plus className="w-4 h-4" /> Create Your First Event
                            </button>
                        )}
                    </div>
                )}
            </div>

            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEventToEdit(null); }}
                onSuccess={() => { fetchEvents(); setIsModalOpen(false); setEventToEdit(null); }}
                eventToEdit={eventToEdit}
            />
        </div>
    );
}
