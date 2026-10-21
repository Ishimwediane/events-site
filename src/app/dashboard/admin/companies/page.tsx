"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import { getImageUrl } from "@/platform/lib/images";
import { Search, Edit2, Trash2, Users, Shield, RefreshCw, ShieldCheck, Plus, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { companyService } from "@/platform/services/company.service";

export default function AdminCompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [newAuth, setNewAuth] = useState<"EVENTS" | "VOTING" | "BOTH">("EVENTS");
    const [newQrAccess, setNewQrAccess] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);

    // Add company modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [addForm, setAddForm] = useState({
        name: "",
        email: "",
        password: "",
        authorization: "BOTH",
        can_use_qr: false
    });

    const router = useRouter();

    useEffect(() => {
        const userData = authService.getUserFromStorage();
        if (!userData) { router.push("/login"); return; }
        if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
        setUser(userData);
        fetchCompanies();
    }, [router]);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/companies/list/");
            // API may return a paginated object ({ results: [...] }) or a plain array.
            const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
            setCompanies(list);
        } catch (err) {
            console.error("Failed to fetch companies:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (company: any) => {
        setEditingCompany(company);
        setNewAuth(company.authorization || "EVENTS");
        setNewQrAccess(company.can_use_qr || false);
        setIsEditModalOpen(true);
        setError("");
    };

    const handleSaveAuth = async () => {
        if (!editingCompany) return;
        setIsSaving(true);
        setError("");
        try {
            await api.patch(`/companies/admin/${editingCompany.id}/`, {
                name: editingCompany.name,
                slug: editingCompany.slug,
                description: editingCompany.description,
                authorization: newAuth,
                can_use_qr: newQrAccess,
            });
            await fetchCompanies();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update company", err);
            setError("Failed to update company. Please check your admin privileges and ensure the slug is unique.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCompany = async (id: string) => {
        if (!confirm("Are you sure you want to delete this company? This will permanently remove all associated data.")) return;
        try {
            await api.delete(`/companies/admin/${id}/`);
            await fetchCompanies();
        } catch (err) {
            console.error("Failed to delete company", err);
            alert("Failed to delete company. It may have active events or campaigns.");
        }
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");
        try {
            await companyService.adminCreateCompany(addForm as any);
            await fetchCompanies();
            setIsAddModalOpen(false);
            setAddForm({
                name: "",
                email: "",
                password: "",
                authorization: "BOTH",
                can_use_qr: false
            });
        } catch (err: any) {
            console.error("Failed to add company", err);
            setError(err.response?.data?.error || err.response?.data?.email?.[0] || "Failed to create company. Please check if the email is already in use.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && companies.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F39C12]"></div>
            </div>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100">
                <div>
                    <h1 className="text-lg font-bold text-gray-800 leading-tight">Organizers</h1>
                    <p className="text-xs text-gray-400">Manage platform access and module authorization</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#F39C12] text-[#08283B] text-xs font-bold rounded-xl hover:bg-[#D68910] transition-all shadow-md shadow-orange-100"
                    >
                        <Plus className="w-4 h-4" /> Add Organizer
                    </button>
                    <button onClick={fetchCompanies} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0 underline-offset-4" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? "A"}
                    </div>
                </div>
            </header>

            <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Approved Organizers</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage platform access and module authorization for event and voting organizers.</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F39C12] focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Company Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Authorization Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">QR Access</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCompanies.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                                            <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm font-semibold">No companies found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCompanies.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shadow-xs shrink-0 overflow-hidden">
                                                        {c.logo ? (
                                                            <img src={getImageUrl(c.logo)} alt={c.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-bold text-gray-400">{c.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                                                        <p className="text-[10px] text-gray-400 max-w-[200px] truncate">{c.description || "No description provided"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500 font-mono">@{c.slug}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500">{c.email || "No email"}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.authorization === "BOTH" ? "bg-purple-100 text-purple-700" :
                                                    c.authorization === "VOTING" ? "bg-blue-100 text-blue-700" :
                                                        "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                    <Shield className="w-3 h-3" />
                                                    {c.authorization || "EVENTS"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.can_use_qr ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
                                                    }`}>
                                                    {c.can_use_qr ? "✓ Enabled" : "✗ Disabled"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(c)}
                                                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors border border-gray-200"
                                                        title="Edit Role"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCompany(c.id)}
                                                        className="p-2 bg-gray-50 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
                                                        title="Delete Company"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

            {/* Edit Company Modal */}
            {isEditModalOpen && editingCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl"
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Edit Company Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Company Name</label>
                                <input
                                    type="text"
                                    value={editingCompany.name}
                                    onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Slug</label>
                                <input
                                    type="text"
                                    value={editingCompany.slug}
                                    onChange={e => setEditingCompany({ ...editingCompany, slug: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Description</label>
                                <textarea
                                    rows={3}
                                    value={editingCompany.description || ""}
                                    onChange={e => setEditingCompany({ ...editingCompany, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-400"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-[10px] font-bold uppercase text-gray-400 mb-3 block">Authorization Role</label>
                                <div className="space-y-2">
                                    <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newAuth === 'EVENTS' ? 'border-[#F39C12] bg-orange-50/50' : 'border-gray-50'}`}>
                                        <input type="radio" className="mt-1" name="auth" value="EVENTS" checked={newAuth === 'EVENTS'} onChange={() => setNewAuth('EVENTS')} />
                                        <div>
                                            <p className="font-bold text-xs uppercase">Events Only</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newAuth === 'VOTING' ? 'border-[#F39C12] bg-orange-50/50' : 'border-gray-50'}`}>
                                        <input type="radio" className="mt-1" name="auth" value="VOTING" checked={newAuth === 'VOTING'} onChange={() => setNewAuth('VOTING')} />
                                        <div>
                                            <p className="font-bold text-xs uppercase">Voting Only</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newAuth === 'BOTH' ? 'border-[#F39C12] bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input type="radio" className="mt-1" name="auth" value="BOTH" checked={newAuth === 'BOTH'} onChange={() => setNewAuth('BOTH')} />
                                        <div>
                                            <p className="font-bold text-xs uppercase">Both (Events & Voting)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* QR Code Access Toggle */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-[10px] font-bold uppercase text-gray-400 mb-3 block">QR Code Access</label>
                                <div
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${newQrAccess ? 'border-teal-400 bg-teal-50/50' : 'border-gray-100'}`}
                                >
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">Enable QR Codes</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Allow this company to add QR codes to their events</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewQrAccess(!newQrAccess)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${newQrAccess ? 'bg-teal-500' : 'bg-gray-200'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${newQrAccess ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAuth}
                                disabled={isSaving}
                                className="px-6 py-2.5 font-bold text-sm text-[#08283B] rounded-xl shadow-lg transition-all disabled:opacity-50"
                                style={{ background: "#F39C12" }}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Company Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl"
                        >
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800">Add New Organizer</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleAddCompany}>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-bold flex items-center gap-2 animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Company Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Ozone Entertainment"
                                                value={addForm.name}
                                                onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F39C12]/20 focus:border-[#F39C12] transition-all placeholder:text-gray-300"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Contact Email</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="organizer@example.com"
                                                value={addForm.email}
                                                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F39C12]/20 focus:border-[#F39C12] transition-all placeholder:text-gray-300"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    minLength={8}
                                                    placeholder="••••••••"
                                                    value={addForm.password}
                                                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F39C12]/20 focus:border-[#F39C12] transition-all placeholder:text-gray-300 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 block">Module Authorization</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {[
                                                { id: 'BOTH', label: 'Events & Voting' },
                                                { id: 'EVENTS', label: 'Events Only' },
                                                { id: 'VOTING', label: 'Voting Only' }
                                            ].map((opt) => (
                                                <label 
                                                    key={opt.id}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${addForm.authorization === opt.id ? 'border-[#F39C12] bg-orange-50/50 ring-4 ring-orange-50' : 'border-gray-50 hover:border-gray-200'}`}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        className="hidden" 
                                                        name="auth-new" 
                                                        value={opt.id} 
                                                        checked={addForm.authorization === opt.id} 
                                                        onChange={() => setAddForm({ ...addForm, authorization: opt.id })} 
                                                    />
                                                    <span className={`text-[10px] font-bold uppercase text-center ${addForm.authorization === opt.id ? 'text-[#F39C12]' : 'text-gray-400'}`}>
                                                        {opt.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <div
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${addForm.can_use_qr ? 'border-teal-400 bg-teal-50/50 ring-4 ring-teal-50' : 'border-gray-50 hover:border-gray-200'}`}
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">QR Code Access</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Enable QR scanning for this company</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAddForm({ ...addForm, can_use_qr: !addForm.can_use_qr })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${addForm.can_use_qr ? 'bg-teal-500' : 'bg-gray-200'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${addForm.can_use_qr ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-5 py-2.5 font-bold text-sm text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-8 py-2.5 font-bold text-sm text-[#08283B] rounded-xl shadow-lg transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                                        style={{ background: "#F39C12" }}
                                    >
                                        {isSaving ? (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </div>
                                        ) : "Create Account"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
