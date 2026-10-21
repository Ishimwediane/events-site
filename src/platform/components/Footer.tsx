import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer style={{ background: "#08283B" }} className="border-t border-white/5">
            <div className="mx-auto max-w-7xl px-6 lg:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-3">

                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-0.5 shadow-lg border border-white/10" style={{ background: "#F39C12" }}>
                        <Image
                            src="/image/logo.jpg"
                            alt="OZONE Logo"
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <span className="text-white/70 text-xs font-bold tracking-wide">
                        OZONE ENTERTAINMENT
                    </span>
                </div>

                {/* Copyright */}
                <span className="text-white/30 text-xs">
                    © 2026 Ozone Entertainment. All rights reserved.
                </span>

                {/* Links */}
                <div className="flex items-center gap-6 text-[11px] font-semibold uppercase tracking-widest text-white/30">
                    <Link href="/contact" className="hover:text-amber-400 transition-colors">Contact</Link>
                    <Link href="/events" className="hover:text-amber-400 transition-colors">Events</Link>
                    <Link href="/company/register" className="hover:text-amber-400 transition-colors">Host</Link>
                </div>

            </div>
        </footer>
    );
}
