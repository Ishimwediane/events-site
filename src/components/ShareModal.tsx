"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Facebook, Linkedin, Mail, MessageCircle, MessageSquare, Share2, Twitter } from "lucide-react";
import { Shell } from "./PaymentModal";

/**
 * "Share and get votes": one popup for sharing a nominee or a category —
 * WhatsApp first (what people in Rwanda use), the usual networks, SMS, email,
 * a QR code for posters and screens, and a copy-able link. On phones the
 * system share sheet is offered too.
 */
export default function ShareModal({
  title,
  text,
  url,
  onClose,
}: {
  /** Popup heading, e.g. "Share Test Artist Uwase". */
  title: string;
  /** The message that goes with the link. */
  text: string;
  url: string;
  onClose: () => void;
}) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    let live = true;
    QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#08283B", light: "#ffffff" } })
      .then((svg) => live && setQr(svg))
      .catch(() => live && setQr(""));
    Promise.resolve().then(() => live && setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator));
    return () => {
      live = false;
    };
  }, [url]);

  const message = `${text} ${url}`;
  const enc = encodeURIComponent;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const targets: { label: string; className: string; icon: React.ReactNode; href: string }[] = [
    { label: "WhatsApp", className: "bg-[#25D366] hover:bg-[#1DA851]", icon: <MessageCircle className="w-[18px] h-[18px]" />, href: `https://wa.me/?text=${enc(message)}` },
    { label: "Facebook", className: "bg-[#1877F2] hover:bg-[#0F65D6]", icon: <Facebook className="w-5 h-5" />, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "X", className: "bg-[#08283B] hover:bg-[#06192A]", icon: <Twitter className="w-5 h-5" />, href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: "LinkedIn", className: "bg-[#0A66C2] hover:bg-[#08519A]", icon: <Linkedin className="w-5 h-5" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "SMS", className: "bg-gray-500 hover:bg-gray-600", icon: <MessageSquare className="w-5 h-5" />, href: `sms:?&body=${enc(message)}` },
    { label: "Email", className: "bg-gray-700 hover:bg-gray-800", icon: <Mail className="w-5 h-5" />, href: `mailto:?subject=${enc(text)}&body=${enc(message)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is selectable in the field */
    }
  }

  return (
    <Shell title={title} subtitle="Share and get more votes" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-center gap-2.5">
          {targets.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => (t.href.startsWith("http") ? open(t.href) : (window.location.href = t.href))}
              aria-label={`Share on ${t.label}`}
              title={t.label}
              className={`w-10 h-10 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:shadow-md ${t.className}`}
            >
              {t.icon}
            </button>
          ))}
          {canNativeShare && (
            <button
              type="button"
              onClick={() => navigator.share({ title, text, url }).catch(() => {})}
              aria-label="More sharing options"
              title="More"
              className="w-10 h-10 rounded-full bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white flex items-center justify-center transition-all duration-300 hover:shadow-md"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {qr && (
          <div className="flex justify-center">
            <div
              className="w-44 h-44 p-3 bg-white rounded-lg border border-gray-100 shadow-sm [&>svg]:w-full [&>svg]:h-full"
              role="img"
              aria-label="QR code of the link"
              // Generated locally from our own URL by the qrcode library.
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          </div>
        )}

        <div>
          <label htmlFor="share-link" className="block text-sm font-semibold text-[var(--primary-blue)] mb-2">
            Copy link
          </label>
          <div className="flex gap-2">
            <input
              id="share-link"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="field flex-1 min-w-0 text-gray-600"
            />
            <button
              type="button"
              onClick={copy}
              aria-label="Copy link"
              className="shrink-0 w-12 rounded-lg bg-[var(--tint-blue)] text-[var(--primary-blue)] hover:text-[var(--orange-accent)] flex items-center justify-center transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && <p className="text-gray-400 text-xs mt-2">Link copied.</p>}
        </div>

        <button type="button" onClick={onClose} className="btn-outline w-full py-3">
          Close
        </button>
      </div>
    </Shell>
  );
}
