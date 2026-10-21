"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Menu } from "lucide-react";
import { authService } from "@/platform/services/auth.service";
import DashboardSidebar from "@/platform/components/DashboardSidebar";
import { api } from "@/platform/lib/api";

export default function DashboardLayoutContent({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) {
                router.push("/login");
                return;
            }

            // Fetch company profile to get the correct authorization
            if (userData.role === "COMPANY") {
                try {
                    const profile = await api.get("/companies/profile/me/");
                    userData.authorization = (profile.data.authorization || "BOTH").toUpperCase().trim();
                } catch {
                    userData.authorization = "BOTH";
                }
            }

            setUser(userData);
            setIsLoading(false);
        };
        init();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f4f5f7" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#F39C12" }} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Workspace...</span>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen" style={{ background: "#f4f5f7" }}>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-screen z-30">
                <DashboardSidebar user={user} />
            </aside>

            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-64 h-full">
                        <DashboardSidebar user={user} />
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
                    <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Menu className="w-5 h-5 text-gray-500" />
                    </button>
                    <span className="text-sm font-bold tracking-tight" style={{ color: "#08283B" }}>OZONE EVENT</span>
                    <div className="w-8" /> {/* Spacer */}
                </div>

                {/* Provide children with a consistent wrapper or layout if needed */}
                {children}
            </main>
        </div>
    );
}
