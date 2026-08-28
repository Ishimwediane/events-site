"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [form, setForm] = useState({ ...EMPTY, subject: defaultSubject });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function field(key: keyof typeof EMPTY) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setStatus({ kind: "sent" });
        setForm({ ...EMPTY });
      } else {
        setStatus({
          kind: "error",
          message: data?.message ?? "Could not send your message. Please try again.",
        });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-[var(--orange-accent)] text-center px-8">
        <CheckCircle2 className="w-14 h-14 text-[var(--orange-accent)]" />
        <h3 className="text-xl font-semibold text-[var(--primary-blue)]">Message sent</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Thanks for reaching out — we will get back to you within 24 hours.
        </p>
        <button
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-2 text-sm font-semibold text-[var(--orange-accent)] underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-name" className="sr-only">
            Name
          </label>
          <input id="cf-name" required placeholder="Name" className="field" {...field("name")} />
        </div>
        <div>
          <label htmlFor="cf-email" className="sr-only">
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            required
            placeholder="Email"
            className="field"
            {...field("email")}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-phone" className="sr-only">
            Phone number
          </label>
          <input
            id="cf-phone"
            type="tel"
            placeholder="Phone Number"
            className="field"
            {...field("phone")}
          />
        </div>
        <div>
          <label htmlFor="cf-subject" className="sr-only">
            Subject
          </label>
          <input
            id="cf-subject"
            required
            placeholder="Subject"
            className="field"
            {...field("subject")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="sr-only">
          Message
        </label>
        <textarea
          id="cf-message"
          required
          rows={6}
          placeholder="Message"
          className="field resize-none"
          {...field("message")}
        />
      </div>

      {status.kind === "error" && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{status.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status.kind === "sending"}
        className="w-full bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-8 py-4 rounded-lg transition-all disabled:opacity-50 text-sm font-semibold uppercase tracking-wider shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {status.kind === "sending" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send Message
          </>
        )}
      </button>
    </form>
  );
}
