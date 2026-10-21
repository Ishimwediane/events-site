"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Plus, Trash2, X, CheckCircle2, Activity,
    Vote, Layers, Users, CreditCard, ArrowLeft,
    ShieldCheck, Bell, Edit, Eye, TrendingUp, Star, History, Trophy, MoreVertical
} from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import { getImageUrl } from "@/platform/lib/images";

type ViewMode = "campaigns" | "manage" | "transactions";

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-green-100 text-green-700",
    ONGOING: "bg-amber-100 text-amber-700",
    CANCELLED: "bg-red-100 text-red-600",
    COMPLETED: "bg-blue-100 text-blue-700",
};

export default function AdminVotingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("campaigns");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
            setUser(userData);
            await Promise.all([fetchCampaigns(), fetchCompanies()]);
            setIsLoading(false);
        };
        init();
    }, [router]);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get("/voting/campaigns/admin_all/");
            setCampaigns(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (e) { console.error("Failed to fetch campaigns", e); }
    };

    const fetchCompanies = async () => {
        try {
            const res = await api.get("/companies/list/");
            setCompanies(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (e) { /* optional */ }
    };

    const fetchCampaignDetail = async (id: string) => {
        try {
            const res = await api.get(`/voting/campaigns/${id}/`);
            setSelectedCampaign(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get("/voting/vote-transactions/");
            setTransactions(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (e) { console.error("Failed to fetch transactions", e); }
    };

    const handleSelectCampaign = async (campaign: any) => {
        await fetchCampaignDetail(campaign.id);
        setViewMode("manage");
    };

    const handleViewTransactions = async () => {
        await fetchTransactions();
        setViewMode("transactions");
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm("Delete this campaign and all related data?")) return;
        try {
            await api.delete(`/voting/campaigns/${id}/`);
            await fetchCampaigns();
        } catch (e) { alert("Failed to delete campaign."); }
    };

    const handleStatusChange = async (campaignId: string, newStatus: string) => {
        try {
            await api.patch(`/voting/campaigns/${campaignId}/`, { status: newStatus });
            await fetchCampaigns();
            if (selectedCampaign?.id === campaignId) await fetchCampaignDetail(campaignId);
        } catch (e) { alert("Failed to update status."); }
    };

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0);
    const totalVotesCast = transactions.reduce((sum, t) => sum + (t.votes_cast || 0), 0);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Voting Panel...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Topbar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-6">
                <div className="flex items-center gap-4">
                    {viewMode !== "campaigns" && (
                        <button onClick={() => { setViewMode("campaigns"); setSelectedCampaign(null); }}
                            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                    )}
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">
                            {viewMode === "campaigns" && "Voting Management"}
                            {viewMode === "manage" && selectedCampaign?.title}
                            {viewMode === "transactions" && "Transactions & Revenue"}
                        </h1>
                        <p className="text-xs text-gray-400">
                            {viewMode === "campaigns" && "Full control over all voting campaigns"}
                            {viewMode === "manage" && `Managing • ${selectedCampaign?.organizer_name || "Unknown Organizer"}`}
                            {viewMode === "transactions" && "All vote purchases across the platform"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0 underline-offset-4" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? "A"}
                    </div>
                </div>
            </header>

            <div className="flex-1 px-6 lg:px-10 py-8 space-y-6">
                {/* ── CAMPAIGNS LIST ─────────────────────────────── */}
                {viewMode === "campaigns" && (
                    <>
                        {/* Quick stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Total Campaigns", value: campaigns.length, icon: Vote, color: "#F39C12" },
                                { label: "Active / Ongoing", value: campaigns.filter(c => c.status === "ONGOING").length, icon: TrendingUp, color: "#1e8a5e" },
                                { label: "Published", value: campaigns.filter(c => c.status === "PUBLISHED").length, icon: CheckCircle2, color: "#2563eb" },
                                { label: "Draft", value: campaigns.filter(c => c.status === "DRAFT").length, icon: Edit, color: "#9333ea" },
                            ].map(card => (
                                <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.color + "18" }}>
                                            <card.icon className="w-4 h-4" style={{ color: card.color }} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-400 mb-1">{card.label}</p>
                                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Action bar */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-800">All Campaigns</h2>
                            <div className="flex gap-3">
                                <button onClick={handleViewTransactions}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                                    <Activity className="w-3.5 h-3.5" /> View Transactions
                                </button>
                                <button onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black transition-all"
                                    style={{ background: "#F39C12" }}>
                                    <Plus className="w-3.5 h-3.5" /> New Campaign
                                </button>
                            </div>
                        </div>

                        {/* Campaign table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                            {campaigns.length === 0 ? (
                                <div className="p-16 text-center">
                                    <Vote className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="font-bold text-gray-500">No voting campaigns yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Campaign</th>
                                                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Organizer</th>
                                                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Categories</th>
                                                <th className="text-right px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {campaigns.map(c => (
                                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="font-bold text-gray-900">{c.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.description || "No description"}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-semibold text-gray-700">{c.organizer_name || "—"}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <select
                                                            value={c.status}
                                                            onChange={e => handleStatusChange(c.id, e.target.value)}
                                                            className={`text-xs font-bold rounded-full px-3 py-1 border-0 cursor-pointer ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600"}`}
                                                        >
                                                            {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-bold text-gray-700">{c.categories?.length ?? 0}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleSelectCampaign(c)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors">
                                                                <Edit className="w-3 h-3" /> Manage
                                                            </button>
                                                            <button onClick={() => handleDeleteCampaign(c.id)}
                                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── CAMPAIGN MANAGER ────────────────────────────── */}
                {viewMode === "manage" && selectedCampaign && (
                    <AdminCampaignManager
                        campaign={selectedCampaign}
                        onRefresh={() => fetchCampaignDetail(selectedCampaign.id)}
                        onStatusChange={handleStatusChange}
                    />
                )}

                {/* ── TRANSACTIONS ─────────────────────────────────── */}
                {viewMode === "transactions" && (
                    <TransactionsView
                        transactions={transactions}
                        totalRevenue={totalRevenue}
                        totalVotesCast={totalVotesCast}
                    />
                )}
            </div>

            {/* Create Campaign Modal */}
            {showCreateModal && (
                <AdminCreateCampaignModal
                    companies={companies}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={async () => { await fetchCampaigns(); setShowCreateModal(false); }}
                />
            )}
        </>
    );
}

// ─── ADMIN CAMPAIGN MANAGER (categories / nominees / packages) ─────────────────
function AdminCampaignManager({ campaign, onRefresh, onStatusChange }: any) {
    const [tab, setTab] = useState<"categories" | "nominees" | "packages" | "manual_adjustments">("categories");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#F39C12" }}>Campaign Management</p>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Campaign Details"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{campaign.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{campaign.description || "No description."}</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</label>
                    <select
                        value={campaign.status}
                        onChange={e => onStatusChange(campaign.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-4 py-2 border-0 cursor-pointer ${STATUS_COLORS[campaign.status] || "bg-gray-100"}`}
                    >
                        {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Edit Campaign Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <AdminEditCampaignModal
                        campaign={campaign}
                        onClose={() => setIsEditModalOpen(false)}
                        onRefresh={onRefresh}
                    />
                )}
            </AnimatePresence>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Categories", value: campaign.categories?.length ?? 0, icon: Layers, color: "#F39C12" },
                    { label: "Nominees", value: campaign.categories?.reduce((a: number, c: any) => a + (c.nominees?.length || 0), 0) ?? 0, icon: Users, color: "#08283B" },
                    { label: "Packages", value: campaign.packages?.length ?? 0, icon: CreditCard, color: "#1e8a5e" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs text-center">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: s.color + "18" }}>
                            <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {(["categories", "nominees", "packages", "manual_adjustments"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all capitalize ${tab === t ? "bg-white shadow-xs text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                        {t.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {tab === "categories" && <AdminCategoriesTab campaign={campaign} onRefresh={onRefresh} />}
            {tab === "nominees" && <AdminNomineesTab campaign={campaign} onRefresh={onRefresh} />}
            {tab === "packages" && <AdminPackagesTab campaign={campaign} onRefresh={onRefresh} />}
            {tab === "manual_adjustments" && <AdminManualAdjustmentsTab campaign={campaign} onRefresh={onRefresh} />}
        </div>
    );
}

// ─── CATEGORIES TAB ────────────────────────────────────────────────────────────
function AdminCategoriesTab({ campaign, onRefresh }: any) {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name);
            setDescription(editingCategory.description || "");
            setShowForm(true);
        }
    }, [editingCategory]);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingCategory) {
                await api.patch(`/voting/categories/${editingCategory.id}/`, { name: name.trim(), description: description.trim() });
            } else {
                await api.post("/voting/categories/", { campaign: campaign.id, name: name.trim(), description: description.trim() });
            }
            setName(""); setDescription(""); setShowForm(false); setEditingCategory(null); onRefresh();
        } catch { alert(`Failed to ${editingCategory ? 'update' : 'create'} category.`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete category and all its nominees?")) return;
        try { await api.delete(`/voting/categories/${id}/`); onRefresh(); }
        catch { alert("Failed to delete."); }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Award Categories</h3>
                <button onClick={() => {
                    if (showForm) { setShowForm(false); setEditingCategory(null); setName(""); setDescription(""); }
                    else setShowForm(true);
                }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: showForm ? "#f3f4f6" : "#F39C12", color: showForm ? "#374151" : "#000" }}>
                    {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleCreateOrUpdate} className="p-5 bg-amber-50/30 border-b border-amber-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Name *</label>
                        <input required autoFocus value={name} onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400"
                            placeholder="e.g. Best Actor" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Description</label>
                        <input value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400"
                            placeholder="Optional" />
                    </div>
                    <button type="submit" disabled={saving}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold disabled:opacity-50"
                        style={{ background: "#F39C12", color: "#000" }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingCategory ? "Update" : "Save")}
                    </button>
                </form>
            )}
            <div className="divide-y divide-gray-50">
                {campaign.categories?.length === 0 ? (
                    <p className="p-10 text-center text-gray-400 font-medium">No categories yet.</p>
                ) : campaign.categories?.map((cat: any) => (
                    <div key={cat.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50">
                        <div>
                            <p className="font-bold text-gray-900">{cat.name}</p>
                            {cat.description && <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>}
                            <span className="inline-block mt-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{cat.nominees?.length || 0} nominees</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditingCategory(cat)} className="p-2 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── NOMINEES TAB ──────────────────────────────────────────────────────────────
function AdminNomineesTab({ campaign, onRefresh }: any) {
    const categories = campaign.categories || [];
    const [openFormFor, setOpenFormFor] = useState<string | null>(null);
    const [editingNominee, setEditingNominee] = useState<any>(null);

    // Manual Vote / History State
    const [manualVoteNominee, setManualVoteNominee] = useState<any>(null);
    const [historyNominee, setHistoryNominee] = useState<any>(null);
    const [nomName, setNomName] = useState("");
    const [nomBio, setNomBio] = useState("");
    const [nomImage, setNomImage] = useState<File | null>(null);
    const [nomImagePreview, setNomImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingNominee) {
            setNomName(editingNominee.name);
            setNomBio(editingNominee.bio || "");
            setNomImagePreview(editingNominee.profile_image || null);
            setOpenFormFor(editingNominee.category);
        }
    }, [editingNominee]);

    const handleAddOrUpdate = async (e: React.FormEvent, catId: string) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("category", catId);
            formData.append("name", nomName.trim());
            formData.append("bio", nomBio.trim());
            if (nomImage) formData.append("profile_image", nomImage);

            if (editingNominee) {
                await api.patch(`/voting/nominees/${editingNominee.id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else {
                await api.post("/voting/nominees/", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }
            setNomName(""); setNomBio(""); setNomImage(null); setNomImagePreview(null); setOpenFormFor(null); setEditingNominee(null); onRefresh();
        } catch { alert(`Failed to ${editingNominee ? 'update' : 'add'} nominee.`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this nominee?")) return;
        try { await api.delete(`/voting/nominees/${id}/`); onRefresh(); }
        catch { alert("Failed to delete."); }
    };

    if (categories.length === 0) return <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400 font-medium">Add categories first.</div>;

    return (
        <div className="space-y-5">
            {categories.map((cat: any) => (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs relative">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">{cat.name}</h4>
                        {openFormFor !== cat.id ? (
                            <button onClick={() => { setOpenFormFor(cat.id); setNomName(""); setNomBio(""); setNomImage(null); setNomImagePreview(null); setEditingNominee(null); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700">
                                <Plus className="w-3.5 h-3.5" /> Add Nominee
                            </button>
                        ) : (
                            <button onClick={() => { setOpenFormFor(null); setEditingNominee(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-500">
                                <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                        )}
                    </div>
                    {openFormFor === cat.id && (
                        <form onSubmit={e => handleAddOrUpdate(e, cat.id)} className="p-4 bg-gray-50 border-b flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:items-end">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Name *</label>
                                    <input required autoFocus value={nomName} onChange={e => setNomName(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Bio</label>
                                    <input value={nomBio} onChange={e => setNomBio(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" placeholder="Short bio..." />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-2 flex flex-col">
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Photo</label>
                                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                            {nomImagePreview ? (
                                                <img src={nomImagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <Star className="w-4 h-4 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files?.[0] || null;
                                                    setNomImage(file);
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setNomImagePreview(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    } else {
                                                        setNomImagePreview(null);
                                                    }
                                                }}
                                                className="block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                                            />
                                        </div>
                                        {(nomImage || nomImagePreview) && (
                                            <button
                                                type="button"
                                                onClick={() => { setNomImage(null); setNomImagePreview(null); }}
                                                className="text-red-500 text-[10px] font-bold uppercase tracking-tight px-2 hover:bg-red-50 rounded-lg h-8 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" disabled={saving}
                                        className="h-[46px] w-full flex items-center justify-center gap-2 px-6 rounded-xl text-sm font-bold disabled:opacity-50 shadow-lg shadow-amber-200/50"
                                        style={{ background: "#F39C12", color: "#000" }}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingNominee ? "Update" : "Add Nominee")}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cat.nominees?.length === 0 ? (
                            <p className="text-sm text-gray-400 col-span-full">No nominees yet.</p>
                        ) : cat.nominees?.map((nom: any) => (
                            <div key={nom.id} className="border border-gray-100 rounded-xl p-3 flex flex-col bg-gray-50/40 group relative">
                                <div className="flex gap-3 items-start mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                        {nom.profile_image ? (
                                            <img src={getImageUrl(nom.profile_image)} className="w-full h-full object-cover" alt={nom.name} />
                                        ) : (
                                            <Star className="w-4 h-4 text-amber-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-900 text-sm truncate">{nom.name}</p>
                                            <div className="relative group/menu">
                                                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
                                                    <button onClick={() => setEditingNominee(nom)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                                        <Edit className="w-3 h-3" /> Edit
                                                    </button>
                                                    <button onClick={() => setManualVoteNominee(nom)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                                                        <Trophy className="w-3 h-3" /> Manual Vote
                                                    </button>
                                                    <button onClick={() => setHistoryNominee(nom)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2">
                                                        <History className="w-3 h-3" /> History
                                                    </button>
                                                    <div className="h-px bg-gray-100 my-1" />
                                                    <button onClick={() => handleDelete(nom.id)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                        <Trash2 className="w-3 h-3" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 line-clamp-1">{nom.bio || "No bio."}</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-gray-400">
                                            <span>Total Votes</span>
                                            <span className="text-amber-600 text-sm">{nom.votes}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <AnimatePresence>
                {manualVoteNominee && (
                    <ManualVoteModal
                        nominee={manualVoteNominee}
                        onClose={() => setManualVoteNominee(null)}
                        onSuccess={() => { onRefresh(); setManualVoteNominee(null); }}
                    />
                )}
                {historyNominee && (
                    <AdjustmentHistoryModal
                        nominee={historyNominee}
                        onClose={() => setHistoryNominee(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── PACKAGES TAB ──────────────────────────────────────────────────────────────
function AdminPackagesTab({ campaign, onRefresh }: any) {
    const [showForm, setShowForm] = useState(false);
    const [editingPackage, setEditingPackage] = useState<any>(null);
    const [pkgName, setPkgName] = useState("");
    const [votes, setVotes] = useState("");
    const [price, setPrice] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingPackage) {
            setPkgName(editingPackage.name);
            setVotes(editingPackage.number_of_votes.toString());
            setPrice(editingPackage.price.toString());
            setShowForm(true);
        }
    }, [editingPackage]);

    const unitRate = votes && price ? (parseFloat(price) / parseInt(votes)).toFixed(2) : null;

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { campaign: campaign.id, name: pkgName.trim(), number_of_votes: parseInt(votes), price: parseFloat(price) };
            if (editingPackage) {
                await api.patch(`/voting/vote-packages/${editingPackage.id}/`, data);
            } else {
                await api.post("/voting/vote-packages/", data);
            }
            setPkgName(""); setVotes(""); setPrice(""); setShowForm(false); setEditingPackage(null); onRefresh();
        } catch { alert(`Failed to ${editingPackage ? 'update' : 'create'} package.`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this package?")) return;
        try { await api.delete(`/voting/vote-packages/${id}/`); onRefresh(); }
        catch { alert("Failed to delete."); }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Vote Packages</h3>
                <button onClick={() => {
                    if (showForm) { setShowForm(false); setEditingPackage(null); setPkgName(""); setVotes(""); setPrice(""); }
                    else setShowForm(true);
                }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: showForm ? "#f3f4f6" : "#F39C12", color: showForm ? "#374151" : "#000" }}>
                    {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleCreateOrUpdate} className="p-5 bg-amber-50/30 border-b border-amber-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Package Name *</label>
                            <input required autoFocus value={pkgName} onChange={e => setPkgName(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" placeholder="Starter Pack" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Votes *</label>
                            <input required type="number" min={1} value={votes} onChange={e => setVotes(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" placeholder="e.g. 5" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Price (Fr) *</label>
                            <input required type="number" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" placeholder="e.g. 1000" />
                        </div>
                    </div>
                    {unitRate && <p className="text-xs text-amber-700 font-bold">≈ {unitRate} Fr per vote</p>}
                    <div className="flex justify-end gap-2">
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                            style={{ background: "#F39C12", color: "#000" }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPackage ? "Update" : "Save Package")}
                        </button>
                    </div>
                </form>
            )}
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {campaign.packages?.length === 0 ? (
                    <p className="col-span-full text-center text-gray-400 py-8 font-medium">No packages yet.</p>
                ) : campaign.packages?.map((pkg: any) => {
                    const rate = (parseFloat(pkg.price) / pkg.number_of_votes).toFixed(2);
                    return (
                        <div key={pkg.id} className="border-2 border-amber-200/60 rounded-xl p-4 bg-amber-50/20 relative group">
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => setEditingPackage(pkg)} className="p-1 text-gray-300 hover:text-amber-600 rounded-sm">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(pkg.id)} className="p-1 text-gray-300 hover:text-red-500 rounded-sm">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="font-bold text-gray-900 mb-2">{pkg.name}</p>
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Votes</span><span className="font-bold text-amber-600">{pkg.number_of_votes}</span></div>
                                <div className="flex justify-between border-t border-amber-100 pt-1.5"><span className="text-gray-400">Price</span><span className="font-bold">{pkg.price} Fr</span></div>
                                <div className="flex justify-between border-t border-dashed border-amber-100 pt-1.5"><span className="text-gray-400">Per vote</span><span className="text-gray-500 font-bold">≈ {rate} Fr</span></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── TRANSACTIONS VIEW ─────────────────────────────────────────────────────────
function TransactionsView({ transactions, totalRevenue, totalVotesCast }: any) {
    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Transactions", value: transactions.length, color: "#F39C12" },
                    { label: "Total Revenue (Fr)", value: totalRevenue.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }), color: "#1e8a5e" },
                    { label: "Total Votes Cast", value: totalVotesCast, color: "#2563eb" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                        <p className="text-xs font-semibold text-gray-400 mb-2">{s.label}</p>
                        <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">All Vote Transactions</h3>
                </div>
                {transactions.length === 0 ? (
                    <div className="p-16 text-center">
                        <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No transactions yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    {["Nominee", "Package", "Votes Cast", "Amount Paid (Fr)", "Status", "Date"].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-gray-800">{t.voter_name || "Anonymous"}</td>
                                        <td className="px-5 py-4 text-gray-500">{t.package || "—"}</td>
                                        <td className="px-5 py-4 font-bold text-amber-600">{t.votes_cast}</td>
                                        <td className="px-5 py-4 font-bold text-gray-900">
                                            {(Math.round((parseFloat(t.amount_paid) + Number.EPSILON) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.payment_status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                {t.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── CREATE CAMPAIGN MODAL ─────────────────────────────────────────────────────
function AdminCreateCampaignModal({ companies, onClose, onCreated }: any) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [organizer, setOrganizer] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizer) return alert("Select an organizer company.");
        setSaving(true);
        try {
            await api.post("/voting/campaigns/", {
                title: title.trim(),
                description: description.trim(),
                organizer,
                start_date: startDate,
                end_date: endDate || null,
            });
            onCreated();
        } catch (e: any) {
            alert("Failed to create campaign: " + (e?.response?.data ? JSON.stringify(e.response.data) : e.message));
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create Voting Campaign</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Admin creating on behalf of an organizer.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Organizer Company *</label>
                        <select required value={organizer} onChange={e => setOrganizer(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400">
                            <option value="">— Select a company —</option>
                            {companies.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Campaign Title *</label>
                        <input required value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" placeholder="e.g. Ghana Music Awards 2025" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Description</label>
                        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400 resize-none" placeholder="Brief description of this campaign" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Start Date *</label>
                            <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">End Date <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                            style={{ background: "#F39C12", color: "#000" }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Campaign
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function AdminEditCampaignModal({ campaign, onClose, onRefresh }: any) {
    const [formData, setFormData] = useState({
        title: campaign.title,
        description: campaign.description || "",
        start_date: campaign.start_date ? campaign.start_date.substring(0, 10) : "",
        end_date: campaign.end_date ? campaign.end_date.substring(0, 10) : "",
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/voting/campaigns/${campaign.id}/`, formData);
            onRefresh();
            onClose();
        } catch (e) { alert("Failed to update campaign."); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Edit Campaign</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Campaign Title</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-hidden focus:border-amber-400" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
                        <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Start Date</label>
                            <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">End Date</label>
                            <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-[2] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            style={{ background: "#F39C12", color: "#000" }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── MANUAL VOTE MODAL ──────────────────────────────────────────────────────────
function ManualVoteModal({ nominee, onClose, onSuccess }: any) {
    const [votes, setVotes] = useState(1);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post("/voting/manual-adjustments/", {
                nominee: nominee.id,
                votes_added: votes,
                reason: reason.trim()
            });
            onSuccess();
        } catch { alert("Failed to add votes."); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add Manual Votes</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-0.5">Adjusting {nominee.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-xs"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Number of Votes</label>
                        <input type="number" required min={1} value={votes} onChange={e => setVotes(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold focus:outline-hidden focus:border-amber-400" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Reason</label>
                        <textarea rows={3} required value={reason} onChange={e => setReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400"
                            placeholder="Reason for adjustment..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-[2] py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            style={{ background: "#F39C12", color: "#000" }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                            Apply Adjustments
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── HISTORY MODAL ─────────────────────────────────────────────────────────────
function AdjustmentHistoryModal({ nominee, onClose }: any) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/voting/manual-adjustments/?nominee=${nominee.id}`);
                setHistory(Array.isArray(res.data) ? res.data : res.data?.results ?? []);
            } catch { console.error("Failed to load history"); }
            finally { setLoading(false); }
        };
        fetchHistory();
    }, [nominee.id]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Adjustment History</h2>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mt-0.5">{nominee.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="py-20 flex justify-center text-gray-300"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">No adjustments recorded.</div>
                    ) : history.map((h: any) => (
                        <div key={h.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-lg font-bold text-gray-900">+{h.votes_added} Votes</span>
                                <span className="text-[10px] font-bold text-gray-400">{new Date(h.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 font-medium font-italic">"{h.reason}"</p>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mt-2">By {h.adjusted_by_email}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold bg-gray-900 text-white">Close</button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── ADMIN MANUAL ADJUSTMENTS TAB ─────────────────────────────────────────────
function AdminManualAdjustmentsTab({ campaign, onRefresh }: any) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedNominee, setSelectedNominee] = useState("");
    const [votes, setVotes] = useState(1);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const nominees = campaign.categories?.flatMap((c: any) => c.nominees || []) || [];

    const fetchUnifiedHistory = async () => {
        setLoading(true);
        try {
            const [manualRes, onlineRes] = await Promise.all([
                api.get(`/voting/manual-adjustments/?campaign=${campaign.id}`),
                api.get(`/voting/vote-transactions/?campaign=${campaign.id}`)
            ]);

            const manualData = (manualRes.data || []).map((m: any) => ({
                ...m,
                type: 'MANUAL',
                votes: m.votes_added,
                voter: m.adjusted_by_email,
                reference: m.reason
            }));

            const onlineData = (onlineRes.data || []).filter((t: any) => t.payment_status === 'SUCCESS').map((t: any) => ({
                ...t,
                type: 'ONLINE',
                votes: t.votes_cast,
                voter: t.voter_name || t.voter_email || 'Anonymous',
                reference: `Package: ${t.package_name || 'Generic'}`
            }));

            const merged = [...manualData, ...onlineData].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setHistory(merged);
        } catch (e) { console.error("Failed to load history", e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchUnifiedHistory();
    }, [campaign.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post("/voting/manual-adjustments/", {
                nominee: selectedNominee,
                votes_added: votes,
                reason: reason.trim()
            });
            setSelectedNominee("");
            setVotes(1);
            setReason("");
            setShowForm(false);
            onRefresh();
            fetchUnifiedHistory();
        } catch { alert("Failed to add adjustment."); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">Vote History & Adjustments</h3>
                        <p className="text-xs text-gray-400">Total activities: {history.length}</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: showForm ? "#f3f4f6" : "#F39C12", color: showForm ? "#374151" : "#000" }}>
                        {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Adjustment</>}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="p-5 bg-amber-50/30 border-b border-amber-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Nominee *</label>
                                <select required value={selectedNominee} onChange={e => setSelectedNominee(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400">
                                    <option value="">Select a nominee...</option>
                                    {nominees.map((n: any) => (
                                        <option key={n.id} value={n.id}>{n.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Votes (+/-) *</label>
                                <input type="number" required value={votes} onChange={e => setVotes(parseInt(e.target.value))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Reason *</label>
                                <input type="text" required value={reason} onChange={e => setReason(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-amber-400"
                                    placeholder="Offline payment, error fix, etc." />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving || !selectedNominee}
                                className="flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-bold disabled:opacity-50"
                                style={{ background: "#F39C12", color: "#000" }}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Apply Adjustment
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                <th className="text-left px-5 py-3.5">Date</th>
                                <th className="text-left px-5 py-3.5">Nominee</th>
                                <th className="text-center px-5 py-3.5">Votes</th>
                                <th className="text-center px-5 py-3.5">Type</th>
                                <th className="text-left px-5 py-3.5">Reason / Reference</th>
                                <th className="text-right px-5 py-3.5">Source / By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="py-12 flex justify-center text-gray-300"><Loader2 className="w-6 h-6 animate-spin" /></td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No activity recorded yet.</td></tr>
                            ) : history.map((h: any) => (
                                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 text-xs font-medium text-gray-500">{new Date(h.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-4 font-bold text-gray-900">{h.nominee_name}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.votes > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {h.votes > 0 ? `+${h.votes}` : h.votes}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.type === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {h.type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 max-w-xs truncate italic">"{h.reference}"</td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{h.voter}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
