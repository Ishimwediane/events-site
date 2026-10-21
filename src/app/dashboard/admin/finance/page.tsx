"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, RefreshCw, ShieldCheck, Smartphone, Ticket, Vote, Wallet, X, Code2 } from "lucide-react";
import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";

/**
 * Finance: the money actually received (successful payments only) and how it
 * is shared — Weflexfy's fee, the developer's share and the host's revenue —
 * for the whole platform and for each event or voting campaign.
 * Data: GET /users/finance-summary/ (backend apps/payments/earnings.py).
 */

type Split = {
    received: number;
    phone: number; // MoMo on the website + USSD
    card: number;
    gateway: number;
    developer: number;
    host: number;
};

type Row = Split & {
    key: string;
    kind: "event" | "campaign";
    title: string;
    organizer: string;
    count: number; // tickets sold or vote payments
};

/** The bits of /users/finance-summary/ this page reads (numbers may arrive as strings). */
type Money = number | string;
type ApiSplit = { gateway?: Money; developer?: Money; host?: Money; by_method?: { mobile?: Money; ussd?: Money; card?: Money } };
type Shares = { gateway: Money; developer: Money; host: Money };
type FinanceData = {
    summary?: ApiSplit & { grand_total?: Money; shares?: Shares };
    ticket_by_event?: (ApiSplit & { event_id: string; event_title?: string; company_name?: string; revenue?: Money; tickets_sold?: number })[];
    voting_by_campaign?: (ApiSplit & { campaign_id: string; campaign_title?: string; company_name?: string; revenue?: Money; transactions?: number })[];
};
type User = { role?: string; first_name?: string };

const n = (v: unknown) => Number(v ?? 0) || 0;

function fmt(v: number) {
    return Math.round(v).toLocaleString("fr-FR");
}

function splitOf(r: (ApiSplit & Record<string, unknown>) | undefined, receivedField: string): Split {
    const m = r?.by_method ?? {};
    return {
        received: n(r?.[receivedField]),
        phone: n(m.mobile) + n(m.ussd),
        card: n(m.card),
        gateway: n(r?.gateway),
        developer: n(r?.developer),
        host: n(r?.host),
    };
}

