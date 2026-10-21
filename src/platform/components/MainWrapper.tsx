"use client";

import { usePathname } from "next/navigation";
import Footer from "@/platform/components/Footer";

// Routes that lay out their own full-height page: the dashboard shell, or a
// full-screen panel like /login. These get no navbar top-padding and no footer.
const FULL_BLEED_ROUTES = ["/dashboard", "/admin", "/pending", "/login"];

export default function MainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isSidebar = FULL_BLEED_ROUTES.some((r) => pathname?.startsWith(r));
    return (
        <>
            <main className={isSidebar ? "min-h-screen" : "min-h-screen pt-[96px]"}>
                {children}
            </main>
            {!isSidebar && <Footer />}
        </>
    );
}
