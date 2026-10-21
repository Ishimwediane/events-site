"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2, User, Building, Mail,
    Save, Upload, Image as ImageIcon, Bell, Menu
} from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import { companyService } from "@/platform/services/company.service";
import DashboardSidebar from "@/platform/components/DashboardSidebar";
import { getImageUrl } from "@/platform/lib/images";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Personal Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [personalSuccess, setPersonalSuccess] = useState(false);

    // Company Form State
    const [companyName, setCompanyName] = useState("");
    const [companyDescription, setCompanyDescription] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSavingCompany, setIsSavingCompany] = useState(false);
    const [companySuccess, setCompanySuccess] = useState(false);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            setUser(userData);

            // Set initial personal state
            setFirstName(userData.first_name || "");
            setLastName(userData.last_name || "");

            if (userData.role === "COMPANY") {
                try {
                    const companyProfile = await companyService.getMyCompanyProfile();
                    setCompany(companyProfile);
                    setCompanyName(companyProfile.name || "");
                    setCompanyDescription(companyProfile.description || "");
                    if (companyProfile.logo) {
                        setLogoPreview(getImageUrl(companyProfile.logo));
                    }
                } catch (error) {
                    console.error("Failed to fetch company profile", error);
                }
            }
            setIsLoading(false);
        };
        init();
    }, [router]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSavePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPersonal(true);
        setPersonalSuccess(false);

        try {
            await authService.updateProfile({
                first_name: firstName,
                last_name: lastName
            });
            // Update local state to reflect what's stored
            const updatedUser = authService.getUserFromStorage();
            setUser(updatedUser);
            setPersonalSuccess(true);
            setTimeout(() => setPersonalSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update personal details", error);
        } finally {
            setIsSavingPersonal(false);
        }
    };

    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingCompany(true);
        setCompanySuccess(false);

        try {
            const formData = new FormData();
            formData.append('name', companyName);
            formData.append('description', companyDescription);
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const updatedProfile = await companyService.updateMyCompanyProfile(formData);
            setCompany(updatedProfile);
            setCompanySuccess(true);
            setTimeout(() => setCompanySuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update company details", error);
        } finally {
            setIsSavingCompany(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Settings…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full font-sans text-gray-800">
            {/* Top bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100 gap-4 shadow-xs">
                <div className="flex items-center gap-4 shrink-0">
                    <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Settings</h1>
                        <p className="text-xs text-gray-400">Manage your profile and company branding</p>
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

            <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-8 mt-4">

                {/* PERSONAL SETTINGS */}
                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Update your own name and contact details.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSavePersonal} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">First Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-sm"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Last Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-sm"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-semibold text-sm cursor-not-allowed"
                                        value={user?.email || ""}
                                        disabled
                                    />
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium">Your email address cannot be changed right now.</p>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            {personalSuccess ? (
                                <span className="text-sm font-bold text-green-600 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                                    Saved successfully!
                                </span>
                            ) : <div />}

                            <button
                                type="submit"
                                disabled={isSavingPersonal}
                                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSavingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>

                {/* COMPANY SETTINGS (Appears ONLY for Company Role) */}
                {user?.role === "COMPANY" && company && (
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Building className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Company Profile</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Customize your brand presence on the platform.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveCompany} className="p-6 space-y-8">

                            {/* Logo upload */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Company Logo</label>
                                <div className="flex items-start gap-6">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3 pt-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleLogoChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload New Logo
                                        </button>
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            We recommend a 1:1 square image. JPG, PNG, or GIF. Max 5MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Company Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-sm"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Your Brand Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Brand Slug</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
                                            <input
                                                type="text"
                                                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono text-sm"
                                                value={company?.slug || ""}
                                                onChange={(e) => setCompany({ ...company, slug: e.target.value })}
                                                placeholder="brand-slug"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium">Changing this will update your public profile URL.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Brand Description</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm min-h-[120px] resize-y"
                                        value={companyDescription}
                                        onChange={(e) => setCompanyDescription(e.target.value)}
                                        placeholder="Tell attendees a little bit about what your company does and what kinds of events you host..."
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-gray-100 mt-6">
                                {companySuccess ? (
                                    <span className="text-sm font-bold text-amber-600 flex items-center gap-2 mt-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></div>
                                        Profile updated successfully!
                                    </span>
                                ) : <div className="mt-4" />}

                                <button
                                    type="submit"
                                    disabled={isSavingCompany}
                                    className="mt-4 px-6 py-2.5 bg-[#F39C12] hover:bg-[#B9770E] text-black text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xs"
                                >
                                    {isSavingCompany ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
                                    Update Public Profile
                                </button>
                            </div>
                        </form>
                    </section>
                )}

            </div>
        </div>
    );
}
