"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, KeyRound, LogOut, RefreshCw, XCircle } from "lucide-react";

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

const REFUSED_TITLE: Record<string, string> = {
    ALREADY_USED: "This ticket was already used",
    WRONG_EVENT: "This ticket is for another event",
    NOT_FOUND: "Unknown ticket code",
};

/**
 * The door scanner: navy phone screens from the dashboard design. Choose the
 * event → scan → green "Let them in" or full red "Stop" → next person.
 */
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
        setShowManual(false);
        await submitCode(code);
        setManualCode("");
    };

    const signOut = () => {
        authService.logout();
    };

    if (checkingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#08283B] text-[#C9D4DC]">
                <RefreshCw className="h-6 w-6 animate-spin" />
            </main>
        );
    }

    // ── 1 · choose the event ──────────────────────────────────────────────
    if (!event) {
        return (
            <main className="min-h-screen bg-[#08283B] font-body text-white">
                <div className="mx-auto flex min-h-screen max-w-md flex-col gap-[18px] px-[18px] py-7">
                    <Brand email={authService.getUserFromStorage()?.email ?? ""} />
                    <h1 className="mt-2 font-heading text-[26px] font-bold leading-tight">Which event are you at?</h1>
                    <p className="text-sm text-[#C9D4DC]">You only see events you were given access to.</p>

                    {loadError && (
                        <p className="rounded-xl bg-[#B42318]/25 p-3 text-sm text-white">{loadError}</p>
                    )}

                    {!loadError && events.length === 0 && (
                        <div className="rounded-2xl bg-[#0F3A52] p-6 text-center">
                            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-[#F7B84B]" />
                            <p className="text-sm text-[#C9D4DC]">
                                You are not assigned to any event yet.
                            </p>
                        </div>
                    )}

                    <ul className="flex flex-col gap-3">
                        {events.map((e) => (
                            <li key={e.id}>
                                <button
                                    onClick={() => {
                                        unlockAudio();
                                        setEvent(e);
                                    }}
                                    className="flex w-full flex-col gap-1 rounded-2xl bg-[#0F3A52] p-4 text-left transition hover:bg-[#174A66]"
                                >
                                    <span className="text-base font-bold">{e.title}</span>
                                    <span className="text-[13px] text-[#C9D4DC]">
                                        {e.start_date
                                            ? new Date(e.start_date).toLocaleDateString("en-GB", {
                                                  weekday: "short",
                                                  day: "numeric",
                                                  month: "short",
                                              })
                                            : ""}
                                        {e.location ? ` · ${e.location}` : ""}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto flex flex-col gap-2.5 pt-6">
                        <p className="text-center text-[13px] text-[#C9D4DC]">
                            No event here? Ask the organiser to give your email door access.
                        </p>
                        <button
                            onClick={signOut}
                            className="flex items-center justify-center gap-2 rounded-xl border border-[#3B5B6E] py-3 text-sm font-semibold text-white"
                        >
                            <LogOut className="h-4 w-4" /> Sign out
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // ── 3 · Stop: full red screen ─────────────────────────────────────────
    if (result && result.result !== "ADMITTED") {
        return (
            <main role="status" aria-live="assertive" className="min-h-screen bg-[#B42318] font-body text-white">
                <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-[22px] pb-7 pt-16">
                    <div className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white text-[#B42318]">
                        <XCircle className="h-12 w-12" />
                    </div>
                    <h1 className="text-center font-heading text-[44px] font-bold leading-none">Stop</h1>
                    <p className="text-center text-xl font-semibold">
                        {REFUSED_TITLE[result.result] ?? "Do not let them in"}
                    </p>
                    <div className="flex flex-col gap-1.5 rounded-2xl bg-black/20 p-4 text-[15px]">
                        <span>{result.message}</span>
                        {result.result === "ALREADY_USED" && result.checked_in_at && (
                            <span>
                                First scanned at{" "}
                                <b>
                                    {new Date(result.checked_in_at).toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </b>
                                {result.checked_in_by ? (
                                    <>
                                        {" "}by <b>{result.checked_in_by}</b>
                                    </>
                                ) : null}
                            </span>
                        )}
                        {result.ticket && (
                            <span>
                                {result.ticket.full_name || "Guest"} · {result.ticket.ticket_type}
                                {result.ticket.is_hard ? " · printed ticket" : ""}
                            </span>
                        )}
                        {result.ticket && <span className="font-mono text-xs opacity-80">{result.ticket.code}</span>}
                    </div>
                    <button
                        onClick={() => setResult(null)}
                        className="mt-auto rounded-[14px] bg-white p-4 text-base font-bold text-[#7A1B12]"
                    >
                        Close and scan next
                    </button>
                </div>
            </main>
        );
    }

    // ── 4 · type the code ────────────────────────────────────────────────
    if (showManual) {
        return (
            <main className="min-h-screen bg-[#08283B] font-body text-white">
                <form onSubmit={submitManual} className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-[18px] py-6">
                    <button type="button" onClick={() => setShowManual(false)} className="self-start text-sm font-semibold text-[#F7B84B]">
                        ← Back to camera
                    </button>
                    <h1 className="font-heading text-[26px] font-bold">Type the ticket code</h1>
                    <p className="text-sm text-[#C9D4DC]">
                        When the QR is torn or the phone screen is too dark. The code is printed under the QR.
                    </p>
                    <label htmlFor="manual-code" className="flex flex-col gap-2 text-[13px] font-semibold text-[#C9D4DC]">
                        Ticket code
                        <div className="flex items-center gap-2 rounded-[14px] bg-white px-3.5">
                            <span className="text-lg font-semibold text-[#5B6472]">TICK-</span>
                            <input
                                id="manual-code"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="XXXXXX"
                                autoCapitalize="characters"
                                autoComplete="off"
                                autoFocus
                                className="min-w-0 flex-1 border-0 bg-transparent py-4 text-xl font-semibold uppercase tracking-[0.08em] text-[#111827] outline-hidden"
                            />
                        </div>
                    </label>
                    <button
                        type="submit"
                        disabled={busy || !manualCode.trim()}
                        className="rounded-[14px] bg-[#F39C12] p-4 text-base font-bold text-[#111827] disabled:opacity-50"
                    >
                        Check ticket
                    </button>
                    <div className="mt-2 flex flex-col gap-2 rounded-[14px] bg-[#0F3A52] p-3.5 text-[13px] text-[#C9D4DC]">
                        <b className="text-white">What the colours mean</b>
                        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#10A35C]" />Green: let them in</span>
                        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#EF4444]" />Red: stop. Already used, other event or unknown code</span>
                    </div>
                </form>
            </main>
        );
    }

    // ── 2 · scanning ─────────────────────────────────────────────────────
    const admitted = result?.result === "ADMITTED";

    return (
        <main className="min-h-screen bg-[#08283B] font-body text-white">
            <div className="mx-auto flex min-h-screen max-w-md flex-col gap-3.5 px-4 py-5">
                <header className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                        <h1 className="truncate font-heading text-[17px] font-bold">{event.title}</h1>
                        <p className="text-xs text-[#C9D4DC]">Door scanner</p>
                    </div>
                    {events.length > 1 && (
                        <button
                            onClick={() => {
                                setEvent(null);
                                setResult(null);
                            }}
                            className="shrink-0 rounded-[10px] border border-[#3B5B6E] px-3 py-2 text-[13px] font-semibold"
                        >
                            Change
                        </button>
                    )}
                </header>

                {stats && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <Stat label="Inside" value={stats.checked_in} tone="text-[#6EE7B7]" />
                        <Stat label="Expected" value={stats.remaining} tone="text-white" />
                        <Stat label="Tickets" value={stats.total} tone="text-white" />
                    </div>
                )}

                <QrScanner onDecode={submitCode} paused={busy || result !== null} />
                {!admitted && (
                    <p className="text-center text-[13px] text-[#C9D4DC]">Point the camera at the QR code</p>
                )}

                {admitted && result && (
                    <div role="status" aria-live="assertive" className="flex flex-col gap-1 rounded-[18px] bg-[#0E9F6E] p-4">
                        <div className="flex items-center gap-2 font-heading text-2xl font-bold">
                            <CheckCircle2 className="h-6 w-6" /> Let them in
                        </div>
                        {result.ticket ? (
                            <div className="text-sm">
                                {result.ticket.full_name || "Guest"} · {result.ticket.ticket_type}
                                {result.ticket.is_hard ? " · printed ticket" : ""}
                            </div>
                        ) : (
                            <div className="text-sm">{result.message}</div>
                        )}
                        <button
                            onClick={() => setResult(null)}
                            className="mt-2 rounded-xl bg-white p-3 text-[15px] font-bold text-[#064E3B]"
                        >
                            Next person
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#3B5B6E] p-3 text-sm font-semibold"
                    >
                        <KeyRound className="h-4 w-4" /> Type the code
                    </button>
                    <button
                        onClick={signOut}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#3B5B6E] p-3 text-sm font-semibold"
                    >
                        <LogOut className="h-4 w-4" /> Sign out
                    </button>
                </div>
                <p className="text-center text-xs text-[#C9D4DC]/80">
                    Torch: tap the lightning button on the camera (when the phone supports it).
                </p>
            </div>
        </main>
    );
}

function Brand({ email }: { email: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F39C12] font-heading text-lg font-bold text-[#08283B]">
                O
            </div>
            <div className="min-w-0">
                <div className="font-heading text-[17px] font-bold">Door scanner</div>
                <div className="truncate text-xs text-[#C9D4DC]">{email ? `Signed in as ${email}` : "Ozone Events"}</div>
            </div>
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className="rounded-xl bg-[#0F3A52] py-2.5">
            <p className={`font-heading text-[22px] font-bold tabular-nums ${tone}`}>{value}</p>
            <p className="text-[11px] text-[#C9D4DC]">{label}</p>
        </div>
    );
}
