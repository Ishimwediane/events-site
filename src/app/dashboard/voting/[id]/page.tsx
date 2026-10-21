"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Loader2, LayoutDashboard, Layers, Users, Star,
    CreditCard, Calendar, Activity, Plus, Trash2, Edit, FileText, Menu, Bell, Settings, X, CheckCircle2, History, Trophy, MoreVertical
} from "lucide-react";
import Link from "next/link";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import DashboardSidebar from "@/platform/components/DashboardSidebar";
import { getImageUrl } from "@/platform/lib/images";

type TabType = "overview" | "categories" | "nominees" | "packages" | "transactions" | "manual_adjustments";

export default function VotingCampaignManager() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchCampaign = async () => {
        try {
            const res = await api.get(`/voting/campaigns/${campaignId}/`);
            setCampaign(res.data);
        } catch (error) {
            console.error("Failed to load campaign", error);
            alert("Failed to load campaign. Ensure it exists.");
            router.push("/dashboard/voting");
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        try {
            await api.patch(`/voting/campaigns/${campaignId}/`, { status: newStatus });
            setCampaign({ ...campaign, status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status.");
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || (userData.role !== "COMPANY" && userData.role !== "ADMIN")) {
                router.push("/login"); return;
            }
            setUser(userData);
            if (campaignId) {
                await fetchCampaign();
            }
            setIsLoading(false);
        };
        init();
    }, [campaignId, router]);

    const TABS = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "categories", label: "Categories", icon: Layers },
        { id: "nominees", label: "Nominees", icon: Users },
        { id: "packages", label: "Vote Packages", icon: CreditCard },
        { id: "transactions", label: "Transactions", icon: Activity },
        { id: "manual_adjustments", label: "Manual Adjustments", icon: History },
    ] as const;

    if (isLoading || !campaign) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                <span className="text-sm font-bold tracking-widest text-gray-400 uppercase">Loading Manager...</span>
            </div>
        );
    }

    return (
        <>
            {/* Top bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4">
                <div className="flex items-center gap-4 shrink-0 min-w-[160px]">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Voting Manager</h1>
                        <p className="text-xs text-gray-400">
                            {user?.role === "ADMIN" ? "Admin Access" : `Hello ${user?.first_name || "there"}`}, manage campaign here!
                        </p>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">
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

            <div className="flex-1 px-6 lg:px-10 py-8 space-y-6 pb-20">
                {/* Header & Breadcrumbs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Link
                            href="/dashboard/voting"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Campaigns
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                {campaign.title}
                                <select
                                    value={campaign.status}
                                    onChange={handleStatusChange}
                                    className={`text-[10px] px-3 py-1 pb-1.5 rounded-full uppercase tracking-widest font-bold outline-hidden cursor-pointer border-none appearance-none pr-8 bg-no-repeat ${campaign.status === 'PUBLISHED' || campaign.status === 'ONGOING' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: `right 0.25rem center`,
                                        backgroundSize: `1.5em 1.5em`
                                    }}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="ONGOING">Ongoing</option>
                                    <option value="FINISHED">Finished</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </h1>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                title="Edit Campaign Details"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit Campaign Modal */}
                <AnimatePresence>
                    {isEditModalOpen && (
                        <EditCampaignModal
                            campaign={campaign}
                            onClose={() => setIsEditModalOpen(false)}
                            onRefresh={fetchCampaign}
                        />
                    )}
                </AnimatePresence>

                {/* Tab Navigation */}
                <div className="flex items-center overflow-x-auto gap-2 p-1.5 bg-gray-100 rounded-2xl">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${isActive
                                    ? "bg-white text-gray-900 shadow-xs"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "text-amber-500" : "text-gray-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Areas */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "overview" && <CampaignOverviewTab campaign={campaign} />}
                        {activeTab === "categories" && <CategoriesTab campaign={campaign} onRefresh={fetchCampaign} />}
                        {activeTab === "nominees" && <NomineesTab campaign={campaign} onRefresh={fetchCampaign} />}
                        {activeTab === "packages" && <PackagesTab campaign={campaign} onRefresh={fetchCampaign} />}
                        {activeTab === "transactions" && <TransactionsTab campaign={campaign} />}
                        {activeTab === "manual_adjustments" && <ManualAdjustmentsTab campaign={campaign} onRefresh={fetchCampaign} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}

// ----------------------------------------------------------------------------------------------------
// CHILD TABS
// ----------------------------------------------------------------------------------------------------

function EditCampaignModal({ campaign, onClose, onRefresh }: { campaign: any, onClose: () => void, onRefresh: () => void }) {
    const [formData, setFormData] = useState({
        title: campaign.title,
        description: campaign.description || "",
        start_date: campaign.start_date ? campaign.start_date.substring(0, 16) : "",
        end_date: campaign.end_date ? campaign.end_date.substring(0, 16) : "",
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
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Description</label>
                        <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Start Date</label>
                            <input type="datetime-local" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">End Date</label>
                            <input type="datetime-local" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
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

function CampaignOverviewTab({ campaign }: { campaign: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 justify-between rounded-3xl border border-gray-100 shadow-xs flex flex-col h-full col-span-1 md:col-span-2 lg:col-span-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-1 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Description
                    </h3>
                    <p className="text-gray-900 mt-2 font-medium">{campaign.description}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Total Categories</h3>
                <p className="text-4xl font-bold text-gray-900">{campaign.categories?.length || 0}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Total Nominees</h3>
                <p className="text-4xl font-bold text-amber-500">
                    {campaign.categories?.reduce((acc: number, cat: any) => acc + (cat.nominees?.length || 0), 0) || 0}
                </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Vote Packages</h3>
                <p className="text-4xl font-bold text-blue-500">{campaign.packages?.length || 0}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Timeframe</h3>
                <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3 text-gray-400" /> {new Date(campaign.start_date).toLocaleDateString()}</p>
                    {campaign.end_date && (
                        <p className="text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3 text-gray-400" /> {new Date(campaign.end_date).toLocaleDateString()}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CategoriesTab({ campaign, onRefresh }: { campaign: any, onRefresh: () => void }) {
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
        if (!name.trim()) return;
        setSaving(true);
        try {
            if (editingCategory) {
                await api.patch(`/voting/categories/${editingCategory.id}/`, { name: name.trim(), description: description.trim() });
            } else {
                await api.post("/voting/categories/", { campaign: campaign.id, name: name.trim(), description: description.trim() });
            }
            setName(""); setDescription(""); setShowForm(false); setEditingCategory(null);
            onRefresh();
        } catch (e) { alert(`Failed to ${editingCategory ? 'update' : 'create'} category.`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Deleting this category also deletes all nominees inside it. Continue?")) {
            try { await api.delete(`/voting/categories/${id}/`); onRefresh(); }
            catch (e) { alert("Failed to delete category."); }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Award Categories</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Define the categories that nominees will compete in.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (showForm) { setShowForm(false); setEditingCategory(null); setName(""); setDescription(""); }
                            else { setShowForm(true); }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: showForm ? "#f3f4f6" : "#F39C12", color: showForm ? "#374151" : "#000" }}
                    >
                        {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Category</>}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreateOrUpdate} className="p-6 bg-amber-50/30 border-b border-amber-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Category Name *</label>
                                <input
                                    type="text" required autoFocus value={name} onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                                    placeholder="e.g. Best Actor, Song of the Year"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Description <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                                <input
                                    type="text" value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                                    placeholder="Short description of what this category awards"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                                style={{ background: "#F39C12", color: "#000" }}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingCategory ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                {editingCategory ? "Update Category" : "Save Category"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="divide-y divide-gray-50">
                    {campaign.categories?.length === 0 ? (
                        <div className="p-12 text-center">
                            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No categories added yet.</p>
                        </div>
                    ) : (
                        campaign.categories?.map((cat: any) => (
                            <div key={cat.id} className="p-5 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                                <div>
                                    <h3 className="font-bold text-gray-900">{cat.name}</h3>
                                    {cat.description && <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>}
                                    <span className="inline-block mt-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                                        {cat.nominees?.length || 0} Nominees
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingCategory(cat)} className="p-2 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function NomineesTab({ campaign, onRefresh }: { campaign: any, onRefresh: () => void }) {
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
            setNomImagePreview(getImageUrl(editingNominee.profile_image));
            setOpenFormFor(editingNominee.category);
        }
    }, [editingNominee]);

    const openForm = (catId: string) => { setOpenFormFor(catId); setNomName(""); setNomBio(""); setNomImage(null); setNomImagePreview(null); setEditingNominee(null); };
    const closeForm = () => { setOpenFormFor(null); setNomName(""); setNomBio(""); setNomImage(null); setNomImagePreview(null); setEditingNominee(null); };

    const handleAddOrUpdate = async (e: React.FormEvent, categoryId: string) => {
        e.preventDefault();
        if (!nomName.trim()) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("category", categoryId);
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
            closeForm(); onRefresh();
        } catch (e) { alert(`Failed to ${editingNominee ? 'update' : 'add'} nominee.`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (nomineeId: string) => {
        if (confirm("Delete this nominee?")) {
            try { await api.delete(`/voting/nominees/${nomineeId}/`); onRefresh(); }
            catch (e) { alert("Failed to delete."); }
        }
    };

    if (categories.length === 0) {
        return (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
                <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-700 font-bold">No categories yet</p>
                <p className="text-sm text-gray-400 mt-1">Add a category first before adding nominees.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {categories.map((cat: any) => (
                <div key={cat.id} className="bg-white rounded-3xl border border-gray-100 shadow-xs relative">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                        {openFormFor !== cat.id ? (
                            <button onClick={() => openForm(cat.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700">
                                <Plus className="w-3.5 h-3.5" /> Add Nominee
                            </button>
                        ) : (
                            <button onClick={closeForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-500">
                                <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                        )}
                    </div>

                    {openFormFor === cat.id && (
                        <form onSubmit={e => handleAddOrUpdate(e, cat.id)} className="p-5 bg-gray-50 border-b border-gray-100 flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1 block">Nominee Name *</label>
                                    <input type="text" required autoFocus value={nomName} onChange={e => setNomName(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                                        placeholder="e.g. John Doe" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1 block">Bio <span className="font-normal normal-case">(optional)</span></label>
                                    <input type="text" value={nomBio} onChange={e => setNomBio(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                                        placeholder="Short biography..." />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1 block">Profile Photo <span className="font-normal normal-case">(optional)</span></label>
                                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-xs">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                            {nomImagePreview ? (
                                                <img src={nomImagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <Users className="w-4 h-4 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 font-medium">
                                            <input
                                                type="file" accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files?.[0] || null;
                                                    setNomImage(file);
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setNomImagePreview(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                                            />
                                        </div>
                                        {nomImagePreview && (
                                            <button type="button" onClick={() => { setNomImage(null); setNomImagePreview(null); }}
                                                className="text-red-500 text-[10px] font-bold uppercase tracking-tight px-2 hover:bg-red-50 rounded-lg h-8 transition-colors">Clear</button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" disabled={saving}
                                        className="w-full h-[42px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50 shadow-lg shadow-amber-200/50"
                                        style={{ background: "#F39C12", color: "#000" }}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingNominee ? "Update Nominee" : "Add Nominee")}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.nominees?.length === 0 ? (
                            <p className="text-sm font-medium text-gray-400 col-span-full">No nominees yet.</p>
                        ) : (
                            cat.nominees?.map((nom: any) => (
                                <div key={nom.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/40 flex flex-col group relative">
                                    <div className="flex gap-4 items-start mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                                            {nom.profile_image ? (
                                                <img src={getImageUrl(nom.profile_image)} className="w-full h-full object-cover" alt={nom.name} />
                                            ) : (
                                                <Star className="w-5 h-5 text-amber-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-900 truncate">{nom.name}</h4>
                                                <div className="relative group/menu shrink-0">
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
                                            <p className="text-[10px] text-gray-400 line-clamp-1">{nom.bio || "No bio Provided."}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-3">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-gray-400">
                                                <span>Total Votes</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xl font-bold text-amber-600">{nom.votes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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

function PackagesTab({ campaign, onRefresh }: { campaign: any, onRefresh: () => void }) {
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

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pkgName.trim() || !votes || !price) return;
        setSaving(true);
        try {
            const data = {
                campaign: campaign.id,
                name: pkgName.trim(),
                number_of_votes: parseInt(votes),
                price: parseFloat(price),
            };
            if (editingPackage) {
                await api.patch(`/voting/vote-packages/${editingPackage.id}/`, data);
            } else {
                await api.post("/voting/vote-packages/", data);
            }
            setPkgName(""); setVotes(""); setPrice(""); setShowForm(false); setEditingPackage(null);
            onRefresh();
        } catch (e) { alert("Failed to save package."); }
        finally { setSaving(false); }
    };

    const handleDelete = async (pkgId: string) => {
        if (confirm("Delete this package?")) {
            try { await api.delete(`/voting/vote-packages/${pkgId}/`); onRefresh(); }
            catch (e) { alert("Failed to delete."); }
        }
    };

    const unitRate = votes && price && parseFloat(price) > 0 ? (parseFloat(price) / parseInt(votes)).toFixed(2) : null;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Vote Packages</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Define bundles voters can purchase.</p>
                    </div>
                    <button onClick={() => { setShowForm(v => !v); if (showForm) setEditingPackage(null); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: showForm ? "#f3f4f6" : "#F39C12", color: showForm ? "#374151" : "#000" }}>
                        {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Package</>}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreateOrUpdate} className="p-6 bg-amber-50/30 border-b border-amber-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Package Name *</label>
                                <input type="text" required autoFocus value={pkgName} onChange={e => setPkgName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Votes *</label>
                                <input type="number" required min={1} value={votes} onChange={e => setVotes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Price (RWF) *</label>
                                <input type="number" required min={0} value={price} onChange={e => setPrice(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                                style={{ background: "#F39C12", color: "#000" }}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {editingPackage ? "Update Package" : "Save Package"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {campaign.packages?.length === 0 ? (
                        <p className="col-span-full py-12 text-center text-gray-400 font-medium">No packages yet.</p>
                    ) : (
                        campaign.packages?.map((pkg: any) => (
                            <div key={pkg.id} className="border-2 border-amber-200/60 rounded-2xl p-5 bg-linear-to-b from-amber-50/40 to-white relative group">
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    <button onClick={() => setEditingPackage(pkg)} className="p-1.5 text-gray-300 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-all">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-3">{pkg.name}</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center py-2 border-t border-amber-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Votes</span>
                                        <span className="text-xl font-bold text-amber-600">{pkg.number_of_votes}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-t border-amber-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price</span>
                                        <span className="text-xl font-bold text-gray-900">{Number(pkg.price).toLocaleString()} RWF</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TransactionsTab({ campaign }: { campaign: any }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-16 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Logs</h3>
            <p className="text-gray-500">Revenue metrics will appear here once active.</p>
        </div>
    );
}

// ----------------------------------------------------------------------------------------------------
// MANUAL VOTE MODAL
// ----------------------------------------------------------------------------------------------------

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
        } catch (error) {
            alert("Failed to add votes.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add Manual Votes</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F39C12] mt-0.5">Adjusting {nominee.name}</p>
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Reason / Reference</label>
                        <textarea rows={3} required value={reason} onChange={e => setReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:border-amber-400"
                            placeholder="e.g. Offline cash payment, special promotion..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-[2] py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
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

// ----------------------------------------------------------------------------------------------------
// ADJUSTMENT HISTORY MODAL
// ----------------------------------------------------------------------------------------------------

function AdjustmentHistoryModal({ nominee, onClose }: any) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/voting/manual-adjustments/?nominee=${nominee.id}`);
                setHistory(res.data);
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [nominee.id]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Adjustment History</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{nominee.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center">
                            <History className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No manual adjustments recorded.</p>
                        </div>
                    ) : (
                        history.map((h: any) => (
                            <div key={h.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-lg font-bold text-gray-900">+{h.votes_added} Votes</span>
                                    <span className="text-[10px] font-bold text-gray-400">{new Date(h.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium italic">"{h.reason}"</p>
                                <div className="mt-3 pt-3 border-t border-gray-200/50 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Users className="w-2 h-2 text-amber-700" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">By {h.adjusted_by_email}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold bg-gray-900 text-white">Close History</button>
                </div>
            </motion.div>
        </div>
    );
}
// ----------------------------------------------------------------------------------------------------
// ─── MANUAL ADJUSTMENTS TAB ───────────────────────────────────────────────────
function ManualAdjustmentsTab({ campaign, onRefresh }: { campaign: any, onRefresh: () => void }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedNominee, setSelectedNominee] = useState("");
    const [votes, setVotes] = useState(1);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const nominees = campaign.categories?.flatMap((cat: any) => cat.nominees || []) || [];

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
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 tracking-tight">Vote History & Manual Adjustments</h3>
                        <p className="text-xs text-gray-400 font-medium">Complete record of votes for this campaign</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all"
                        style={{ background: showForm ? "#f3f4f6" : "#F39C12", color: showForm ? "#374151" : "#000" }}>
                        {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Adjustment</>}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="p-6 bg-amber-50/30 border-b border-amber-100 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Select Nominee *</label>
                                <select required value={selectedNominee} onChange={e => setSelectedNominee(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400">
                                    <option value="">Choose a nominee...</option>
                                    {nominees.map((n: any) => (
                                        <option key={n.id} value={n.id}>{n.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Votes (+/-) *</label>
                                <input type="number" required value={votes} onChange={e => setVotes(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Reason *</label>
                                <input type="text" required value={reason} onChange={e => setReason(e.target.value)}
                                    placeholder="Offline payment, adjustment, etc."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving || !selectedNominee}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                                style={{ background: "#F39C12", color: "#000" }}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Apply Adjustment
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">Nominee</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Votes</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">Reason / Reference</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">By / Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-gray-200 mx-auto" /></td></tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400">No activity recorded yet.</td>
                                </tr>
                            ) : (
                                history.map((h: any) => (
                                    <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(h.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{h.nominee_name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${h.votes > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {h.votes > 0 ? `+${h.votes}` : h.votes}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${h.type === 'ONLINE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {h.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium max-w-xs truncate italic">"{h.reference}"</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Users className="w-3 h-3 text-gray-500" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 truncate uppercase">{h.voter}</span>
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
    );
}
