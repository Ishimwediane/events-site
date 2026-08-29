"use client";

import { useState } from "react";
import { Facebook, Twitter, Mail, Share2, Check } from "lucide-react";

/** Share buttons, as on the organiser platform's event page. */
export default function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const href = () => (typeof window === "undefined" ? "" : window.location.href);

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div className="mt-8 pt-4 border-t border-gray-50">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
        Share With Friends
      </p>
      <div className="flex items-center gap-2">
        <Button
          label="Share on Facebook"
          onClick={() => open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(href())}`)}
        >
          <Facebook className="w-3.5 h-3.5" />
        </Button>

        <Button
          label="Share on X"
          onClick={() =>
            open(
              `https://twitter.com/intent/tweet?url=${encodeURIComponent(href())}&text=${encodeURIComponent(title)}`,
            )
          }
        >
          <Twitter className="w-3.5 h-3.5" />
        </Button>

        <Button
          label="Share by email"
          onClick={() =>
            open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(href())}`)
          }
        >
          <Mail className="w-3.5 h-3.5" />
        </Button>

        <Button
          label="Copy link"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(href());
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard blocked — nothing useful to say */
            }
          }}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
        </Button>

        {copied && <span className="text-[10px] text-gray-400">Link copied</span>}
      </div>
    </div>
  );
}

function Button({
  onClick, label, children,
}: {
  onClick: () => void; label: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[var(--orange-accent)] hover:bg-[var(--orange-accent)]/10 transition-all"
    >
      {children}
    </button>
  );
}
