"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    RefreshCw,
    RotateCcw,
    ScanLine,
    Search,
    XCircle,
} from "lucide-react";

import {
    gateService,
    type GateEvent,
    type GateReport,
    type ReportScan,
} from "@/platform/services/gate.service";

/** Refresh cadence while a gate is running. Slow enough not to hammer the API. */
const POLL_MS = 15000;

const RESULT_META: Record<string, { label: string; className: string }> = {
    ADMITTED: { label: "Admitted", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    ALREADY_USED: { label: "Already used", className: "bg-red-50 text-red-700 ring-red-200" },
    WRONG_EVENT: { label: "Wrong event", className: "bg-amber-50 text-amber-700 ring-amber-200" },
    NOT_FOUND: { label: "Unknown code", className: "bg-slate-100 text-slate-600 ring-slate-200" },
    UNDONE: { label: "Check-in reversed", className: "bg-sky-50 text-sky-700 ring-sky-200" },
};

const FILTERS = [
    { key: "", label: "All" },
    { key: "ADMITTED", label: "Admitted" },
    { key: "ALREADY_USED", label: "Duplicates" },
    { key: "WRONG_EVENT", label: "Wrong event" },
    { key: "NOT_FOUND", label: "Unknown" },
];

export default function CheckInsPage() {
    const [events, setEvents] = useState<GateEvent[]>([]);
    const [eventId, setEventId] = useState("");
    const [report, setReport] = useState<GateReport | null>(null);
    const [filter, setFilter] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [undoing, setUndoing] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const list = await gateService.getEvents();
                setEvents(list);
                if (list.length) setEventId(list[0].id);
                else setLoading(false);
            } catch {
                setError("Could not load your events.");
                setLoading(false);
            }
        })();
    }, []);

    const load = useCallback(
        async (opts: { quiet?: boolean } = {}) => {
            if (!eventId) return;
            if (!opts.quiet) setLoading(true);
            try {
                setReport(await gateService.getReport(eventId, { result: filter, limit: 300 }));
                setError("");
            } catch (err: unknown) {
                const code = (err as { response?: { status?: number } })?.response?.status;
                setError(
                    code === 403
                        ? "You do not have permission to view check-in records for this event."
                        : "Could not load check-in records."
                );
            } finally {
                setLoading(false);
            }
        },
        [eventId, filter]
    );

    useEffect(() => {
        void load();
    }, [load]);

    // Keep the numbers current during a live gate without a manual refresh.
    useEffect(() => {
        if (!eventId) return;
        const t = setInterval(() => void load({ quiet: true }), POLL_MS);
        return () => clearInterval(t);
    }, [eventId, load]);

    const undo = async (scan: ReportScan) => {
        if (!report) return;
        const ok = window.confirm(
            `Reverse the check-in for ${scan.full_name || scan.code}?\n\n` +
            `The ticket becomes valid again and can be scanned at the gate.`
        );
        if (!ok) return;
        setUndoing(scan.code);
        try {
            await gateService.undo(report.event.id, scan.code);
            await load({ quiet: true });
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            window.alert(detail || "Could not reverse that check-in.");
        } finally {
            setUndoing("");
        }
    };

    const exportCsv = () => {
        if (!report) return;
        const header = ["time", "result", "code", "name", "email", "tier", "physical", "scanned_by"];
        const rows = visible.map((s) => [
            new Date(s.created_at).toISOString(),
            s.result,
            s.code,
            s.full_name,
            s.email,
            s.ticket_type,
            s.is_hard ? "yes" : "no",
            s.scanned_by,
        ]);
        // Quote every field: names and emails can contain commas.
        const csv = [header, ...rows]
            .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `checkins-${report.event.title.replace(/[^\w]+/g, "-").toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const needle = query.trim().toLowerCase();
    const visible = (report?.scans ?? []).filter((s) =>
        !needle ||
        s.code.toLowerCase().includes(needle) ||
        s.full_name.toLowerCase().includes(needle) ||
        s.email.toLowerCase().includes(needle)
    );

    const pct = report && report.stats.total
        ? Math.round((report.stats.checked_in / report.stats.total) * 100)
        : 0;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                        <ScanLine className="h-6 w-6 text-emerald-600" /> Gate check-ins
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Every scan at the door, admitted or refused. Updates automatically.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {events.length > 1 && (
                        <select
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => void load()}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button
                        onClick={exportCsv}
                        disabled={!visible.length}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-40"
                    >
                        <Download className="h-4 w-4" /> CSV
                    </button>
                </div>
            </header>

            {error && (
                <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </p>
            )}

            {!error && !events.length && !loading && (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    No events yet, so there is nothing to check in.
                </p>
            )}

            {report && (
                <>
                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Card label="Inside now" value={report.stats.checked_in} accent="text-emerald-600">
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{pct}% of tickets arrived</p>
                        </Card>
                        <Card label="Not yet arrived" value={report.stats.remaining} accent="text-slate-900" />
                        <Card label="Tickets issued" value={report.stats.total} accent="text-slate-900" />
                        <Card
                            label="Duplicate attempts"
                            value={report.result_counts.ALREADY_USED ?? 0}
                            accent={(report.result_counts.ALREADY_USED ?? 0) > 0 ? "text-red-600" : "text-slate-900"}
                        >
                            <p className="mt-1 text-xs text-slate-500">
                                {(report.result_counts.ALREADY_USED ?? 0) > 0
                                    ? "Someone presented a ticket twice"
                                    : "No ticket presented twice"}
                            </p>
                        </Card>
                    </section>

                    {report.tiers.length > 0 && (
                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <h2 className="mb-3 text-sm font-semibold text-slate-900">Arrivals by tier</h2>
                            <div className="space-y-3">
                                {report.tiers.map((t) => {
                                    const p = t.total ? Math.round((t.checked_in / t.total) * 100) : 0;
                                    return (
                                        <div key={t.name}>
                                            <div className="flex items-baseline justify-between text-sm">
                                                <span className="font-medium text-slate-700">{t.name}</span>
                                                <span className="text-slate-500">
                                                    {t.checked_in} / {t.total}
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    style={{ width: `${p}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                            <div className="flex flex-wrap gap-1.5">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                            filter === f.key
                                                ? "bg-slate-900 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {f.label}
                                        {f.key && report.result_counts[f.key] != null && (
                                            <span className="ml-1 opacity-70">
                                                {report.result_counts[f.key]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="relative ml-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search name, email or code"
                                    className="w-60 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-hidden focus:border-slate-400"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2.5 font-medium">Time</th>
                                        <th className="px-4 py-2.5 font-medium">Result</th>
                                        <th className="px-4 py-2.5 font-medium">Attendee</th>
                                        <th className="px-4 py-2.5 font-medium">Tier</th>
                                        <th className="px-4 py-2.5 font-medium">Code</th>
                                        <th className="px-4 py-2.5 font-medium">Scanned by</th>
                                        <th className="px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visible.map((s) => {
                                        const meta = RESULT_META[s.result] ?? {
                                            label: s.result,
                                            className: "bg-slate-100 text-slate-600 ring-slate-200",
                                        };
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/60">
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                                    {new Date(s.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.className}`}
                                                    >
                                                        {s.result === "ADMITTED" ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : s.result === "UNDONE" ? (
                                                            <RotateCcw className="h-3 w-3" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3" />
                                                        )}
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-800">
                                                        {s.full_name || <span className="text-slate-400">—</span>}
                                                    </p>
                                                    {s.email && (
                                                        <p className="text-xs text-slate-500">{s.email}</p>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                    {s.ticket_type || "—"}
                                                    {s.is_hard && (
                                                        <span className="ml-1.5 rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                                                            physical
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                                                    {s.code}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {s.scanned_by || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {s.result === "ADMITTED" && (
                                                        <button
                                                            onClick={() => void undo(s)}
                                                            disabled={undoing === s.code}
                                                            title="Reverse this check-in"
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-40"
                                                        >
                                                            <RotateCcw className="h-3 w-3" /> Undo
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {!visible.length && (
                            <p className="p-8 text-center text-sm text-slate-500">
                                {report.total_scans === 0
                                    ? "No scans recorded yet. The log fills up as the gate runs."
                                    : "No rows match that search."}
                            </p>
                        )}

                        {report.total_scans > report.scans.length && (
                            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                                Showing the {report.scans.length} most recent of {report.total_scans} scans.
                            </p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

function Card({
    label,
    value,
    accent,
    children,
}: {
    label: string;
    value: number;
    accent: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
            {children}
        </div>
    );
}
