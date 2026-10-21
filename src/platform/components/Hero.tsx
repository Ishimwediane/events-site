"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";

// Two columns of images — each list is duplicated for seamless infinite loop
const col1 = [
    { src: "/image/event.jpeg", alt: "Live festival" },
    { src: "/image/part.jpg", alt: "Outdoor concert" },
    { src: "/image/ticket.jpg", alt: "Night event" },
    { src: "/image/event.jpeg", alt: "Music crowd" },
];

const col2 = [
    { src: "/image/ticket.jpg", alt: "Corporate event" },
    { src: "/image/event.jpeg", alt: "Food festival" },
    { src: "/image/part.jpg", alt: "DJ night" },
    { src: "/image/ticket.jpg", alt: "Gala event" },
];

function ImageColumn({
    images,
    direction,
}: {
    images: typeof col1;
    direction: "up" | "down";
}) {
    // Duplicate images so the loop is seamless
    const doubled = [...images, ...images];
    return (
        <div className="relative h-full overflow-hidden">
            <div className={direction === "up" ? "animate-scroll-up" : "animate-scroll-down"}>
                {doubled.map((img, i) => (
                    <div
                        key={i}
                        className="mb-4 rounded-lg overflow-hidden shadow-lg border border-gray-100"
                        style={{ height: "220px" }}
                    >
                        <Image
                            src={img.src}
                            alt={img.alt}
                            width={260}
                            height={220}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Hero() {
    return (
        <>
            {/* Inject keyframes directly — avoids CRLF globals.css issue */}
            <style>{`
                @keyframes scrollUp {
                    0%   { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                @keyframes scrollDown {
                    0%   { transform: translateY(-50%); }
                    100% { transform: translateY(0); }
                }
                .animate-scroll-up {
                    animation: scrollUp 22s linear infinite;
                }
                .animate-scroll-down {
                    animation: scrollDown 22s linear infinite;
                }
                .animate-scroll-up:hover,
                .animate-scroll-down:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <section
                className="relative min-h-[88vh] px-6 overflow-hidden flex items-center"
                style={{ background: "#ffffff" }}
            >

                <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center py-14 px-6 lg:px-16">

                    {/* ── LEFT: Text ── */}
                    <div>
                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="font-bold leading-[1.08] tracking-tighter mb-6"
                            style={{
                                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                                color: "#1a1a1a",
                            }}
                        >
                            The world&apos;s{" "}
                            <span
                                className="relative inline-block px-2 rounded-lg"
                                style={{ background: "#F39C12", color: "#08283B" }}
                            >
                                most
                            </span>{" "}
                            loved
                            <br />
                            <span
                                className="relative inline-block px-2 rounded-lg mt-1"
                                style={{ background: "#F39C12", color: "#08283B" }}
                            >
                                event
                            </span>{" "}
                            ticketing
                            <br />
                            platform.
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-gray-500 text-lg leading-relaxed mb-10 max-w-md"
                        >
                            The professional choice for hosting events, managing ticketing, and
                            running secure voting campaigns. Everything organizers need, powered by OZONE.
                        </motion.p>

                        {/* Single CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Link
                                href="/company/register"
                                className="inline-flex items-center px-6 py-3 rounded-lg font-bold text-sm shadow-md"
                                style={{ background: "#F39C12", color: "#08283B" }}
                            >
                                Register as Organizer
                            </Link>
                        </motion.div>


                    </div>

                    {/* ── RIGHT: Two scrolling image columns ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="hidden lg:grid grid-cols-2 gap-4"
                        style={{ height: "580px" }}
                    >
                        <ImageColumn images={col1} direction="up" />
                        <ImageColumn images={col2} direction="down" />
                    </motion.div>
                </div>
            </section>
        </>
    );
}
