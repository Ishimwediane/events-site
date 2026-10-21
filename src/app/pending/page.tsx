"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authService } from "@/platform/services/auth.service";
import { api } from "@/platform/lib/api";
import { Mail, Phone, LogOut, Clock, XCircle, Loader2 } from "lucide-react";

export default function PendingPage() {
    const [email, setEmail] = useState("");
    const [application, setApplication] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const user = authService.getUserFromStorage();
            if (user?.email) setEmail(user.email);

            try {
                const res = await api.get("/companies/applications/");
                const apps = res.data.results || res.data;
                if (Array.isArray(apps) && apps.length > 0) {
                    setApplication(apps[0]);
                }
            } catch (err) {
                console.error("Failed to load application details", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md text-center">

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading details...</span>
                    </div>
                ) : application?.status === "REJECTED" ? (
                    <>
                        {/* Rejected Icon */}
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ background: "#fef2f2" }} // red-50
                        >
                            <XCircle className="w-8 h-8" style={{ color: "#ef4444" }} />
                        </div>

                        {/* Rejected Heading */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Application Rejected
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Unfortunately, your company application has been rejected at this time.
                        </p>

                        {/* Rejection Reason */}
                        {application.rejection_reason && (
                            <div className="text-left bg-red-50/50 border border-red-100 p-4 rounded-xl mb-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">
                                    Reason for Rejection
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                    {application.rejection_reason}
                                </p>
                            </div>
                        )}

                        {email && (
                            <p className="text-xs text-gray-400 mb-8 mt-2">
                                Logged in as <span className="font-semibold text-gray-600">{email}</span>
                            </p>
                        )}
                        <div className="border-t border-gray-200 my-8" />
                    </>
                ) : (
                    <>
                        {/* Pending Icon */}
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ background: "#F39C1215" }}
                        >
                            <Clock className="w-8 h-8" style={{ color: "#F39C12" }} />
                        </div>

                        {/* Pending Heading */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Application Under Review
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-2">
                            Your application has been received. Our team will review it and activate your account shortly.
                        </p>
                        {email && (
                            <p className="text-xs text-gray-400 mb-8 mt-4">
                                Logged in as <span className="font-semibold text-gray-600">{email}</span>
                            </p>
                        )}
                        <div className="border-t border-gray-200 my-8" />
                    </>
                )}

                {/* Contact section */}
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
                    Need help? Contact us
                </p>

                <div className="space-y-3">
                    <a
                        href="mailto:ozoneentertainments1@gmail.com"
                        className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all group"
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "#F39C1215" }}
                        >
                            <Mail className="w-4 h-4" style={{ color: "#F39C12" }} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</p>
                            <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                ozoneentertainments1@gmail.com
                            </p>
                        </div>
                    </a>

                    <a
                        href="tel:+250784731957"
                        className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all group"
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "#F39C1215" }}
                        >
                            <Phone className="w-4 h-4" style={{ color: "#F39C12" }} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone / WhatsApp</p>
                            <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                +250 784 731 957
                            </p>
                        </div>
                    </a>
                </div>

                {/* Logout */}
                <button
                    onClick={() => authService.logout()}
                    className="mt-8 flex items-center gap-2 mx-auto text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </div>
    );
}
