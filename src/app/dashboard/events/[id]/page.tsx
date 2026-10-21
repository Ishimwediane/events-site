"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, Calendar, MapPin, Loader2, Ticket, TrendingUp,
    Users, Settings, Pencil, Trash2, X, Plus, DollarSign, Bell, Image as ImageIcon, Check, Search, Filter, Mail, QrCode
} from "lucide-react";
import { eventService } from "@/platform/services/event.service";
import { authService } from "@/platform/services/auth.service";
import { ticketService } from "@/platform/services/ticket.service";
import { getImageUrl } from "@/platform/lib/images";
import { useRef } from "react";
import { api, API_URL } from "@/platform/lib/api";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    DRAFT: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
    PUBLISHED: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
    ONGOING: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    FINISHED: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export default function EventManagementPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [attendees, setAttendees] = useState<any[]>([]);
    const [attendeeSearch, setAttendeeSearch] = useState("");
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [resendingTicketId, setResendingTicketId] = useState<string | null>(null);
    const [editedEmail, setEditedEmail] = useState("");
    const [resendStatus, setResendStatus] = useState<"IDLE" | "LOADING" | "DONE" | "ERROR">("IDLE");
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<any>(null);
    const [ticketFormData, setTicketFormData] = useState({ name: "", price: "", quantity: "", sale_start: "", sale_end: "", ticket_template: null as File | null });
    const [ticketSaving, setTicketSaving] = useState(false);
    const [canUseQr, setCanUseQr] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // The attendee list shows only paying customers; hard (physical) tickets are
    // excluded by the backend, but filter defensively here too.
    const payingAttendees = attendees.filter(a => !a.is_hard);
    const totalAttendees = payingAttendees.length;

    const filteredAttendees = payingAttendees.filter((att) => {
        if (attendeeSearch.trim() !== "") {
            const query = attendeeSearch.toLowerCase();
            const name = (att.customer_name || "").toLowerCase();
            const email = (att.customer_email || "").toLowerCase();
            const code = (att.ticket_code || "").toLowerCase();
            const tier = (att.ticket_type_name || "").toLowerCase();
            return name.includes(query) || email.includes(query) || code.includes(query) || tier.includes(query);
        }
        return true;
    });

    const fetchEvent = async () => {
        if (!params.id) return;
        try {
            const data = await eventService.getEventDetails(params.id as string);
            setEvent(data);
        } catch (err) { console.error("Failed to load event:", err); }
    };

    const fetchAttendees = async () => {
        if (!params.id) return;
        try {
            const data = await ticketService.getEventAttendees(params.id as string);
            setAttendees(data.results || data);
        } catch (err) { console.error("Failed to load attendees:", err); }
    };

    const handleAttendeeEmailResend = async (ticket: any, customEmail?: string) => {
        setResendingTicketId(ticket.id);
        setResendStatus("LOADING");
        try {
            await ticketService.resendTicketEmail(ticket.ticket_code, customEmail);
            setResendStatus("DONE");
            await fetchAttendees();
            if (selectedTicket && selectedTicket.id === ticket.id) {
                setSelectedTicket({
                    ...selectedTicket,
                    email_sent: true,
                    email_sent_at: new Date().toISOString(),
                    customer_email: customEmail || selectedTicket.customer_email
                });
            }
        } catch (err: any) {
            console.error("Failed to resend ticket email:", err);
            setResendStatus("ERROR");
            const backendError = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "Failed to resend ticket email.";
            alert(`Resend Failed: ${backendError}`);
        } finally {
            setResendingTicketId(null);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            setUser(userData);

            await fetchEvent();
            setIsLoading(false);
        };
        init();
    }, [params.id]);

    useEffect(() => {
        if (activeTab === "attendees") fetchAttendees();
    }, [activeTab]);

    const handleOpenTicketModal = (ticket: any = null) => {
        if (ticket) {
            setEditingTicket(ticket);
            setTicketFormData({
                name: ticket.name, price: ticket.price, quantity: ticket.quantity,
                sale_start: ticket.sale_start ? new Date(ticket.sale_start).toISOString().slice(0, 16) : "",
                sale_end: ticket.sale_end ? new Date(ticket.sale_end).toISOString().slice(0, 16) : "",
                ticket_template: null,
            });
        } else {
            setEditingTicket(null);
            setTicketFormData({ name: "", price: "", quantity: "", sale_start: new Date().toISOString().slice(0, 16), sale_end: event?.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "", ticket_template: null });
        }
        setIsTicketModalOpen(true);
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", ticketFormData.name);
            formData.append("price", ticketFormData.price);
            formData.append("quantity", ticketFormData.quantity);
            formData.append("remaining", ticketFormData.quantity);
            formData.append("sale_start", ticketFormData.sale_start);
            formData.append("sale_end", ticketFormData.sale_end);
            formData.append("event", event.id);
            if (ticketFormData.ticket_template) {
                formData.append("ticket_template", ticketFormData.ticket_template);
            }

            if (editingTicket) { await ticketService.updateTicketType(editingTicket.id, formData); }
            else { await ticketService.createTicketType(formData); }
            await fetchEvent();
            setIsTicketModalOpen(false);
        } catch (err: any) {
            const d = err.response?.data;
            let msg = "Failed to save ticket tier.";
            if (typeof d === "string") msg = d;
            else if (Array.isArray(d)) msg = d[0];
            else if (d?.detail) msg = d.detail;
            else if (d && typeof d === "object") {
                const k = Object.keys(d)[0];
                const v = Array.isArray(d[k]) ? d[k][0] : d[k];
                if (k && v) msg = `${k}: ${v}`;
            }
            alert(msg);
        } finally { setTicketSaving(false); }
    };

    const handleDeleteTicket = async (id: string) => {
        if (!confirm("Delete this ticket tier?")) return;
        try { await ticketService.deleteTicketType(id); await fetchEvent(); }
        catch (err: any) { alert(err.response?.data?.detail || "Failed to delete ticket tier."); }
    };

    const handleStatusChange = async (newStatus: string) => {
        try { await eventService.updateEvent(event.id, { status: newStatus }); await fetchEvent(); }
        catch { alert("Failed to update event status."); }
    };

    const handleDeleteEvent = async () => {
        if (!confirm("Are you SURE you want to delete this event? This action cannot be undone.")) return;
        try { await eventService.deleteEvent(event.id); router.push("/dashboard/events"); }
        catch { alert("Failed to delete event."); }
    };

    if (isLoading) return (
        <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Event…</span>
            </div>
        </div>
    );

    if (!event) return (
        <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-700 mb-3">Event Not Found</h2>
                <button onClick={() => router.push("/dashboard/events")} className="text-amber-600 hover:underline font-semibold text-sm">← Return to Events</button>
            </div>
        </div>
    );

    const statusConf = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.DRAFT;
    // Money counts ONLY paying (online) buyers. Hard tickets are physical and
    // tracked separately as a register, not as revenue.
    const totalPaid = event.tickets?.reduce((acc: number, t: any) => acc + (t.paid_count || 0), 0) || 0;
    const totalHard = event.tickets?.reduce((acc: number, t: any) => acc + (t.hard_count || 0), 0) || 0;
    const totalCapacity = event.tickets?.reduce((acc: number, t: any) => acc + t.quantity, 0) || 0;
    // Money = online (paid) tickets only. Hard tickets are printed physical stock
    // that isn't sold yet, so they are NOT counted as revenue — just inventory.
    const onlineRevenue = event.tickets?.reduce((acc: number, t: any) => acc + ((t.paid_count || 0) * Number(t.price)), 0) || 0;

    const tabs = [
        { id: "overview", label: "Overview", icon: TrendingUp },
        { id: "tickets", label: "Tickets", icon: Ticket },
        { id: "attendees", label: "Attendees", icon: Users },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="flex flex-col flex-1 min-h-screen" style={{ background: "#f4f5f7" }}>
            {/* ── Topbar ── */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-8 py-3.5 bg-white border-b border-gray-100">
                <button
                    onClick={() => router.push("/dashboard/events")}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Events
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-black" style={{ background: "#F39C12" }}>
                            {user?.first_name?.[0] ?? "U"}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{user?.first_name} {user?.last_name}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Hero Banner ── */}
            <div className="relative h-52 bg-[#08283B] overflow-hidden shrink-0">
                {event.flyer && (
                    <img src={getImageUrl(event.flyer)} alt="Flyer" className="absolute inset-0 w-full h-full object-cover opacity-25" />
                )}
                <div className="absolute inset-0 bg-linear-to-r from-[#08283B] via-[#08283B]/80 to-transparent" />
                <div className="absolute inset-0 flex items-end px-8 lg:px-10 pb-7 gap-5">
                    {event.venue_logo && (
                        <img src={getImageUrl(event.venue_logo)} alt="Logo" className="w-16 h-16 rounded-2xl bg-white p-1 object-contain shadow-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConf.bg} ${statusConf.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                                {event.status}
                            </span>
                            {event.category_name && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/60 bg-white/10 border border-white/10">
                                    {event.category_name}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight truncate">{event.title}</h1>
                        <div className="flex items-center gap-5 mt-2 text-white/60 text-xs font-semibold flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(event.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </span>
                            {event.location && (
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.location}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 px-6 lg:px-10 py-6">

                {/* ── Tab Nav ── */}
                <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${isActive
                                    ? "border-amber-500 text-gray-900"
                                    : "border-transparent text-gray-400 hover:text-gray-700"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "text-amber-500" : ""}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Tab Content ── */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

                    {/* OVERVIEW */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: "Online Revenue", value: `${onlineRevenue.toLocaleString()} RWF`, sub: "Online sales only", icon: DollarSign, color: "#22c55e", colorBg: "#f0fdf4" },
                                    { label: "Paid Tickets", value: `${totalPaid} / ${totalCapacity}`, sub: "Sold online", icon: Ticket, color: "#F39C12", colorBg: "#fffbeb" },
                                    { label: "Hard Tickets Printed", value: String(totalHard), sub: "Physical stock — not yet sold", icon: Users, color: "#3b82f6", colorBg: "#eff6ff" },
                                ].map((s) => (
                                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                                        <div className="flex items-start justify-between mb-4">
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.colorBg }}>
                                                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">{s.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {event.description && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">About this Event</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                                </div>
                            )}

                            {event.tickets && event.tickets.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Ticket Tier Breakdown</h3>
                                    <div className="space-y-4">
                                        {event.tickets.map((t: any, i: number) => {
                                            const sold = (t.paid_count || 0) + (t.hard_count || 0);
                                            const pct = t.quantity > 0 ? (sold / t.quantity) * 100 : 0;
                                            return (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                                                        <span className="text-gray-800">{t.name}</span>
                                                        <span className="text-gray-400">{sold} / {t.quantity}</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#F39C12" }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TICKETS */}
                    {activeTab === "tickets" && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Ticket Tiers</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{event.tickets?.length || 0} tier{event.tickets?.length !== 1 ? "s" : ""} configured</p>
                                </div>
                                <button
                                    onClick={() => handleOpenTicketModal()}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all text-black"
                                    style={{ background: "#F39C12" }}
                                >
                                    <Plus className="w-4 h-4" /> Add Tier
                                </button>
                            </div>
                            {event.tickets?.some((t: any) => t.ticket_template) && (
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Custom Ticket Designs</h4>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {event.tickets.filter((t: any) => t.ticket_template).map((t: any, idx: number) => (
                                            <div key={idx} className="shrink-0 group relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenTicketModal(t)}>
                                                <div className="w-48 h-24 relative bg-gray-100">
                                                    <img src={getImageUrl(t.ticket_template)} alt={t.name} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Pencil className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-xs font-bold text-gray-900 truncate">{t.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-semibold">{Number(t.price) === 0 ? "Free" : `${Number(t.price).toLocaleString()} RWF`}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/60 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</th>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Price</th>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Capacity</th>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {event.tickets?.map((ticket: any, idx: number) => {
                                            const sold = (ticket.paid_count || 0) + (ticket.hard_count || 0);
                                            const pct = ticket.quantity > 0 ? (sold / ticket.quantity) * 100 : 0;
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{ticket.name}</td>
                                                    <td className="px-6 py-4 font-bold" style={{ color: "#F39C12" }}>
                                                        {Number(ticket.price) === 0 ? "Free" : `${Number(ticket.price).toLocaleString()} RWF`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-semibold text-gray-700 w-14 shrink-0">{sold}/{ticket.quantity}</span>
                                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#F39C12" }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {ticket.remaining > 0
                                                            ? <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-lg">Available</span>
                                                            : <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded-lg">Sold Out</span>
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => handleOpenTicketModal(ticket)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteTicket(ticket.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!event.tickets || event.tickets.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center">
                                                    <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                    <p className="text-gray-400 font-bold text-sm">No ticket tiers yet</p>
                                                    <p className="text-gray-300 text-xs mt-1">Click "Add Tier" to create your first ticket type</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ATTENDEES */}
                    {activeTab === "attendees" && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden animate-in fade-in duration-200">
                            <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Attendees List</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{totalAttendees} registered in total</p>
                                </div>
                            </div>

                            {/* Search Toolbar */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-end">
                                <div className="relative w-full md:w-80">
                                    <input
                                        type="text"
                                        placeholder="Search name, email, ticket code..."
                                        value={attendeeSearch}
                                        onChange={(e) => setAttendeeSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white placeholder:text-gray-400 text-gray-700"
                                    />
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            {filteredAttendees.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50/60 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Attendee</th>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ticket Tier</th>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</th>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ticket Code</th>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Status</th>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Purchase Date</th>
                                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredAttendees.map((att) => (
                                                <tr key={att.id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                                                                {att.customer_name?.[0] ?? "?"}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{att.customer_name}</p>
                                                                <p className="text-xs text-gray-400">{att.customer_email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-gray-600 text-sm">{att.ticket_type_name}</td>
                                                    <td className="px-6 py-4">
                                                        {att.is_hard ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 font-sans">
                                                                Physical (Hard)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100 font-sans">
                                                                Online (Digital)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <code className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-mono font-bold">{att.ticket_code}</code>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {att.is_hard ? (
                                                            <span className="text-gray-400 text-xs font-semibold">—</span>
                                                        ) : att.email_sent ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100" title={att.email_sent_at ? `Sent at: ${new Date(att.email_sent_at).toLocaleString()}` : ''}>
                                                                <Check className="w-3 h-3" /> Sent
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">
                                                                <X className="w-3 h-3" /> Unsent
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">{new Date(att.purchase_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTicket(att);
                                                                    setEditedEmail(att.customer_email || '');
                                                                    setResendStatus("IDLE");
                                                                }}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#08283B] hover:bg-gray-100 transition-colors"
                                                                title="View Ticket & QR Code"
                                                            >
                                                                <QrCode className="w-4 h-4" />
                                                            </button>
                                                            {!att.is_hard && (
                                                                <button
                                                                    onClick={() => handleAttendeeEmailResend(att)}
                                                                    disabled={resendingTicketId === att.id}
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                                                                    title="Resend ticket email"
                                                                >
                                                                    {resendingTicketId === att.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <Mail className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-700 mb-1">No attendees match your criteria</h3>
                                    <p className="text-sm text-gray-400 max-w-xs">Try clearing your filters or search query to see all attendees.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Event Status</h3>
                                <p className="text-xs text-gray-400 mb-4">Change the visibility and state of this event.</p>
                                <div className="space-y-2">
                                    {[
                                        { value: "DRAFT", label: "Draft", desc: "Hidden from public" },
                                        { value: "PUBLISHED", label: "Published", desc: "Visible and selling" },
                                        { value: "ONGOING", label: "Ongoing", desc: "Happening right now" },
                                        { value: "FINISHED", label: "Finished", desc: "Event has concluded" },
                                        { value: "CANCELLED", label: "Cancelled", desc: "Will not happen" },
                                    ].map((opt) => {
                                        const conf = STATUS_CONFIG[opt.value] ?? STATUS_CONFIG.DRAFT;
                                        const isActive = event.status === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleStatusChange(opt.value)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${isActive ? "border-amber-400 bg-amber-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                                                    {opt.label}
                                                </span>
                                                <span className="text-xs text-gray-400 font-normal">{opt.desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-red-100 shadow-xs p-6 lg:col-span-2">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Danger Zone</h3>
                                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                    Permanently delete this event and all data. This action <strong>cannot be reversed</strong>.
                                </p>
                                <button
                                    onClick={handleDeleteEvent}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-sm rounded-xl transition-all border border-red-200"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete Event
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Ticket Modal ── */}
            {isTicketModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTicketModalOpen(false)} />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">{editingTicket ? "Edit Ticket Tier" : "New Ticket Tier"}</h3>
                            <button onClick={() => setIsTicketModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Tier Name</label>
                                <input required placeholder="e.g. VIP, Early Bird" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-colors"
                                    value={ticketFormData.name} onChange={e => setTicketFormData({ ...ticketFormData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Price ($)</label>
                                    <input required type="number" step="0.01" min="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-colors"
                                        value={ticketFormData.price} onChange={e => setTicketFormData({ ...ticketFormData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Quantity</label>
                                    <input required type="number" min="1" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-colors"
                                        value={ticketFormData.quantity} onChange={e => setTicketFormData({ ...ticketFormData, quantity: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Sale Start</label>
                                    <input required type="datetime-local" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-colors"
                                        value={ticketFormData.sale_start} onChange={e => setTicketFormData({ ...ticketFormData, sale_start: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Sale End</label>
                                    <input required type="datetime-local" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-colors"
                                        value={ticketFormData.sale_end} onChange={e => setTicketFormData({ ...ticketFormData, sale_end: e.target.value })} />
                                </div>
                            </div>

                            {/* Ticket Template Upload */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 flex items-center justify-between">
                                    <span>Ticket Design Template (Image)</span>
                                    {ticketFormData.ticket_template && <span className="text-green-500 flex items-center gap-1 text-[9px]"><Check className="w-3 h-3" /> Selected</span>}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setTicketFormData({ ...ticketFormData, ticket_template: e.target.files[0] });
                                        }
                                    }}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${ticketFormData.ticket_template ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 hover:border-amber-400 hover:bg-gray-50'}`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className={`p-2 rounded-full ${ticketFormData.ticket_template ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            {ticketFormData.ticket_template ? (
                                                <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">{ticketFormData.ticket_template.name}</p>
                                            ) : editingTicket?.ticket_template ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={getImageUrl(editingTicket.ticket_template)} alt="Current design" className="h-10 rounded-sm shadow-xs mb-1 object-cover" />
                                                    <p className="text-[10px] font-semibold text-gray-500">Click to change design</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-gray-500">Click to upload ticket design</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={ticketSaving}
                                className="w-full py-3.5 text-black font-bold uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                                style={{ background: "#F39C12" }}
                            >
                                {ticketSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingTicket ? "Update Tier" : "Create Tier")}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* ── Ticket Details / QR Code Modal ── */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100" style={{ background: "#08283B" }}>
                            <div>
                                <h3 className="text-base font-bold text-white">Ticket Details</h3>
                                <p className="text-xs text-white/60 font-mono mt-0.5">{selectedTicket.ticket_code}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Attendee Info Card */}
                            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                                    {selectedTicket.customer_name?.[0] ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm">{selectedTicket.customer_name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{selectedTicket.ticket_type_name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">
                                        Type: {selectedTicket.is_hard ? 'Physical (Hard Ticket)' : 'Digital (Online Ticket)'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                                {/* Platform QR Code */}
                                <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Scanner Entry QR</p>
                                    <div className="w-40 h-40 relative bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                                        <img
                                            src={`${API_URL}/tickets/list/qr/?code=${encodeURIComponent(selectedTicket.ticket_code)}`}
                                            alt="Ticket QR Code"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-gray-500 mt-3">{selectedTicket.ticket_code}</span>
                                </div>

                                {/* Email & Actions Card */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Email Delivery Status</label>
                                        {selectedTicket.is_hard ? (
                                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500">
                                                — N/A for Physical Ticket
                                            </div>
                                        ) : selectedTicket.email_sent ? (
                                            <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-bold flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Delivered Successfully</span>
                                                {selectedTicket.email_sent_at && (
                                                    <span className="text-[9px] text-green-500 font-semibold mt-1">
                                                        Sent: {new Date(selectedTicket.email_sent_at).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                                <X className="w-3.5 h-3.5" /> Email Delivery Failed / Unsent
                                            </div>
                                        )}
                                    </div>

                                    {!selectedTicket.is_hard && (
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Recipient Email Address</label>
                                                <input 
                                                    type="email" 
                                                    value={editedEmail} 
                                                    onChange={e => { setEditedEmail(e.target.value); setResendStatus("IDLE"); }}
                                                    placeholder="Correct typo if needed..."
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800"
                                                />
                                            </div>
                                            
                                            <button
                                                onClick={() => handleAttendeeEmailResend(selectedTicket, editedEmail)}
                                                disabled={resendingTicketId === selectedTicket.id || !editedEmail.trim()}
                                                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                                style={{ background: "#08283B" }}
                                            >
                                                {resendingTicketId === selectedTicket.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : resendStatus === "DONE" ? (
                                                    <><Check className="w-4 h-4" /> Sent!</>
                                                ) : (
                                                    <><Mail className="w-4 h-4" /> Resend Ticket Email</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
