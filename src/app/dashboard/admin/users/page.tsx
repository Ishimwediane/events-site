"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import { Search, Edit2, Trash2, Users, Shield, RefreshCw, ShieldCheck, Mail, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newRole, setNewRole] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [adminUser, setAdminUser] = useState<any>(null);

    const router = useRouter();

    useEffect(() => {
        const userData = authService.getUserFromStorage();
        if (!userData) { router.push("/login"); return; }
        if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
        setAdminUser(userData);
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/users/");
            // API may return a paginated object ({ results: [...] }) or a plain array.
            setUsers(Array.isArray(res.data) ? res.data : res.data?.results ?? []);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setNewRole(user.role);
        setIsEditModalOpen(true);
        setError("");
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        setError("");
        try {
            await api.patch(`/users/${editingUser.id}/`, {
                first_name: editingUser.first_name,
                last_name: editingUser.last_name,
                email: editingUser.email,
                role: newRole,
            });
            await fetchUsers();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update user", err);
            setError("Failed to update user. Please ensure the email is valid and not already in use.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (id === adminUser?.id) {
            alert("You cannot delete your own admin account.");
            return;
        }
        if (!confirm("Are you sure you want to delete this user? This will permanently remove all associated data.")) return;
        try {
            await api.delete(`/users/${id}/`);
            await fetchUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
            alert("Failed to delete user.");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && users.length === 0) {
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
                    <h1 className="text-lg font-bold text-gray-800 leading-tight">User Management</h1>
                    <p className="text-xs text-gray-400">View and manage all registered users</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchUsers} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                </div>
            </header>

            <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">System Users</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage accounts, roles and platform access for all users.</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F39C12] focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                                            <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm font-semibold">No users found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u: any) => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#F39C12] border border-gray-200 shrink-0">
                                                        {u.first_name?.[0] ?? u.email?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">
                                                            {u.first_name} {u.last_name}
                                                        </p>
                                                        {u.id === adminUser?.id && (
                                                            <span className="text-[9px] font-bold text-[#F39C12] uppercase tracking-tighter">You</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Mail className="w-3.5 h-3.5 text-gray-300" />
                                                    {u.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                                    u.role === 'COMPANY' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    {new Date(u.date_joined).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(u)}
                                                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors border border-gray-200"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        disabled={u.id === adminUser?.id}
                                                        className={`p-2 bg-gray-50 rounded-lg transition-colors border border-gray-200 ${
                                                            u.id === adminUser?.id ? 'opacity-30 cursor-not-allowed' : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                                                        }`}
                                                        title="Delete User"
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

            {/* Edit User Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl"
                        >
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800">Edit User Profile</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-bold">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 block">First Name</label>
                                        <input
                                            type="text"
                                            value={editingUser.first_name || ""}
                                            onChange={e => setEditingUser({ ...editingUser, first_name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:border-[#F39C12] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 block">Last Name</label>
                                        <input
                                            type="text"
                                            value={editingUser.last_name || ""}
                                            onChange={e => setEditingUser({ ...editingUser, last_name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:border-[#F39C12] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 block">Email Address</label>
                                    <input
                                        type="email"
                                        value={editingUser.email || ""}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-[#F39C12] transition-all"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-3 block">User Role</label>
                                    <div className="space-y-2">
                                        {['CUSTOMER', 'COMPANY', 'ADMIN'].map((role) => (
                                            <label 
                                                key={role}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newRole === role ? 'border-[#F39C12] bg-orange-50/50' : 'border-gray-50 hover:border-gray-100'}`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    className="mt-0.5" 
                                                    name="role" 
                                                    value={role} 
                                                    checked={newRole === role} 
                                                    onChange={() => setNewRole(role)} 
                                                />
                                                <span className="font-bold text-xs uppercase">{role}</span>
                                            </label>
                                        ))}
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
                                    onClick={handleSaveUser}
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
            </AnimatePresence>
        </>
    );
}
