"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Trophy, Users, X, Calendar, Facebook, Twitter, Mail, Search, SlidersHorizontal, Share2 } from "lucide-react";
import Image from "next/image";
import { api } from "@/platform/lib/api";
import NavbarWrapper from "@/platform/components/NavbarWrapper";
import PaymentModal from "@/platform/components/PaymentModal";
import { getImageUrl } from "@/platform/lib/images";

interface Category {
    id: string;
    name: string;
    nominees: Nominee[];
}

interface Nominee {
    id: string;
    public_id?: number | null;
    name: string;
    bio?: string;
    profile_image?: string | null;
    votes: number;
}

interface VotePackage {
    id: string;
    name: string;
    price: string;
    number_of_votes: number;
}

interface Campaign {
    id: string;
    title: string;
    cover_image?: string | null;
    status: string;
    end_date?: string | null;
    categories?: Category[];
    category_options?: Category[];
    packages?: VotePackage[];
    pagination?: {
        page: number;
        page_size: number;
        total: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

interface VotingCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    nominee: Nominee | null;
    packages: VotePackage[];
    onOpenPayment: (pkg: VotePackage) => void;
}

interface VotingCampaignPublicContentProps {
    campaignEndpoint: string;
}

export default function VotingCampaignPublicContent({ campaignEndpoint }: VotingCampaignPublicContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
    const [isPaymentModalOpenGlobal, setIsPaymentModalOpenGlobal] = useState(false);
    const [selectedPackageGlobal, setSelectedPackageGlobal] = useState<VotePackage | null>(null);
    const [page, setPage] = useState(1);

    const mergeCategories = (current: Category[] = [], incoming: Category[] = []) => {
        const byId = new Map(current.map((category) => [category.id, { ...category, nominees: [...(category.nominees || [])] }]));
        incoming.forEach((category) => {
            const existing = byId.get(category.id);
            if (!existing) {
                byId.set(category.id, category);
                return;
            }
            const seen = new Set(existing.nominees.map((nominee) => nominee.id));
            existing.nominees = [
                ...existing.nominees,
                ...(category.nominees || []).filter((nominee) => !seen.has(nominee.id)),
            ];
        });
        return Array.from(byId.values());
    };

    const fetchCampaign = useCallback(async (nextPage = 1, append = false) => {
        try {
            const params = new URLSearchParams({ page: String(nextPage), page_size: "24" });
            if (selectedCategory !== "all") params.set("category", selectedCategory);
            if (searchQuery.trim()) params.set("q", searchQuery.trim());

            const res = await api.get<Campaign>(`${campaignEndpoint}?${params.toString()}`);
            setCampaign((current) => {
                if (!append || !current) return res.data;
                return {
                    ...res.data,
                    categories: mergeCategories(current.categories, res.data.categories),
                };
            });
        } catch (error) {
            console.error("Failed to load campaign", error);
            router.push("/voting");
        } finally {
            setIsLoading(false);
        }
    }, [campaignEndpoint, router, searchQuery, selectedCategory]);

    useEffect(() => {
        if (!campaignEndpoint) return;
        const id = window.setTimeout(() => {
            setIsLoading(true);
            setPage(1);
            fetchCampaign(1, false);
        }, 250);
        return () => window.clearTimeout(id);
    }, [campaignEndpoint, fetchCampaign]);

    useEffect(() => {
        const nomineePublicId = searchParams.get("nominee");
        if (!campaign || !nomineePublicId) return;

        const categoryWithNominee = (campaign.categories || []).find((category) =>
            category.nominees?.some((nominee) => String(nominee.public_id || nominee.id) === nomineePublicId)
        );
        if (!categoryWithNominee) return;

        setSearchQuery("");
        setSelectedCategory(categoryWithNominee.id);

        window.setTimeout(() => {
            document
                .getElementById(`nominee-${nomineePublicId}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
    }, [campaign, searchParams]);

    const categories: Category[] = campaign?.category_options || campaign?.categories || [];
    const visibleCategories: Category[] = campaign?.categories || [];

    if (isLoading || !campaign) {
        return (
            <div className="min-h-screen bg-[#f6f7f9]">
                <NavbarWrapper />
                <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#F39C12] mb-3" />
                    <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Loading Campaign...</span>
                </div>
            </div>
        );
    }

    const sharedNomineePublicId = searchParams.get("nominee");

    const shareUrl = async (title: string, url: string) => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // User cancelled native sharing.
            }
        }
        await navigator.clipboard?.writeText(url);
    };

    const shareCurrentPage = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("nominee");
        shareUrl(campaign.title, url.toString());
    };

    const shareNominee = (nominee: Nominee) => {
        const url = new URL(window.location.href);
        url.searchParams.set("nominee", String(nominee.public_id || nominee.id));
        shareUrl(`${nominee.name} - ${campaign.title}`, url.toString());
    };

    return (
        <div className="min-h-screen bg-[#f6f7f9]">
            <NavbarWrapper />

            {/* Hero Cover Image */}
            <div className="relative w-full h-64 md:h-[400px] overflow-hidden bg-[#08283B]">
                {campaign.cover_image && (
                    <Image
                        src={getImageUrl(campaign.cover_image)}
                        alt={campaign.title}
                        fill
                        priority
                        sizes="100vw"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

                {/* Back button */}
                <div className="absolute top-6 left-6 z-20">
                    <button
                        onClick={() => router.push("/voting")}
                        className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-full transition-all border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>

                {/* Status badge */}
                <div className="absolute top-6 right-6 z-20">
                    <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg ${campaign.status === 'PUBLISHED' || campaign.status === 'ONGOING' ? 'bg-green-500 text-black' : 'bg-gray-500 text-white'}`}>
                        {campaign.status}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 md:-mt-48 pb-16">

                {/* Card that overlaps the hero */}
                <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6 border border-gray-100">
                    <div className="flex flex-col lg:flex-row relative">

                        {/* Left Side: Campaign Metadata */}
                        <div className="flex-1 p-6 lg:p-8">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-tight">
                                {campaign.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6">
                                {campaign.end_date && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Calendar className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Deadline</p>
                                            <p className="text-sm font-bold text-gray-800">{new Date(campaign.end_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Trophy className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Categories</p>
                                        <p className="text-sm font-bold text-gray-800">{campaign.categories?.length || 0} Award Groups</p>
                                    </div>
                                </div>
                            </div>

                            {/* Share */}
                            <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Share Campaign</p>
                                    <div className="flex items-center gap-2">
                                        <button className="w-7 h-7 rounded-sm bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600"><Facebook className="w-3.5 h-3.5" /></button>
                                        <button className="w-7 h-7 rounded-sm bg-gray-50 flex items-center justify-center text-gray-400 hover:text-sky-500"><Twitter className="w-3.5 h-3.5" /></button>
                                        <button className="w-7 h-7 rounded-sm bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700"><Mail className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Top Filter + Category Sections */}
                <div className="space-y-8">
                    <div className="bg-white border border-gray-100 shadow-xs p-4 md:p-5 rounded-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-[#F39C12] mb-1">Award Categories</p>
                                <h2 className="text-lg font-bold text-gray-900">Choose a category, then vote for your nominee</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 w-full lg:w-[560px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search nominee or category"
                                        className="w-full h-11 border border-gray-100 bg-gray-50 pl-10 pr-3 text-sm font-semibold text-gray-700 outline-hidden focus:border-[#F39C12] focus:bg-white transition-colors placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="relative">
                                    <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(event) => setSelectedCategory(event.target.value)}
                                        className="w-full h-11 border border-gray-100 bg-gray-50 pl-10 pr-8 text-sm font-bold text-gray-700 outline-hidden focus:border-[#F39C12] focus:bg-white transition-colors appearance-none"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {visibleCategories.length === 0 ? (
                        <div className="bg-white p-12 text-center shadow-xs border border-gray-100 rounded-lg">
                            <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-700">No nominees match your filter</p>
                        </div>
                    ) : (
                        visibleCategories.map((category) => {
                            return (
                                <section key={category.id} className="bg-white border border-gray-100 rounded-lg p-4 md:p-5 space-y-5 shadow-xs">
                                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                                        <div>
                                            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                                                {category.name}
                                            </h2>
                                            <div className="mt-4 flex items-center gap-4 text-[11px] font-semibold text-gray-400">
                                                <span>{category.nominees?.length || 0} participants</span>
                                                <span>1 winner</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={shareCurrentPage}
                                            className="w-10 h-10 shrink-0 rounded-sm border border-gray-200 bg-gray-50 text-gray-400 hover:text-[#F39C12] hover:border-[#F39C12] transition-colors flex items-center justify-center"
                                            aria-label={`Share ${category.name}`}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {category.nominees?.length === 0 ? (
                                        <div className="bg-gray-50 p-10 text-center shadow-xs border border-gray-100 rounded-sm">
                                            <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-gray-700">No Nominees Yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                                            {category.nominees.map((nominee) => {
                                                return (
                                                    <div
                                                        key={nominee.id}
                                                        id={nominee.public_id ? `nominee-${nominee.public_id}` : nominee.id}
                                                        className={`group bg-white rounded-md border shadow-xs overflow-hidden flex flex-col transition-colors ${sharedNomineePublicId && String(nominee.public_id || nominee.id) === sharedNomineePublicId ? 'border-[#F39C12] ring-2 ring-[#F39C12]/40' : 'border-gray-100 hover:border-[#F39C12]'}`}
                                                    >
                                                        <div className="relative aspect-square w-full bg-white overflow-hidden">
                                                            {nominee.profile_image ? (
                                                                <Image
                                                                    src={getImageUrl(nominee.profile_image)}
                                                                    fill
                                                                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                                                                    className="w-full h-full object-cover object-center"
                                                                    alt={nominee.name}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-[#efefef]">
                                                                    <span className="text-[10px] font-medium text-gray-400">Failed to load image</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-4 flex flex-col flex-1 items-center text-center bg-[#111827]">
                                                            <h3 className="text-sm font-bold text-white mb-3 truncate w-full group-hover:text-[#F39C12] transition-colors">
                                                                {nominee.name}
                                                            </h3>
                                                            
                                                            <div className="mb-5 flex items-baseline justify-center gap-1">
                                                                <span className="text-xl font-bold text-[#F39C12]">{nominee.votes}</span>
                                                                <span className="text-[11px] font-bold text-white uppercase">Votes</span>
                                                            </div>

                                                            <div className="mt-auto grid grid-cols-[1fr_34px] gap-2 w-full">
                                                                <button
                                                                    onClick={() => setSelectedNominee(nominee)}
                                                                    className="h-10 border border-white/20 bg-[#08283B] hover:bg-[#F39C12] hover:text-[#08283B] hover:border-[#F39C12] text-white text-[11px] font-bold uppercase tracking-wide transition-all"
                                                                >
                                                                    Vote Now
                                                                </button>
                                                                <button
                                                                    onClick={() => shareNominee(nominee)}
                                                                    className="h-10 border border-white/20 bg-[#08283B] hover:border-[#F39C12] hover:text-[#F39C12] text-white flex items-center justify-center transition-colors"
                                                                    aria-label={`Share ${nominee.name}`}
                                                                >
                                                                    <Share2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            );
                        })
                    )}
                    {campaign.pagination?.has_next && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    const nextPage = page + 1;
                                    setPage(nextPage);
                                    fetchCampaign(nextPage, true);
                                }}
                                className="px-5 py-3 bg-[#08283B] text-white text-xs font-bold uppercase tracking-widest"
                            >
                                Load More Nominees
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <VotingCheckoutModal
                isOpen={!!selectedNominee && !isPaymentModalOpenGlobal}
                onClose={() => setSelectedNominee(null)}
                nominee={selectedNominee}
                packages={campaign.packages || []}
                onOpenPayment={(pkg) => {
                    setSelectedPackageGlobal(pkg);
                    setIsPaymentModalOpenGlobal(true);
                }}
            />

            <PaymentModal
                isOpen={isPaymentModalOpenGlobal}
                onClose={() => setIsPaymentModalOpenGlobal(false)}
                amount={selectedPackageGlobal ? parseFloat(selectedPackageGlobal.price) : 0}
                serviceType="VOTE"
                targetId={selectedNominee?.id || ""}
                metadata={{
                    package_id: selectedPackageGlobal?.id,
                    votes_cast: selectedPackageGlobal?.number_of_votes,
                    full_name: "Anonymous Voter"
                }}
                onSuccess={() => {
                    fetchCampaign(1, false);
                    setIsPaymentModalOpenGlobal(false);
                    setSelectedNominee(null);
                }}
            />
        </div>
    );
}

// Voting Checkout Modal
function VotingCheckoutModal({
    isOpen,
    onClose,
    nominee,
    packages,
    onOpenPayment
}: VotingCheckoutModalProps) {
    const [selectedPackage, setSelectedPackage] = useState<VotePackage | null>(null);
    const activePackage = selectedPackage ?? packages[0] ?? null;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePackage) return alert("Select a package first.");
        onOpenPayment(activePackage);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-lg w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-gray-100"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest leading-none">Vote for {nominee?.name}</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">Select a package below</p>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 transition-colors text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar">
                            {/* Package Selection */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Pick Package</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {packages.map((pkg) => {
                                        const isSelected = activePackage?.id === pkg.id;
                                        return (
                                            <div
                                                key={pkg.id}
                                                onClick={() => setSelectedPackage(pkg)}
                                                className={`p-3 border transition-all cursor-pointer text-center ${isSelected ? 'border-[#F39C12] bg-[#F39C12]/5' : 'border-gray-50 bg-gray-50 hover:bg-white hover:border-gray-200'}`}
                                            >
                                                <p className={`text-[10px] font-bold uppercase ${isSelected ? 'text-[#F39C12]' : 'text-gray-400'}`}>{pkg.name}</p>
                                                <p className="text-sm font-bold text-gray-900 my-0.5">{pkg.price} RWF</p>
                                                <p className="text-[9px] font-bold text-gray-500 uppercase">+{pkg.number_of_votes} Votes</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="pt-2 border-t border-dashed border-gray-100">
                                <div className="flex items-center justify-between pt-3">
                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Total Total</span>
                                    <span className="text-xl font-bold text-[#F39C12]">{activePackage?.price || 0} RWF</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer / CTA */}
                        <div className="p-5 pt-0">
                            <button
                                onClick={handleCheckout}
                                className="w-full py-4 bg-[#F39C12] hover:bg-[#D68910] text-white font-bold text-xs uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Submit Vote <Trophy size={14} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
