"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Plus, Trash2, X, CheckCircle2, Eye,
    Calendar, ShieldCheck, Bell, MapPin,
    FilterX, Ticket, TrendingUp, Clock, Pencil, Search, RefreshCw, ArrowRight,
    QrCode, Printer, AlertCircle
} from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import { ticketService } from "@/platform/services/ticket.service";
import CreateEventModal from "@/platform/components/CreateEventModal";
import { getImageUrl } from "@/platform/lib/images";

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-green-100 text-green-700",
    ONGOING: "bg-amber-100 text-amber-700",
    CANCELLED: "bg-red-100 text-red-600",
    COMPLETED: "bg-blue-100 text-blue-700",
};

export default function AdminEventsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [search, setSearch] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<any>(null);

    // Hard-ticket (printable QR) generation, per event
    const [qrEvent, setQrEvent] = useState<any | null>(null);
    const [qrQty, setQrQty] = useState<Record<string, number>>({});
    const [qrBusyTier, setQrBusyTier] = useState<string | null>(null);
    const [qrError, setQrError] = useState("");

    const handlePrintQr = async (tier: any) => {
        setQrBusyTier(tier.id);
        setQrError("");
        try {
            const qty = Math.max(1, Math.min(tier.remaining, qrQty[tier.id] || 1));
            const res = await ticketService.generateHardTickets(tier.id, qty);
            await ticketService.downloadHardSheet(res.ticket_ids);
            // Refresh events so the tier's remaining count reflects the new tickets,
            // and update the open modal with the fresh event data.
            const r = await api.get("/events/");
            const list = Array.isArray(r.data) ? r.data : r.data.results ?? [];
            setEvents(list);
            setQrEvent((prev: any) => list.find((ev: any) => ev.id === prev?.id) || prev);
        } catch (e: any) {
            setQrError(e.response?.data?.error || "Failed to generate hard tickets.");
        } finally {
            setQrBusyTier(null);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
            setUser(userData);
            await Promise.all([fetchEvents(), fetchCategories()]);
            setIsLoading(false);
        };
        init();
    }, [router]);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events/");
            setEvents(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (e) { console.error(e); }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/events/categories/");
            setCategories(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (e) { /* optional */ }
    };

    const handleStatusChange = async (eventId: string, newStatus: string) => {
        try {
            await api.patch(`/events/${eventId}/`, { status: newStatus });
            await fetchEvents();
        } catch { alert("Failed to update status."); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this event?")) return;
        try {
            await api.delete(`/events/${id}/`);
            await fetchEvents();
            if (selectedEvent?.id === id) { setSelectedEvent(null); setShowDetail(false); }
        } catch { alert("Failed to delete event."); }
    };

    const handleEdit = (event: any) => {
        setEventToEdit(event);
        setShowCreateModal(true);
    };

    const handleViewDetail = (event: any) => { setSelectedEvent(event); setShowDetail(true); };

    const filtered = events.filter(e => {
        const matchStatus = filterStatus ? e.status === filterStatus : true;
        const matchCat = filterCategory ? String(e.category) === filterCategory : true;
        const matchSearch = search
            ? e.title?.toLowerCase().includes(search.toLowerCase()) ||
            e.location?.toLowerCase().includes(search.toLowerCase())
            : true;
        return matchStatus && matchCat && matchSearch;
    });

    const stats = [
        { label: "Total Events", value: events.length, icon: Calendar, color: "#F39C12" },
        { label: "Published", value: events.filter(e => e.status === "PUBLISHED").length, icon: CheckCircle2, color: "#1e8a5e" },
        { label: "Ongoing", value: events.filter(e => e.status === "ONGOING").length, icon: TrendingUp, color: "#2563eb" },
        { label: "Draft", value: events.filter(e => e.status === "DRAFT").length, icon: Clock, color: "#9333ea" },
    ];

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Events...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100">
                <div>
                    <h1 className="text-lg font-bold text-gray-800 leading-tight uppercase tracking-tighter">Events Management</h1>
                    <p className="text-xs text-gray-400">Review and moderate platform events</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setEventToEdit(null); setShowCreateModal(true); }}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F39C12] text-[#08283B] rounded-xl text-xs font-bold uppercase transition-all hover:bg-[#D68910]"
                    >
                        <Plus className="w-4 h-4" /> Create Event
                    </button>
                    <button onClick={fetchEvents} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase transition-all">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0 underline-offset-4" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? "A"}
                    </div>
                </div>
            </header>

            <div className="flex-1 px-6 lg:px-10 py-8 space-y-6 max-w-7xl mx-auto w-full">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(s => (
                        <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + "18" }}>
                                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                </div>
                            </div>
                            <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">{s.label}</h4>
                            <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title or location..."
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#F39C12]/20 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#F39C12]/20"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Events Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Event</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <FilterX className="w-10 h-10 text-gray-200 mb-3" />
                                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No matching events found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(e => (
                                        <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 min-w-[280px]">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-14 rounded-xl bg-gray-100 overflow-hidden relative border border-gray-200 shadow-xs transition-transform group-hover:scale-105">
                                                        {e.cover_image ? (
                                                            <img src={getImageUrl(e.cover_image)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-[#08283B]">
                                                                <Calendar className="w-5 h-5 text-white/20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{e.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <MapPin className="w-3 h-3 text-gray-400" />
                                                            <span className="text-xs text-gray-400 font-medium">{e.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        {new Date(e.start_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Ticket className="w-3 h-3 text-gray-400" />
                                                        {e.tickets_sold} SOLD
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${STATUS_COLORS[e.status] || "bg-gray-100 text-gray-600"}`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/events/${e.id}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg transition-all hover:opacity-90"
                                                        style={{ background: "#08283B" }}
                                                    >
                                                        Manage <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => { setQrEvent(e); setQrError(""); }} title="Print QR codes for hard tickets" className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-900 hover:text-white transition-all border border-gray-200">
                                                        <QrCode className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleEdit(e)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-all border border-gray-200">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(e.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Event Details Overlay */}
            <AnimatePresence>
                {showDetail && selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                        >
                            <button onClick={() => setShowDetail(false)} className="absolute right-6 top-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-10">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="aspect-video w-full bg-gray-100 relative">
                                {selectedEvent.cover_image ? (
                                    <img src={getImageUrl(selectedEvent.cover_image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#08283B]">
                                        <Calendar className="w-16 h-16 text-white/10" />
                                    </div>
                                )}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${STATUS_COLORS[selectedEvent.status]}`}>
                                        {selectedEvent.status}
                                    </span>
                                    <h2 className="text-3xl font-bold text-white mt-3 drop-shadow-lg">{selectedEvent.title}</h2>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Date</p>
                                        <p className="font-bold text-gray-900">{new Date(selectedEvent.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Tickets</p>
                                        <p className="font-bold text-gray-900">{selectedEvent.tickets_sold} SOLD</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Company</p>
                                        <p className="font-bold text-gray-900 truncate">{selectedEvent.company_name || "Organized Platform"}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-3">About the Event</h4>
                                    <p className="text-gray-600 leading-relaxed text-sm font-medium">{selectedEvent.description || "No description provided."}</p>
                                </div>

                                <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {Object.keys(STATUS_COLORS).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusChange(selectedEvent.id, s)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedEvent.status === s ? "ring-2 ring-offset-2 ring-[#F39C12] bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => handleDelete(selectedEvent.id)} className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 font-bold text-xs uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                        <Trash2 className="w-4 h-4" /> Delete Event
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateEventModal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); setEventToEdit(null); fetchEvents(); }}
                onSuccess={() => { setShowCreateModal(false); setEventToEdit(null); fetchEvents(); }}
                eventToEdit={eventToEdit}
            />

            {/* Hard-ticket QR generation modal (per event) */}
            <AnimatePresence>
                {qrEvent && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => !qrBusyTier && setQrEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                            onClick={(ev) => ev.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <QrCode className="w-4 h-4 text-[#F39C12]" /> Print Hard-Ticket QR
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[380px]">{qrEvent.title}</p>
                                </div>
                                <button onClick={() => !qrBusyTier && setQrEvent(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 space-y-4">
                                {qrError && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs flex gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />{qrError}
                                    </div>
                                )}

                                {(!qrEvent.tickets || qrEvent.tickets.length === 0) ? (
                                    <div className="text-center py-8 text-sm text-gray-400 font-medium">
                                        This event has no ticket tiers yet. Add a ticket tier first.
                                    </div>
                                ) : (
                                    qrEvent.tickets.map((tier: any) => (
                                        <div key={tier.id} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-sm truncate">{tier.name}</p>
                                                <p className="text-xs text-gray-400">{tier.remaining} of {tier.quantity} remaining</p>
                                            </div>
                                            <input
                                                type="number" min={1} max={tier.remaining}
                                                value={qrQty[tier.id] ?? Math.min(50, tier.remaining || 1)}
                                                onChange={(e) => setQrQty(q => ({ ...q, [tier.id]: Math.max(1, Math.min(tier.remaining, Number(e.target.value) || 1)) }))}
                                                disabled={tier.remaining <= 0 || !!qrBusyTier}
                                                className="w-20 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-sm text-center focus:outline-hidden focus:ring-2 focus:ring-[#F39C12]/30 disabled:opacity-40"
                                            />
                                            <button
                                                onClick={() => handlePrintQr(tier)}
                                                disabled={tier.remaining <= 0 || !!qrBusyTier}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={tier.remaining <= 0 ? "No tickets remaining" : "Generate & download QR PDF"}
                                            >
                                                {qrBusyTier === tier.id
                                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> …</>
                                                    : <><Printer className="w-3.5 h-3.5" /> Print</>}
                                            </button>
                                        </div>
                                    ))
                                )}

                                <p className="text-[11px] text-gray-400 leading-relaxed pt-2">
                                    Each "Print" creates that many unique physical tickets (using the tier's capacity) and downloads a printable QR sheet to cut and attach.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
