"use client";

/**
 * The dashboard design (canvas "AGACIRO Organiser Dashboard") as components:
 * white cards on #F4F5F7, navy #08283B headings, orange #F39C12 actions,
 * Outfit headings over Inter body. Every screen builds from these so the
 * organiser, admin and developer dashboards look the same.
 */
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

export const NAVY = "#08283B";
export const ORANGE = "#F39C12";

export function Page({ title, subtitle, actions, back, children }: {
  title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 lg:px-10 lg:py-8 max-w-[1400px] w-full">
      {back && (
        <Link href={back.href} className="text-sm font-semibold text-[#08283B] hover:text-[#B86E00]">← {back.label}</Link>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 font-heading text-[26px] sm:text-[28px] font-bold text-[#08283B] leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[#5B6472]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-end gap-2.5">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Card({ title, actions, children, padded = true, className = "", id }: {
  title?: ReactNode; actions?: ReactNode; children: ReactNode; padded?: boolean; className?: string; id?: string;
}) {
  return (
    <section id={id} className={`bg-white border border-[#E5E7EB] rounded-2xl flex flex-col gap-3.5 ${padded ? "p-[22px]" : "pt-[22px] pb-2"} ${className}`}>
      {(title || actions) && (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${padded ? "" : "px-[22px]"}`}>
          {title && <h2 className="m-0 font-heading text-lg font-semibold text-[#08283B]">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, unit, note, dark, tone }: {
  label: string; value: ReactNode; unit?: string; note?: ReactNode; dark?: boolean; tone?: "green" | "red" | "amber";
}) {
  const color = dark ? "text-white" : tone === "green" ? "text-[#0B6B43]" : tone === "red" ? "text-[#B42318]" : tone === "amber" ? "text-[#B86E00]" : "text-[#08283B]";
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-1.5 ${dark ? "bg-[#08283B]" : "bg-white border border-[#E5E7EB]"}`}>
      <span className={`text-[13px] ${dark ? "text-[#C9D4DC]" : "text-[#5B6472]"}`}>{label}</span>
      <span className={`font-heading text-[28px] font-bold tabular-nums leading-tight ${color}`}>
        {value}
        {unit && <small className={`ml-1 text-sm font-medium ${dark ? "text-[#C9D4DC]" : "text-[#5B6472]"}`}>{unit}</small>}
      </span>
      {note && <span className={`text-xs ${dark ? "text-[#C9D4DC]" : "text-[#5B6472]"}`}>{note}</span>}
    </div>
  );
}

export function StatGrid({ children, min = 200 }: { children: ReactNode; min?: number }) {
  return <section className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>{children}</section>;
}

type ButtonKind = "primary" | "dark" | "outline" | "danger" | "ghost";
const BUTTON: Record<ButtonKind, string> = {
  primary: "bg-[#F39C12] text-[#111827] hover:bg-[#E08E0B]",
  dark: "bg-[#08283B] text-white hover:bg-[#0F3A52]",
  outline: "bg-white text-[#08283B] border border-[#D1D5DB] hover:bg-[#F4F5F7]",
  danger: "bg-white text-[#B42318] border border-[#F3C4BF] hover:bg-[#FFF4F2]",
  ghost: "bg-transparent text-[#08283B] hover:bg-[#F4F5F7]",
};

export function Button({ kind = "outline", small, busy, className = "", children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: ButtonKind; small?: boolean; busy?: boolean;
}) {
  return (
    <button
      type="button"
      {...rest}
      disabled={busy || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm"} ${BUTTON[kind]} ${className}`}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({ href, kind = "outline", small, children, className = "" }: {
  href: string; kind?: ButtonKind; small?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold no-underline transition-colors ${small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm"} ${BUTTON[kind]} ${className}`}>
      {children}
    </Link>
  );
}

const BADGE = {
  green: "bg-[#E7F6EE] text-[#0B6B43]",
  red: "bg-[#FFF4F2] text-[#912018]",
  amber: "bg-[#FEF3E2] text-[#8A5300]",
  blue: "bg-[#EEF2FF] text-[#3730A3]",
  gray: "bg-[#F4F5F7] text-[#374151]",
  navy: "bg-[#08283B] text-white",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${BADGE[tone]}`}>{children}</span>;
}

export const statusTone = (s: string): keyof typeof BADGE =>
  s === "PUBLISHED" || s === "ONGOING" ? "green" : s === "CANCELLED" ? "red" : s === "DRAFT" ? "gray" : "blue";

export function Table({ head, children, minWidth = 640, empty }: {
  head: ReactNode[]; children: ReactNode; minWidth?: number; empty?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="text-left text-[#5B6472] text-xs uppercase tracking-[0.06em]">
            {head.map((h, i) => (
              <th key={i} className={`py-2.5 font-semibold ${i === 0 ? "pl-[22px] pr-3" : i === head.length - 1 ? "pl-3 pr-[22px]" : "px-3"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, first, last, className = "" }: { children?: ReactNode; first?: boolean; last?: boolean; className?: string }) {
  return <td className={`py-3 border-t border-[#F1F2F4] ${first ? "pl-[22px] pr-3" : last ? "pl-3 pr-[22px]" : "px-3"} ${className}`}>{children}</td>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="m-0 px-[22px] py-8 text-center text-sm text-[#5B6472]">{children}</p>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-sm text-[#5B6472]">
      <Loader2 className="w-5 h-5 animate-spin text-[#F39C12]" /> {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-xl bg-[#FFF4F2] border border-[#F3C4BF] px-4 py-3 text-sm text-[#912018]">{children}</p>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-xl bg-[#F4F5F7] px-4 py-3 text-[13px] text-[#374151]">{children}</p>;
}

/** A popup form. Opens only when asked for, so pages stay uncluttered. */
export function Modal({ title, open, onClose, children, footer, wide }: {
  title: ReactNode; open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08283B]/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" className={`w-full ${wide ? "max-w-[620px]" : "max-w-[480px]"} max-h-[calc(100vh-32px)] overflow-y-auto bg-white rounded-2xl p-6 flex flex-col gap-3.5 shadow-[0_20px_50px_rgba(8,40,59,0.3)]`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 font-heading text-lg font-semibold text-[#08283B] break-words">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="shrink-0 w-9 h-9 rounded-[10px] border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F4F5F7] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-2.5 pt-1">{footer}</div>}
      </section>
    </div>
  );
}

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[#374151]">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-[#5B6472]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 rounded-[10px] border border-[#D1D5DB] bg-white text-sm text-[#111827] font-normal focus:outline-hidden focus:border-[#F39C12] focus:ring-2 focus:ring-[#F39C12]/30";

export function Bar({ pct, color = ORANGE, height = 8 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="rounded-full bg-[#F1F2F4]" style={{ height }}>
      <div className="rounded-full" style={{ height, width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

/** Tabs that are links, e.g. a campaign's Results / Categories / Log. */
export function TabLinks({ tabs, active }: { tabs: { href: string; label: string }[]; active: string }) {
  return (
    <nav className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-[#E5E7EB] rounded-[14px] self-start">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={`px-4 py-2.5 rounded-[10px] text-sm font-semibold no-underline ${t.href === active ? "bg-[#08283B] text-white" : "text-[#4B5563] hover:bg-[#F4F5F7]"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function NotBuilt({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 rounded-xl border border-dashed border-[#C7CDD4] px-4 py-3 text-[13px] text-[#5B6472]">
      <b className="text-[#374151]">Not available yet.</b> {children}
    </p>
  );
}
