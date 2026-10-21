"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, CheckCircle2,
    XCircle, Clock, Bell, ShieldCheck, Building, RefreshCw
} from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import { adminService } from "@/platform/services/admin.service";
import ApplicationModal from "@/platform/components/ApplicationModal";
import { api } from "@/platform/lib/api";

export default function AdminApplicationsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<any | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
            setUser(userData);
            fetchApplications();
        };
        init();
    }, [router]);

    const fetchApplications = async () => {
        try {
            const data = await adminService.getApplications();
            setApplications(data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalSubmit = async (data: any) => {
        setModalLoading(true);
        try {
            if (editingApp) {
                await api.patch(`/companies/applications/${editingApp.id}/`, data);
            }
            await fetchApplications();
            setIsModalOpen(false);
            setEditingApp(null);
        } catch (error) {
            console.error("Failed to save application", error);
            alert("Failed to save application");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this application?")) return;
        setActionLoading(id + "DELETE");
        try {
            await api.delete(`/companies/applications/${id}/`);
            await fetchApplications();
        } catch (error) {
            console.error("Failed to delete application", error);
        } finally {
            setActionLoading(null);
        }
    };

    const openReviewModal = (app: any) => {
        setEditingApp(app);
        setIsModalOpen(true);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Pending</span>;
        }
    };

    if (isLoading && applications.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F39C12]"></div>
            </div>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 uppercase tracking-tighter">
                <div>
                    <h1 className="text-lg font-bold text-gray-800 leading-tight">Host Applications</h1>
                    <p className="text-xs text-gray-400 font-medium">Review and moderate incoming organizers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchApplications} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" /> Admin
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0 underline-offset-4" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? "A"}
                    </div>
                </div>
            </header>

            <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                    {/* Header area */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Application Queue</h2>
                                <p className="text-xs text-gray-500 font-medium">Manage pending requests from prospective hosts.</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Company Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Submitted At</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm font-medium">
                                            No company applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                                                        <Building className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{app.company_name}</div>
                                                        <div className="text-xs text-gray-500 max-w-xs truncate">{app.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-700">{app.email}</div>
                                                <div className="text-xs text-gray-500">{app.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                                                {new Date(app.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openReviewModal(app)}
                                                        className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-bold"
                                                    >
                                                        Review
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(app.id)}
                                                        disabled={actionLoading === app.id + "DELETE"}
                                                        className="px-3 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {actionLoading === app.id + "DELETE" ? "Deleting..." : "Delete"}
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

            <ApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingApp}
                isLoading={modalLoading}
            />
        </>
    );
}
