"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/platform/lib/images";

interface EventCardProps {
    slug: string;
    title: string;
    category: string;
    date: string;
    time?: string;
    description?: string;
    location: string;
    price: string;
    image: string;
}

export default function EventCard({
    slug,
    title,
    category,
    date,
    time = "6:00 PM",
    description = "An unforgettable experience joining us for a live show packed with top talent and culture.",
    location,
    price,
    image
}: EventCardProps) {
    return (
        <Link href={`/events/${slug}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg overflow-hidden group shadow-xs hover:shadow-md transition-all duration-500 h-full flex flex-col border border-gray-100"
            >
                {/* Image Section */}
                <div className="relative h-40 w-full overflow-hidden p-2 pb-0">
                    <div className="relative h-full w-full rounded-lg overflow-hidden">
                        {image ? (
                            <Image
                                src={getImageUrl(image)}
                                alt={title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Image
                                    src="/image/party.jpg"
                                    alt={title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 z-20">
                            <span className="px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#F39C12] border border-[#F39C12]/20">
                                {category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                        <h3 className="text-base font-bold mb-1.5 leading-tight text-[#1a1a1a] group-hover:text-[#F39C12] transition-colors line-clamp-1">
                            {title}
                        </h3>

                        <p className="text-gray-400 text-xs font-medium leading-relaxed mb-3 line-clamp-2">
                            {description}
                        </p>

                        <div className="h-[1px] w-full bg-gray-50 mb-3" />

                        <div className="space-y-1.5 mb-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Calendar className="w-3 h-3 text-gray-300" />
                                {date}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Clock className="w-3 h-3 text-gray-300" />
                                {time}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button className="w-full py-2.5 rounded-lg bg-[#F39C12] hover:bg-[#D68910] transition-all text-white font-bold text-[11px] uppercase tracking-widest shadow-xs">
                            View Details
                        </button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
