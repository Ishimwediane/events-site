"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Calendar, MapPin, Tag, Plus, Trash2, Loader2, Ticket, ChevronDown, Building2 } from "lucide-react";
import { eventService } from "@/platform/services/event.service";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    eventToEdit?: any;
}

const inputClass =
    "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-hidden focus:border-gray-400 transition-all bg-white";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

// Minimal rich-text toolbar
const TOOLBAR_ACTIONS = [
    { label: "B", cmd: "bold", style: "font-bold" },
    { label: "I", cmd: "italic", style: "italic" },
    { label: "U", cmd: "underline", style: "underline" },
    { label: "S", cmd: "strikeThrough", style: "line-through" },
];

const ALIGN_ACTIONS = [
    { label: "≡", cmd: "justifyLeft" },
    { label: "≡", cmd: "justifyCenter" },
    { label: "≡", cmd: "justifyRight" },
    { label: "≡", cmd: "justifyFull" },
];

const LIST_ACTIONS = [
    { label: "•≡", cmd: "insertUnorderedList" },
    { label: "1.", cmd: "insertOrderedList" },
];

export default function CreateEventModal({ isOpen, onClose, onSuccess, eventToEdit }: CreateEventModalProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const editorRef = useRef<HTMLDivElement>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>({
        title: "",
        location: "",
        start_date: "",
        end_date: "",
        category: "",
        organizer: "",
        ticket_types: [{ name: "General Admission", price: "", capacity: "" }],
    });
    const [flyer, setFlyer] = useState<File | null>(null);
    const [venueLogo, setVenueLogo] = useState<File | null>(null);
    const [ticketTemplates, setTicketTemplates] = useState<{ [key: number]: File }>({});

    const [newCategoryName, setNewCategoryName] = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const user = authService.getUserFromStorage();
            if (user?.role === "ADMIN") {
                setIsAdmin(true);
                fetchCompanies();
            }
            refreshCategories();

            if (eventToEdit) {
                // IMPORTANT: The backend serializer nests tiers under 'tickets', not 'ticket_types'
                const existingTiers = eventToEdit.tickets || eventToEdit.ticket_types || [];
                setFormData({
                    title: eventToEdit.title || "",
                    location: eventToEdit.location || "",
                    start_date: eventToEdit.start_date ? eventToEdit.start_date.substring(0, 16) : "",
                    end_date: eventToEdit.end_date ? eventToEdit.end_date.substring(0, 16) : "",
                    category: eventToEdit.category || "",
                    organizer: eventToEdit.organizer || "",
                    ticket_types: existingTiers.length > 0
                        ? existingTiers.map((t: any) => ({
                            id: t.id,
                            name: t.name,
                            price: t.price,
                            capacity: t.quantity || t.capacity || "" // Backend uses 'quantity'
                        }))
                        : [{ name: "General Admission", price: "", capacity: "" }],
                });
                if (editorRef.current) {
                    editorRef.current.innerHTML = eventToEdit.description || "";
                }
            } else {
                setFormData({
                    title: "",
                    location: "",
                    start_date: "",
                    end_date: "",
                    category: "",
                    organizer: "",
                    ticket_types: [{ name: "General Admission", price: "", capacity: "" }],
                });
                if (editorRef.current) {
                    editorRef.current.innerHTML = "";
                }
                setTicketTemplates({});
            }
        }
    }, [isOpen, eventToEdit]);

    const fetchCompanies = async () => {
        try {
            const res = await api.get("/companies/list/");
            setCompanies(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch companies", err);
        }
    };

    const refreshCategories = async () => {
        try {
            const data = await eventService.getCategories();
            const cats = data.results || data;
            setCategories(cats);
            if (cats[0]?.id && !formData.category) {
                setFormData((p: any) => ({ ...p, category: cats[0].id }));
            }
        } catch (err) { }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const cat = await eventService.createCategory(newCategoryName);
            setNewCategoryName("");
            setIsAddingCategory(false);
            await refreshCategories();
            setFormData((p: any) => ({ ...p, category: cat.id }));
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.name?.[0] || "Failed to create category");
        }
    };

    const exec = (cmd: string) => { document.execCommand(cmd, false); editorRef.current?.focus(); };

    const handleAddTicket = () =>
        setFormData((p: any) => ({ ...p, ticket_types: [...p.ticket_types, { name: "", price: "", capacity: "" }] }));

    const handleRemoveTicket = (i: number) => {
        setFormData((p: any) => ({ ...p, ticket_types: p.ticket_types.filter((_: any, idx: number) => idx !== i) }));
        // Clean up template mapping
        const newTemplates = { ...ticketTemplates };
        delete newTemplates[i];
        setTicketTemplates(newTemplates);
    };

    const handleTicketChange = (i: number, field: string, value: string) => {
        const updated = [...formData.ticket_types] as any;
        updated[i][field] = value;
        setFormData((p: any) => ({ ...p, ticket_types: updated }));
    };

    // Cloudinary's free plan caps image uploads at 10 MB. Reject oversized files up front
    // with a clear message instead of letting the upload fail server-side.
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    const validateImage = (file: File | null): boolean => {
        if (file && file.size > MAX_IMAGE_BYTES) {
            setError(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Images must be under 10 MB — please compress or resize it.`);
            return false;
        }
        setError("");
        return true;
    };

    const handleTemplateUpload = (i: number, file: File | null) => {
        if (file && validateImage(file)) {
            setTicketTemplates(p => ({ ...p, [i]: file }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("location", formData.location);
            data.append("start_date", formData.start_date);
            data.append("end_date", formData.end_date);
            data.append("category", formData.category);
            if (formData.organizer) {
                data.append("organizer", formData.organizer);
            }
            data.append("description", editorRef.current?.innerHTML || "");
            data.append("ticket_types", JSON.stringify(formData.ticket_types));

            if (flyer) data.append("flyer", flyer);
            if (venueLogo) data.append("venue_logo", venueLogo);

            // Append per-tier templates
            Object.entries(ticketTemplates).forEach(([idx, file]) => {
                data.append(`ticket_template_${idx}`, file);
            });

            if (eventToEdit) {
                await eventService.updateEvent(eventToEdit.id, data);
            } else {
                await eventService.createEvent(data);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            const resData = err.response?.data;
            let message = "Failed to create event. Please check your data.";
            if (typeof resData === "string") {
                message = resData;
            } else if (resData?.error || resData?.detail) {
                message = resData.error || resData.detail;
            } else if (resData && typeof resData === "object") {
                // Surface DRF field errors, e.g. { description: ["This field may not be blank."] }
                const firstField = Object.keys(resData)[0];
                const firstError = Array.isArray(resData[firstField]) ? resData[firstField][0] : resData[firstField];
                if (firstField && firstError) message = `${firstField}: ${firstError}`;
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100">
                        <h2 className="text-base font-bold uppercase tracking-widest text-gray-900">
                            {eventToEdit ? "Edit Event" : "Add New Event"}
                        </h2>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-lg text-sm">{error}</div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Event Flyer</label>
                                <div className="relative group cursor-pointer border border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-amber-400 transition-all min-h-[70px] flex items-center justify-center">
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => { const f = e.target.files?.[0] || null; if (validateImage(f)) setFlyer(f); }} />
                                    {flyer ? (
                                        <div className="text-[10px] font-bold text-amber-600 truncate">{flyer.name}</div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 leading-tight">Select Flyer</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Venue Logo</label>
                                <div className="relative group cursor-pointer border border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-amber-400 transition-all min-h-[70px] flex items-center justify-center">
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => { const f = e.target.files?.[0] || null; if (validateImage(f)) setVenueLogo(f); }} />
                                    {venueLogo ? (
                                        <div className="text-[10px] font-bold text-amber-600 truncate">{venueLogo.name}</div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 leading-tight">Select Logo</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Organizer Selection (Admin only) */}
                        {isAdmin && (
                            <div>
                                <label className={labelClass}>Organizer (Host Company)</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <select
                                        required
                                        className={inputClass + " pl-9 appearance-none cursor-pointer border-amber-200 bg-amber-50/10"}
                                        value={formData.organizer}
                                        onChange={e => setFormData((p: any) => ({ ...p, organizer: e.target.value }))}
                                    >
                                        <option value="">Select Company Organizer</option>
                                        {companies.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                </div>
                                <p className="text-[10px] text-amber-600 mt-1 font-bold uppercase tracking-wider">Required for Admin event creation</p>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className={labelClass}>Title</label>
                            <input
                                required type="text" placeholder="E.g. Annual Tech Summit 2026"
                                className={inputClass}
                                value={formData.title}
                                onChange={e => setFormData((p: any) => ({ ...p, title: e.target.value }))}
                            />
                        </div>

                        {/* Start + End Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Start Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <input
                                        required type="datetime-local"
                                        className={inputClass + " pl-9 pr-8"}
                                        value={formData.start_date}
                                        onChange={e => setFormData((p: any) => ({ ...p, start_date: e.target.value }))}
                                    />
                                    {formData.start_date && (
                                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                            onClick={() => setFormData((p: any) => ({ ...p, start_date: "" }))}>
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>End Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <input
                                        required type="datetime-local"
                                        className={inputClass + " pl-9 pr-8"}
                                        value={formData.end_date}
                                        onChange={e => setFormData((p: any) => ({ ...p, end_date: e.target.value }))}
                                    />
                                    {formData.end_date && (
                                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                            onClick={() => setFormData((p: any) => ({ ...p, end_date: "" }))}>
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location + Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <input
                                        required type="text" placeholder="Venue or Online"
                                        className={inputClass + " pl-9"}
                                        value={formData.location}
                                        onChange={e => setFormData((p: any) => ({ ...p, location: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Category</label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                        <select className={inputClass + " pl-9 appearance-none cursor-pointer"}
                                            value={formData.category}
                                            onChange={e => setFormData((p: any) => ({ ...p, category: e.target.value }))}>
                                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    </div>
                                    {!isAddingCategory ? (
                                        <button type="button" onClick={() => setIsAddingCategory(true)}
                                            className="text-[10px] font-bold text-amber-600 hover:underline px-1">+ Add New Category</button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="New category name"
                                                className="flex-1 text-xs border border-gray-200 rounded-sm px-2 py-1 focus:outline-hidden"
                                                value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                                            <button type="button" onClick={handleAddCategory}
                                                className="px-2 py-1 bg-amber-600 text-white text-[10px] rounded-sm font-bold uppercase">Add</button>
                                            <button type="button" onClick={() => setIsAddingCategory(false)}
                                                className="px-2 py-1 bg-gray-100 text-gray-400 text-[10px] rounded-sm font-bold uppercase">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description — rich text */}
                        <div>
                            <label className={labelClass}>Description</label>
                            <div className="border border-gray-200 rounded-sm overflow-hidden">
                                {/* Toolbar */}
                                <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-gray-100 bg-gray-50">
                                    {TOOLBAR_ACTIONS.map(({ label, cmd, style }) => (
                                        <button key={cmd} type="button"
                                            onMouseDown={e => { e.preventDefault(); exec(cmd); }}
                                            className={`w-7 h-7 rounded-sm text-xs text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center ${style}`}>
                                            {label}
                                        </button>
                                    ))}
                                    <div className="w-px h-5 bg-gray-200 mx-1" />
                                    {ALIGN_ACTIONS.map(({ label, cmd }, i) => (
                                        <button key={cmd + i} type="button"
                                            onMouseDown={e => { e.preventDefault(); exec(cmd); }}
                                            className="w-7 h-7 rounded-sm text-xs text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center">
                                            {label}
                                        </button>
                                    ))}
                                    <div className="w-px h-5 bg-gray-200 mx-1" />
                                    <button type="button"
                                        onMouseDown={e => { e.preventDefault(); exec("formatBlock"); }}
                                        className="w-7 h-7 rounded-sm text-xs text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center">
                                        "
                                    </button>
                                    {LIST_ACTIONS.map(({ label, cmd }) => (
                                        <button key={cmd} type="button"
                                            onMouseDown={e => { e.preventDefault(); exec(cmd); }}
                                            className="w-7 h-7 rounded-sm text-xs text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center">
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {/* Editable area */}
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    className="min-h-[130px] px-4 py-3 text-sm text-gray-700 focus:outline-hidden"
                                    data-placeholder="Write your event description here..."
                                    style={{ lineHeight: "1.65" }}
                                />
                            </div>
                        </div>

                        {/* Ticket Types */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className={labelClass + " mb-0"}>
                                    <Ticket className="w-4 h-4 inline mr-1.5" style={{ color: "#F39C12" }} />
                                    Ticket Types
                                </label>
                                <button type="button" onClick={handleAddTicket}
                                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-amber-300 transition-all"
                                    style={{ color: "#F39C12" }}>
                                    <Plus className="w-3.5 h-3.5" /> Add Tier
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.ticket_types.map((ticket: any, i: number) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                                        <div className="col-span-4">
                                            <input required placeholder="E.g. VIP"
                                                className="w-full border border-gray-200 rounded-sm px-2.5 py-1.5 text-[11px] text-gray-700 focus:outline-hidden focus:border-gray-400 bg-white"
                                                value={ticket.name}
                                                onChange={e => handleTicketChange(i, "name", e.target.value)} />
                                        </div>
                                        <div className="col-span-2">
                                            <input required type="number" placeholder="Price"
                                                className="w-full border border-gray-200 rounded-sm px-2.5 py-1.5 text-[11px] text-gray-700 focus:outline-hidden focus:border-gray-400 bg-white"
                                                value={ticket.price}
                                                onChange={e => handleTicketChange(i, "price", e.target.value)} />
                                        </div>
                                        <div className="col-span-2">
                                            <input required type="number" placeholder="Qty"
                                                className="w-full border border-gray-200 rounded-sm px-2.5 py-1.5 text-[11px] text-gray-700 focus:outline-hidden focus:border-gray-400 bg-white"
                                                value={ticket.capacity}
                                                onChange={e => handleTicketChange(i, "capacity", e.target.value)} />
                                        </div>
                                        <div className="col-span-3">
                                            <div className="relative group overflow-hidden border border-dashed border-gray-300 rounded-sm px-2 py-1.5 bg-white hover:border-amber-400 transition-all">
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleTemplateUpload(i, e.target.files?.[0] || null)} />
                                                <div className="text-[9px] font-bold text-gray-400 truncate flex items-center gap-1">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {ticketTemplates[i] ? <span className="text-amber-600">{ticketTemplates[i].name}</span> : "Ticket Design"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button type="button" disabled={formData.ticket_types.length === 1}
                                                onClick={() => handleRemoveTicket(i)}
                                                className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 border-t border-gray-100">
                            <button type="button" onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                                style={{ background: "#F39C12", color: "#08283B" }}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (eventToEdit ? "Save Changes" : "Create Event")}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