export default function AdminFinancePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [data, setData] = useState<FinanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await api.get<FinanceData>("/users/finance-summary/");
            setData(res.data);
        } catch (e) {
            console.error("Failed to load finance data", e);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = authService.getUserFromStorage();
            if (!userData) { router.push("/login"); return; }
            if (userData.role !== "ADMIN") { router.push("/dashboard"); return; }
            setUser(userData);
            await fetchData();
            setIsLoading(false);
        };
        init();
    }, [router]);

    const shares: Shares = data?.summary?.shares ?? { gateway: 12, developer: 10, host: 78 };
    const total = useMemo(() => splitOf(data?.summary, "grand_total"), [data]);

    const rows: Row[] = useMemo(() => {
        const events: Row[] = (data?.ticket_by_event ?? []).map((e) => ({
            key: `event:${e.event_id}`, kind: "event", title: e.event_title || "—",
            organizer: e.company_name || "—", count: n(e.tickets_sold), ...splitOf(e, "revenue"),
        }));
        const campaigns: Row[] = (data?.voting_by_campaign ?? []).map((c) => ({
            key: `campaign:${c.campaign_id}`, kind: "campaign", title: c.campaign_title || "—",
            organizer: c.company_name || "—", count: n(c.transactions), ...splitOf(c, "revenue"),
        }));
        return [...events, ...campaigns].sort((a, b) => b.received - a.received);
    }, [data]);

    const current = rows.find((r) => r.key === selected) ?? null;

    if (isLoading && !data) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F39C12]"></div>
            </div>
        );
    }

    return (
        <>
            {/* Topbar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 py-4 bg-white border-b border-gray-100">
                <div>
                    <h1 className="text-lg font-bold text-gray-800 leading-tight">Finance</h1>
                    <p className="text-xs text-gray-400">Money actually received, and how it is shared</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0" style={{ background: "#F39C12" }}>
                        {user?.first_name?.[0] ?? "A"}
                    </div>
                </div>
            </header>

            <div className="flex-1 px-6 lg:px-10 py-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Whole platform */}
                <SplitCards title="All events and voting" split={total} shares={shares} />

                {/* One event or campaign */}
                {current && (
                    <div className="relative">
                        <button
                            onClick={() => setSelected(null)}
                            aria-label="Close"
                            className="absolute right-4 top-4 z-10 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <SplitCards
                            title={current.title}
                            subtitle={`${current.kind === "event" ? "Event" : "Voting campaign"} · ${current.organizer} · ${current.count} ${current.kind === "event" ? "tickets sold" : "vote payments"}`}
                            split={current}
                            shares={shares}
                        />
                    </div>
                )}

                {/* Every event and campaign */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#F39C12]" />
                        <h3 className="font-bold text-gray-900">By event and voting campaign</h3>
                        <span className="ml-auto text-xs text-gray-400 font-bold">Click a row for its details</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    {["Event / campaign", "Received", "By phone", "By card", `Weflexfy ${shares.gateway}%`, `Developer ${shares.developer}%`, "Your revenue"].map((h) => (
                                        <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rows.length === 0 ? (
                                    <tr><td colSpan={7} className="p-12 text-center text-gray-400">No payments received yet.</td></tr>
                                ) : rows.map((r) => (
                                    <tr
                                        key={r.key}
                                        onClick={() => setSelected(r.key === selected ? null : r.key)}
                                        className={`cursor-pointer transition-colors ${r.key === selected ? "bg-amber-50" : "hover:bg-gray-50/60"}`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {r.kind === "event"
                                                    ? <Ticket className="w-4 h-4 text-green-600 shrink-0" />
                                                    : <Vote className="w-4 h-4 text-[#F39C12] shrink-0" />}
                                                <span className="font-bold text-gray-900">{r.title}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5 ml-6">{r.kind === "event" ? "Event" : "Voting"} · {r.organizer}</p>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">{fmt(r.received)}</td>
                                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{fmt(r.phone)}</td>
                                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{fmt(r.card)}</td>
                                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{fmt(r.gateway)}</td>
                                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{fmt(r.developer)}</td>
                                        <td className="px-5 py-4 font-bold text-green-700 whitespace-nowrap">{fmt(r.host)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-50">Amounts in RWF. Only payments that went through are counted; tickets sold at the door are not. Weflexfy {shares.gateway}% and developer {shares.developer}% are taken only from payments made through Weflexfy (from October 2026); earlier payments through LMB are all yours.</p>
                </div>
            </div>
        </>
    );
}

function SplitCards({ title, subtitle, split, shares }: { title: string; subtitle?: string; split: Split; shares: Shares }) {
    const cards = [
        { label: "By phone (MoMo)", value: split.phone, icon: Smartphone, tone: "text-gray-900" },
        { label: "By card", value: split.card, icon: CreditCard, tone: "text-gray-900" },
        { label: `Weflexfy (${shares.gateway}%)`, value: split.gateway, icon: Landmark, tone: "text-gray-500" },
        { label: `Developer (${shares.developer}%)`, value: split.developer, icon: Code2, tone: "text-gray-500" },
    ];
    return (
        <div className="rounded-3xl overflow-hidden shadow-lg" style={{ background: "#08283B" }}>
            <div className="px-8 pt-7 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F39C12" }}>{title}</p>
                    {subtitle && <p className="text-white/40 text-xs font-medium mb-2">{subtitle}</p>}
                    <p className="text-white/60 text-sm font-medium">Total received</p>
                    <p className="text-4xl font-bold text-white">{fmt(split.received)} <span className="text-lg font-bold text-white/40">RWF</span></p>
                </div>
                <div className="sm:text-right">
                    <p className="text-sm font-medium text-green-300">Your revenue</p>
                    <p className="text-3xl font-bold text-green-400">{fmt(split.host)} <span className="text-base font-bold text-green-400/60">RWF</span></p>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border-t border-white/10">
                {cards.map((c) => (
                    <div key={c.label} className="bg-white px-5 py-4">
                        <div className="flex items-center gap-2 mb-1">
                            <c.icon className="w-4 h-4 text-gray-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{c.label}</span>
                        </div>
                        <p className={`text-xl font-bold ${c.tone}`}>{fmt(c.value)} <span className="text-xs font-bold text-gray-400">RWF</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
}
