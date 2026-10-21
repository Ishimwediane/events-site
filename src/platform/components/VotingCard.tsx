"use client";

import { motion } from "framer-motion";
import { Calendar, Vote, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/platform/lib/images";

interface VotingCardProps {
    id: string;
    href?: string | null;
    title: string;
    description: string;
    image: string | null;
    endDate: string | null;
    categoryCount: number;
}

export default function VotingCard({
    id,
    href,
    title,
    description,
    image,
    endDate,
    categoryCount
}: VotingCardProps) {
    return (
        <Link href={href || `/voting/${id}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg overflow-hidden group shadow-xs hover:shadow-md transition-all duration-500 h-full flex flex-col border border-gray-100"
            >
                {/* Image Section */}
                <div className="relative h-32 w-full overflow-hidden p-2 pb-0">
                    <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        {image ? (
                            <Image
                                src={getImageUrl(image)}
                                alt={title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <Vote className="w-8 h-8 text-gray-200 group-hover:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute top-2 right-2 z-20">
                            <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1 border border-gray-100">
                                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-900">Live</span>
                            </div>
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
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <Calendar className="w-3 h-3 text-gray-300" />
                                Ends: {endDate ? new Date(endDate).toLocaleDateString() : "TBD"}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-tight">
                                <Vote className="w-3 h-3 text-[#F39C12]/60" />
                                {categoryCount} Categories
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button className="w-full py-2.5 rounded-lg bg-[#F39C12] hover:bg-[#D68910] transition-all text-white font-bold text-[11px] uppercase tracking-wider shadow-xs flex items-center justify-center gap-2">
                            Vote Now <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
