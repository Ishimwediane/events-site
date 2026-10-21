"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    CheckCircle2,
    KeyRound,
    LogOut,
    RefreshCw,
    ScanLine,
    X,
    XCircle,
} from "lucide-react";

import QrScanner from "@/platform/components/QrScanner";
import { authService } from "@/platform/services/auth.service";
import {
    gateService,
    type GateEvent,
    type GateStats,
    type ScanResponse,
} from "@/platform/services/gate.service";
import { signalAdmitted, signalRefused, unlockAudio } from "@/platform/lib/gateFeedback";

const ROLES_THAT_SCAN = ["GATE_STAFF", "COMPANY", "ADMIN"];

export default function ScanPage() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [events, setEvents] = useState<GateEvent[]>([]);
    const [event, setEvent] = useState<GateEvent | null>(null);
    const [stats, setStats] = useState<GateStats | null>(null);
    const [loadError, setLoadError] = useState("");

    const [result, setResult] = useState<ScanResponse | null>(null);
    const [busy, setBusy] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [showManual, setShowManual] = useState(false);

    // ── auth guard ────────────────────────────────────────────────────────
    useEffect(() => {
        const user = authService.getUserFromStorage();
        if (!user) {
            router.replace("/login");
            return;
        }
        if (!ROLES_THAT_SCAN.includes(user.role)) {
            router.replace("/");
            return;
        }
        setCheckingAuth(false);
    }, [router]);

    // ── which events can this device admit for ────────────────────────────
    useEffect(() => {
        if (checkingAuth) return;
        (async () => {
            try {
                const list = await gateService.getEvents();
                setEvents(list);
                // One event assigned is the common case for hired door staff —
                // skip a picker with a single option on it.
                if (list.length === 1) setEvent(list[0]);
            } catch {
                setLoadError("Could not load your events. Check your connection and retry.");
            }
        })();
    }, [checkingAuth]);

    useEffect(() => {
        if (!event) return;
        gateService
            .getStats(event.id)
            .then((r) => setStats(r.stats))
            .catch(() => undefined);
    }, [event]);

    const submitCode = useCallback(
        async (code: string) => {
            if (!event || busy) return;
            setBusy(true);
            try {
                const res = await gateService.scan(event.id, code);
                setResult(res);
                setStats(res.stats);
                if (res.result === "ADMITTED") signalAdmitted();
                else signalRefused();
                // No auto-dismiss: the result stays until the operator closes it,
                // so a disputed ticket can be read out in full at the door.
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                const detail = (err as { response?: { data?: { error?: string } } })?.response?.data
                    ?.error;
                signalRefused();
                setResult({
                    result: "NOT_FOUND",
                    message:
                        detail ??
                        (status
                            ? `Server refused the scan (${status}).`
                            : "No connection to the server — the scan was not recorded."),
                    ticket: null,
                    stats: stats ?? { total: 0, checked_in: 0, remaining: 0 },
                });
            } finally {
                setBusy(false);
            }
        },
        [event, busy, stats]
    );

    const submitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualCode.trim();
        if (!code) return;
        unlockAudio();
        await submitCode(code);
        setManualCode("");
    };

    if (checkingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin" />
            </main>
        );
    }

    // ── event picker ──────────────────────────────────────────────────────
    if (!event) {
        return (
            <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
                <div className="mx-auto max-w-md">
                    <header className="mb-8 text-center">
                        <ScanLine className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                        <h1 className="text-2xl font-semibold">Gate check-in</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Choose the event you are admitting for.
                        </p>
                    </header>

                    {loadError && (
                        <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                            {loadError}
                        </p>
                    )}

                    {!loadError && events.length === 0 && (
                        <div className="rounded-2xl bg-slate-900 p-6 text-center">
                            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
                            <p className="text-sm text-slate-300">
                                You are not assigned to any event yet. Ask the organizer to give your
                                account gate access.
                            </p>
                        </div>
                    )}

                    <ul className="space-y-3">
                        {events.map((e) => (
                            <li key={e.id}>
                                <button
                                    onClick={() => {
                                        unlockAudio();
                                        setEvent(e);
                                    }}
                                    className="w-full rounded-2xl bg-slate-900 p-4 text-left transition hover:bg-slate-800"
                                >
                                    <p className="font-medium">{e.title}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {e.location}
                                        {e.start_date
                                            ? ` · ${new Date(e.start_date).toLocaleDateString()}`
                                            : ""}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => authService.logout()}
                        className="mx-auto mt-8 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                </div>
            </main>
        );
    }

    // ── scanning ──────────────────────────────────────────────────────────
    const admitted = result?.result === "ADMITTED";

    return (
        <main className="min-h-screen bg-slate-950 pb-10 text-white">
            <div className="mx-auto max-w-md px-4 py-5">
                <header className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold">{event.title}</h1>
                        <p className="text-xs text-slate-400">{event.location}</p>
                    </div>
                    {events.length > 1 && (
                        <button
                            onClick={() => {
                                setEvent(null);
                                setResult(null);
                            }}
                            className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                        >
                            Change
                        </button>
                    )}
                </header>

                {stats && (
                    <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                        <Stat label="Inside" value={stats.checked_in} tone="text-emerald-400" />
                        <Stat label="Expected" value={stats.remaining} tone="text-slate-300" />
                        <Stat label="Total sold" value={stats.total} tone="text-slate-300" />
                    </div>
                )}

                <div className="relative">
                    <QrScanner onDecode={submitCode} paused={busy || result !== null} />

                    {result && (
                        <div
                            role="status"
                            aria-live="assertive"
                            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center ${
                                admitted ? "bg-emerald-600" : "bg-red-600"
                            }`}
                        >
                            {admitted ? (
                                <CheckCircle2 className="h-16 w-16" />
                            ) : (
                                <XCircle className="h-16 w-16" />
                            )}
                            <p className="text-2xl font-bold uppercase tracking-wide">
                                {admitted ? "Let them in" : "Stop"}
                            </p>
                            <p className="text-sm font-medium">{result.message}</p>

                            {result.ticket && (
                                <div className="mt-1 space-y-0.5 text-sm">
                                    <p className="font-semibold">
                                        {result.ticket.full_name || "Guest"}
                                    </p>
                                    <p className="opacity-90">
                                        {result.ticket.ticket_type}
                                        {result.ticket.is_hard ? " · physical ticket" : ""}
                                    </p>
                                    <p className="font-mono text-xs opacity-75">
                                        {result.ticket.code}
                                    </p>
                                </div>
                            )}

                            {result.result === "ALREADY_USED" && result.checked_in_at && (
                                <p className="mt-1 text-xs opacity-90">
                                    First scanned{" "}
                                    {new Date(result.checked_in_at).toLocaleTimeString()}
                                    {result.checked_in_by ? ` by ${result.checked_in_by}` : ""}
                                </p>
                            )}

                            <button
                                onClick={() => setResult(null)}
                                className="mt-4 w-full max-w-[16rem] rounded-xl bg-black/30 px-5 py-3 text-base font-semibold transition active:bg-black/45"
                            >
                                Close
                            </button>
                            <p className="text-[11px] opacity-75">
                                Scanning is paused until you close this.
                            </p>

                            {/* Second way out, for a thumb already up at the corner. */}
                            <button
                                onClick={() => setResult(null)}
                                aria-label="Close result"
                                className="absolute right-2 top-2 rounded-full bg-black/25 p-2.5 transition active:bg-black/45"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>

                <p className="mt-3 text-center text-xs text-slate-500">
                    Hold the ticket&apos;s QR code inside the frame.
                </p>

                {/* Manual entry: creased tickets, cracked phone screens, dead camera. */}
                <div className="mt-6">
                    {showManual ? (
                        <form onSubmit={submitManual} className="space-y-2">
                            <label
                                htmlFor="manual-code"
                                className="block text-xs font-medium text-slate-400"
                            >
                                Type the code printed on the ticket
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="manual-code"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="TICK-1A2B3C4D"
                                    autoCapitalize="characters"
                                    autoComplete="off"
                                    className="flex-1 rounded-lg bg-slate-900 px-3 py-2.5 font-mono text-sm uppercase outline-hidden ring-1 ring-slate-700 focus:ring-emerald-500"
                                />
                                <button
                                    type="submit"
                                    disabled={busy || !manualCode.trim()}
                                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium disabled:opacity-40"
                                >
                                    Check
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">
                                The <span className="font-mono">TICK-</span> prefix is optional.
                            </p>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowManual(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm text-slate-300 hover:bg-slate-800"
                        >
                            <KeyRound className="h-4 w-4" /> Enter code by hand
                        </button>
                    )}
                </div>

                <button
                    onClick={() => authService.logout()}
                    className="mx-auto mt-8 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
                >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
            </div>
        </main>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className="rounded-xl bg-slate-900 py-2.5">
            <p className={`text-xl font-semibold ${tone}`}>{value}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        </div>
    );
}
