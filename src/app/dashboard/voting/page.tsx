"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Vote, Loader2, Calendar, MoreVertical, Edit, Trash2, Menu, Bell, Settings } from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import CreateVotingCampaignModal from "@/platform/components/CreateVotingCampaignModal";
import DashboardSidebar from "@/platform/components/DashboardSidebar";


interface VotingCampaign {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string | null;
    status: string;
    categories: any[];
    packages: any[];
}

export default function VotingCampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<VotingCampaign[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get("/voting/campaigns/mine/");
            setCampaigns(res.data.results || res.data);
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData || userData.role !== "COMPANY") { router.push("/login"); return; }

            try {
                const profile = await api.get("/companies/profile/me/");
                if (profile.data.authorization === "EVENTS") {
                    router.push("/dashboard"); // Block from Voting
                    return;
                }
            } catch (e) {
                console.error("Failed to verify authorization");
            }

            setUser(userData);
            await fetchCampaigns();
            setIsLoading(false);
        };
        init();
    }, [router]);
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this voting campaign? All categories, nominees, and votes will be permanently lost.")) {
            try {
                await api.delete(`/voting/campaigns/${id}/`);
                fetchCampaigns();
            } catch (error) {
                console.error("Failed to delete", error);
                alert("Failed to delete campaign.");
            }
        }
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Campaigns...</span>
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
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Voting</h1>
                        <p className="text-xs text-gray-400">Hello {user?.first_name || "there"}, welcome back!</p>
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

            <div className="flex-1 px-6 lg:px-10 py-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Voting Campaigns</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Create and manage your public voting festivals and awards.
                        </p>
                    </div>

                    {/* 
                  Since we don't have a CreateCampaignModal for voting yet,
                  we can direct them to a new create page or pop a modal. 
                  We will build the create flow soon. For now we will just link to a stub or open mock modal.
                */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 border border-transparent shadow-xs hover:bg-black rounded-xl text-sm font-bold text-white transition-all sm:w-auto w-full"
                        style={{ background: "#08283B" }}
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </button>
                </div>


                {/* Search/Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 rounded-xl text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Campaigns...</p>
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-xs border border-gray-100 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <Vote className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Campaigns Found</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
                            {searchQuery ? "Try adjusting your search terms." : "You haven't created any voting campaigns yet. Create your first campaign to start engaging with voters!"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 rounded-xl text-sm font-bold text-white transition-all shadow-xs"
                                style={{ background: "#F39C12" }}
                            >
                                <Plus className="w-4 h-4" />
                                Create First Campaign
                            </button>
                        )}

                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCampaigns.map((campaign: any, idx: number) => (
                            <Link href={`/dashboard/voting/${campaign.id}`} key={campaign.id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all cursor-pointer h-full flex flex-col"
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${campaign.status === 'PUBLISHED' || campaign.status === 'ONGOING' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {campaign.status}
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(campaign.id, e)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-amber-600 transition-colors">
                                            {campaign.title}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-500 line-clamp-2 mb-6 flex-1">
                                            {campaign.description}
                                        </p>

                                        <div className="space-y-3 pt-4 border-t border-gray-50">
                                            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Start: {new Date(campaign.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4">
                                                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-lg font-bold text-gray-900">{campaign.categories?.length || 0}</span>
                                                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Categories</span>
                                                </div>
                                                <div className="bg-amber-50 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-lg font-bold text-amber-600">{campaign.packages?.length || 0}</span>
                                                    <span className="text-[10px] uppercase tracking-widest text-amber-600/70 font-bold">Packages</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}

                <CreateVotingCampaignModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchCampaigns}
                />
            </div>
        </div>
    );
}


