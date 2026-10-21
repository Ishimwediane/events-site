"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, Zap, ZapOff } from "lucide-react";

interface Props {
    /** Fired once per accepted decode. The parent decides what to do with the code. */
    onDecode: (code: string) => void;
    /**
     * Suppress repeat decodes while the parent shows a result. A QR sitting in
     * frame decodes ~10x/second, which would otherwise hammer the API and make
     * every ticket look like a duplicate of itself.
     */
    paused?: boolean;
}

/**
 * Ignore a repeat of the same code for this long. Counted from the last decode
 * or from the moment a result is dismissed, whichever is later — long enough to
 * move the scanned ticket out of frame and the next one in.
 */
const REPEAT_COOLDOWN_MS = 3000;

export default function QrScanner({ onDecode, paused = false }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
    // Read inside the decode callback, which closes over its first render.
    const pausedRef = useRef(paused);

    const [error, setError] = useState("");
    const [starting, setStarting] = useState(true);
    const [torchOn, setTorchOn] = useState(false);
    const [torchAvailable, setTorchAvailable] = useState(false);

    useEffect(() => {
        pausedRef.current = paused;
        // Un-pausing means the operator just dismissed a result. Restart the
        // repeat cooldown from now, or the ticket still sitting in frame decodes
        // again immediately and reads back as a duplicate of itself.
        if (!paused) lastRef.current.at = Date.now();
    }, [paused]);

    const handleResult = useCallback(
        (text: string) => {
            if (pausedRef.current) return;
            const now = Date.now();
            const { code, at } = lastRef.current;
            if (text === code && now - at < REPEAT_COOLDOWN_MS) return;
            lastRef.current = { code: text, at: now };
            onDecode(text);
        },
        [onDecode]
    );

    useEffect(() => {
        let cancelled = false;
        const reader = new BrowserQRCodeReader();

        (async () => {
            try {
                // facingMode over an explicit deviceId: phones label their cameras
                // inconsistently, and "environment" is the one constraint they honour.
                const controls = await reader.decodeFromConstraints(
                    {
                        video: {
                            facingMode: { ideal: "environment" },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                        },
                    },
                    videoRef.current!,
                    (result) => {
                        if (result) handleResult(result.getText());
                    }
                );

                if (cancelled) {
                    controls.stop();
                    return;
                }
                controlsRef.current = controls;
                setStarting(false);

                // Torch matters at an outdoor gate after dark. Chrome on Android
                // exposes it; iOS Safari does not, so this stays hidden there.
                const track = (videoRef.current?.srcObject as MediaStream | null)
                    ?.getVideoTracks?.()[0];
                const caps = track?.getCapabilities?.() as
                    | (MediaTrackCapabilities & { torch?: boolean })
                    | undefined;
                if (caps?.torch) setTorchAvailable(true);
            } catch (err: unknown) {
                if (cancelled) return;
                const name = (err as { name?: string })?.name;
                setStarting(false);
                if (name === "NotAllowedError") {
                    setError(
                        "Camera permission was blocked. Allow camera access in your browser settings, then reload."
                    );
                } else if (name === "NotFoundError") {
                    setError("No camera found on this device.");
                } else {
                    setError(
                        "Could not start the camera. On phones this needs HTTPS — use the deployed site, not an http:// address."
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, [handleResult]);

    const toggleTorch = async () => {
        const track = (videoRef.current?.srcObject as MediaStream | null)
            ?.getVideoTracks?.()[0];
        if (!track) return;
        try {
            const next = !torchOn;
            await track.applyConstraints({
                advanced: [{ torch: next } as MediaTrackConstraintSet & { torch: boolean }],
            });
            setTorchOn(next);
        } catch {
            setTorchAvailable(false);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900 p-8 text-center">
                <CameraOff className="h-10 w-10 text-red-400" />
                <p className="max-w-xs text-sm text-slate-300">{error}</p>
                <p className="text-xs text-slate-500">
                    You can still check tickets in using the code entry below.
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
                ref={videoRef}
                className="aspect-[4/3] w-full object-cover"
                muted
                playsInline
            />

            {/* Framing guide — gives the operator something to aim with. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48">
                    {[
                        "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
                        "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
                        "left-0 bottom-0 border-b-4 border-l-4 rounded-bl-lg",
                        "right-0 bottom-0 border-b-4 border-r-4 rounded-br-lg",
                    ].map((cls) => (
                        <span key={cls} className={`absolute h-8 w-8 border-white/80 ${cls}`} />
                    ))}
                </div>
            </div>

            {starting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80">
                    <Camera className="h-8 w-8 animate-pulse text-white" />
                    <p className="text-sm text-slate-300">Starting camera…</p>
                </div>
            )}

            {torchAvailable && (
                <button
                    type="button"
                    onClick={toggleTorch}
                    aria-label={torchOn ? "Turn torch off" : "Turn torch on"}
                    className="absolute bottom-3 right-3 rounded-full bg-white/15 p-3 backdrop-blur transition hover:bg-white/25"
                >
                    {torchOn ? (
                        <ZapOff className="h-5 w-5 text-white" />
                    ) : (
                        <Zap className="h-5 w-5 text-white" />
                    )}
                </button>
            )}
        </div>
    );
}
