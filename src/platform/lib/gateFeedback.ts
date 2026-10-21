/**
 * Audible and haptic feedback for the gate scanner.
 *
 * At a real door the operator is looking at the crowd, not the screen, so the
 * sound is the primary signal and the colour is confirmation. Tones are
 * synthesised rather than loaded as files: no assets to ship, and no chance of a
 * silent gate because a network request for an mp3 failed.
 *
 * iOS Safari refuses to start an AudioContext outside a user gesture, so
 * `unlockAudio()` must be called from a real tap (the "start scanning" button).
 */

type Ctx = AudioContext & { resume: () => Promise<void> };

let ctx: Ctx | null = null;

function getCtx(): Ctx | null {
    if (typeof window === "undefined") return null;
    if (ctx) return ctx;
    const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor() as Ctx;
    return ctx;
}

/** Call from a user gesture before scanning starts, or phones will stay mute. */
export function unlockAudio() {
    const c = getCtx();
    if (c && c.state === "suspended") void c.resume();
}

function tone(freq: number, startAt: number, duration: number, gain = 0.25) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const vol = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    // Ramp instead of a hard stop — an abrupt cut clicks on phone speakers.
    vol.gain.setValueAtTime(0, c.currentTime + startAt);
    vol.gain.linearRampToValueAtTime(gain, c.currentTime + startAt + 0.01);
    vol.gain.linearRampToValueAtTime(0, c.currentTime + startAt + duration);
    osc.connect(vol).connect(c.destination);
    osc.start(c.currentTime + startAt);
    osc.stop(c.currentTime + startAt + duration + 0.02);
}

function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

/** Rising two-note chirp — "in you go". */
export function signalAdmitted() {
    tone(880, 0, 0.09);
    tone(1320, 0.1, 0.12);
    vibrate(60);
}

/** Low buzz, deliberately unpleasant and clearly different from the chirp. */
export function signalRefused() {
    tone(220, 0, 0.18, 0.3);
    tone(180, 0.2, 0.28, 0.3);
    vibrate([100, 70, 100]);
}
