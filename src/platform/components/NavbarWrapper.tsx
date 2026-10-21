"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/platform/components/Navbar";

// Routes where the Navbar should NOT appear: the dashboard and admin areas
// have their own sidebar, and /login is a full-screen split panel that supplies
// all of its own chrome.
const NO_NAVBAR_ROUTES = ["/dashboard", "/admin", "/login"];

export default function NavbarWrapper() {
    const pathname = usePathname();
    const hiddenNav = NO_NAVBAR_ROUTES.some((route) => pathname?.startsWith(route));
    if (hiddenNav) return null;
    return <Navbar />;
}
