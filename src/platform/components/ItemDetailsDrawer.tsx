"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

/* ── Design tokens (from Figma: ChainPilot / Item Details) ────────────── */
const C = {
    bg: "#fdfdfd",
    headerPrimary: "#041620",
    bodyPrimary: "#08283b",
    bodySecondary: "#395362",
    stroke: "#e6eaeb",
    expiryRed: "#c81e1e",
    btnDark: "#08283b",
    btnText: "#fdfdfd",
};

type BadgeTone = "purple" | "red" | "green";

const BADGE_TONES: Record<BadgeTone, { fill: string; stroke: string; text: string }> = {
    purple: { fill: "#edebfe", stroke: "#edebfe", text: "#5521b5" },
    red: { fill: "#fdf2f2", stroke: "#fde8e8", text: "#9b1c1c" },
    green: { fill: "#f3faf7", stroke: "#def7ec", text: "#03543f" },
};

export interface ItemDetailBadge {
    label: string;
    tone: BadgeTone;
}

export interface ItemDetailRow {
    label: string;
    value: React.ReactNode;
}

export interface ItemDetailsData {
    title: string;
    tags: ItemDetailBadge[];
    rows: ItemDetailRow[];
    itemProperties?: string[];
    stockLevelProperties?: ItemDetailRow[];
}

export interface ItemDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    item: ItemDetailsData;
    /** Footer confirm button label. */
    confirmLabel?: string;
    onConfirm?: () => void;
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function Badge({ label, tone }: ItemDetailBadge) {
    const c = BADGE_TONES[tone];
    return (
        <span
            className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium leading-normal whitespace-nowrap"
            style={{ backgroundColor: c.fill, borderColor: c.stroke, color: c.text }}
        >
            {label}
        </span>
    );
}

function DetailRow({ label, value }: ItemDetailRow) {
    return (
        <div
            className="flex items-end justify-center gap-10 border-b py-2"
            style={{ borderColor: C.stroke }}
        >
            <p
                className="flex-1 min-w-0 text-sm font-normal leading-normal"
                style={{ color: C.bodySecondary }}
            >
                {label}
            </p>
            <div
                className="flex-1 min-w-0 text-right text-sm font-medium leading-normal"
                style={{ color: C.bodyPrimary }}
            >
                {value}
            </div>
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm font-normal leading-normal" style={{ color: C.headerPrimary }}>
            {children}
        </p>
    );
}

/* ── Main drawer ──────────────────────────────────────────────────────── */

export default function ItemDetailsDrawer({
    isOpen,
    onClose,
    item,
    confirmLabel = "Ok, got it",
    onConfirm,
}: ItemDetailsDrawerProps) {
    // Lock body scroll + close on Escape while open (matches project modal pattern).
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", onKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => (onConfirm ? onConfirm() : onClose());

    return (
        <div className="fixed inset-0 z-[1000] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Item Details"
                className="relative flex h-full w-full max-w-[400px] flex-col gap-4 p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300"
                style={{ backgroundColor: C.bg }}
            >
                {/* Drawer header */}
                <div className="flex w-full shrink-0 flex-col border-b py-2" style={{ borderColor: C.stroke }}>
                    <div className="flex w-full items-center justify-between">
                        <p className="flex-1 text-base font-medium leading-normal" style={{ color: C.headerPrimary }}>
                            Item Details
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex size-6 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
                        >
                            <X size={20} style={{ color: C.headerPrimary }} />
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex w-full flex-1 flex-col gap-7 overflow-y-auto">
                    <div className="flex w-full flex-col gap-4">
                        {/* Title + tags */}
                        <div className="flex w-full flex-col gap-4 px-4">
                            <p className="text-base font-medium leading-normal" style={{ color: C.headerPrimary }}>
                                {item.title}
                            </p>
                            {item.tags.length > 0 && (
                                <div className="flex flex-wrap items-start gap-4">
                                    {item.tags.map((t, i) => (
                                        <Badge key={`${t.label}-${i}`} {...t} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Detail rows */}
                        <div className="flex w-full flex-col gap-5 px-3">
                            {item.rows.map((row, i) => (
                                <DetailRow key={`${row.label}-${i}`} {...row} />
                            ))}
                        </div>

                        {/* Item Properties */}
                        {item.itemProperties && item.itemProperties.length > 0 && (
                            <div className="flex w-full flex-col justify-center px-3">
                                <div className="flex w-full flex-col gap-2">
                                    <SectionHeader>Item Properties</SectionHeader>
                                    <div className="flex flex-wrap items-start gap-4">
                                        {item.itemProperties.map((p, i) => (
                                            <Badge key={`${p}-${i}`} label={p} tone="green" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stock level Properties */}
                        {item.stockLevelProperties && item.stockLevelProperties.length > 0 && (
                            <div className="flex w-full flex-col justify-center px-3">
                                <div className="flex w-full flex-col gap-2">
                                    <SectionHeader>Stock level Properties</SectionHeader>
                                    {item.stockLevelProperties.map((row, i) => (
                                        <div key={`${row.label}-${i}`} className="flex items-end justify-center gap-10 py-2">
                                            <p
                                                className="flex-1 min-w-0 text-sm font-normal leading-normal"
                                                style={{ color: C.bodySecondary }}
                                            >
                                                {row.label}
                                            </p>
                                            <div
                                                className="flex-1 min-w-0 text-right text-sm font-medium leading-normal"
                                                style={{ color: C.bodyPrimary }}
                                            >
                                                {row.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer action */}
                    <div className="flex w-full items-center justify-end">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium leading-normal transition-opacity hover:opacity-90"
                            style={{ backgroundColor: C.btnDark, color: C.btnText }}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}

/* ── Convenience default matching the Figma sample content ───────────────── */
export const SAMPLE_ITEM: ItemDetailsData = {
    title: "Plywood (18mm Birch)",
    tags: [
        { label: "Raw", tone: "purple" },
        { label: "imported", tone: "red" },
    ],
    rows: [
        { label: "Category", value: "Raw Materials" },
        { label: "Quantity", value: "20 (1/sheets)" },
        { label: "Unit price", value: "12 rfw" },
        { label: "Deductions", value: "--" },
        { label: "Net Value", value: "240 rfw" },
        { label: "Registered", value: "2026-01-05" },
        { label: "Reorder Level", value: "5pcs" },
        { label: "Registered By", value: "John Smith" },
        {
            label: "Expiry Date",
            value: (
                <div className="flex flex-col">
                    <span>22-06-2026</span>
                    <span style={{ color: "#c81e1e" }}>2 days remaining</span>
                </div>
            ),
        },
    ],
    itemProperties: ["Premium  A", "Thickness 0.99mm"],
    stockLevelProperties: [{ label: "Driver Name", value: "Baby Jet" }],
};
