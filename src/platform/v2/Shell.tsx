"use client";

/**
 * The dashboard frame: a white sidebar with the menu for the signed-in role,
 * and the page. One frame for organisers, Ozone admins and the developer —
 * only the menu and the name under the logo change.
 */
import {
  Activity, BadgeDollarSign, Code2, LayoutDashboard, LogOut, Menu,
  ScanLine, Settings, Ticket, Users, Vote, Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "@/platform/lib/api";
import { authService } from "@/platform/services/auth.service";
import { Loading } from "./ui";

export type Role = "ADMIN" | "COMPANY" | "CUSTOMER" | "GATE_STAFF" | "DEVELOPER";

export type SessionUser = { id: string; email: string; first_name?: string; last_name?: string; role: Role };

export type Company = {
  id: string; name: string; slug: string; description?: string; logo?: string | null;
  authorization?: string; can_use_qr?: boolean;
};

type Session = { user: SessionUser; company: Company | null; refreshCompany: () => Promise<void> };

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error("useSession outside the dashboard");
  return s;
}

export const isAdmin = (u: SessionUser) => u.role === "ADMIN";

type Item = { href: string; label: string; icon: typeof LayoutDashboard };

function menuFor(user: SessionUser, company: Company | null): Item[] {
  if (user.role === "ADMIN") {
    return [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    ];
  }
  if (user.role === "DEVELOPER") {
    return [
      { href: "/dashboard/dev", label: "My earnings", icon: BadgeDollarSign },
      { href: "/dashboard/dev/system", label: "System health", icon: Activity },
      { href: "/dashboard/dev/settings", label: "Settings", icon: Settings },
    ];
  }
  const auth = (company?.authorization || "BOTH").toUpperCase();
  const voting = auth !== "EVENTS";
  const events = auth !== "VOTING";
  return [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...(voting ? [{ href: "/dashboard/voting", label: "Voting", icon: Vote }] : []),
    ...(events ? [{ href: "/dashboard/tickets", label: "Tickets", icon: Ticket }] : []),
    ...(events ? [{ href: "/dashboard/checkins", label: "Check-ins", icon: ScanLine }] : []),
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/money", label: "Money", icon: Wallet },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
}

/** Which menu item a path belongs to: the longest matching prefix. */
function activeHref(path: string, items: Item[]): string {
  let best = "";
  for (const i of items) {
    if ((path === i.href || path.startsWith(`${i.href}/`)) && i.href.length > best.length) best = i.href;
  }
  if (!best && (path.startsWith("/dashboard/events") || path.startsWith("/dashboard/tickets"))) return "/dashboard/tickets";
  return best;
}

function Brand({ user, company }: { user: SessionUser; company: Company | null }) {
  const name = user.role === "ADMIN" ? "Ozone Events" : user.role === "DEVELOPER" ? "Developer" : company?.name || "Your organisation";
  const sub = user.role === "ADMIN" ? "Platform admin" : user.role === "DEVELOPER" ? "Vexta Ltd" : "Events & voting";
  const letter = user.role === "DEVELOPER" ? <Code2 className="w-5 h-5" /> : (name[0] || "O").toUpperCase();
  return (
    <div className="flex items-center gap-3 px-1.5">
      {company?.logo && user.role === "COMPANY" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={company.logo} alt="" className="w-10 h-10 rounded-[10px] object-cover" />
      ) : (
        <div className="w-10 h-10 shrink-0 rounded-[10px] bg-[#08283B] text-[#F39C12] flex items-center justify-center font-heading font-bold text-lg">{letter}</div>
      )}
      <div className="min-w-0">
        <div className="font-heading font-bold text-base text-[#08283B] truncate">{name}</div>
        <div className="text-xs text-[#5B6472] truncate">{sub}</div>
      </div>
    </div>
  );
}

function Sidebar({ user, company, items, onNavigate }: {
  user: SessionUser; company: Company | null; items: Item[]; onNavigate?: () => void;
}) {
  const path = usePathname() || "/dashboard";
  const active = activeHref(path, items);
  return (
    <aside className="h-full w-[248px] bg-white border-r border-[#E5E7EB] px-4 py-6 box-border flex flex-col gap-7 overflow-y-auto">
      <Brand user={user} company={company} />
      <nav aria-label="Main" className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3.5 py-[11px] rounded-[10px] text-sm no-underline ${href === active ? "bg-[#F39C12] text-[#111827] font-semibold" : "text-[#4B5563] font-medium hover:bg-[#F4F5F7] hover:text-[#08283B]"}`}
          >
            <Icon className="w-[18px] h-[18px]" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <div className="px-1.5 text-xs text-[#5B6472] truncate" title={user.email}>{user.email}</div>
        <button
          type="button"
          onClick={() => { authService.logout(); window.location.href = "/login"; }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold text-[#B42318] hover:bg-[#FFF4F2] text-left"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
        <div className="p-3.5 rounded-xl bg-[#F4F5F7] text-xs text-[#4B5563] leading-relaxed">
          Powered by <b className="text-[#08283B]">Vexta Ltd</b>
          <br />
          Help: 0790 755 673
        </div>
      </div>
    </aside>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [open, setOpen] = useState(false);

  const refreshCompany = async () => {
    try {
      setCompany((await api.get("/companies/profile/me/")).data);
    } catch {
      setCompany(null);
    }
  };

  useEffect(() => {
    const stored = authService.getUserFromStorage() as SessionUser | null;
    if (!stored) {
      router.replace("/login");
      return;
    }
    (async () => {
      // The role on the server is the truth; the stored copy may be old.
      let me = stored;
      try {
        me = (await api.get("/users/me/")).data;
        localStorage.setItem("user", JSON.stringify({ ...stored, ...me }));
      } catch {
        /* the interceptor sends an expired session to /login */
      }
      if (me.role === "GATE_STAFF") return router.replace("/scan");
      if (me.role === "CUSTOMER") return router.replace("/pending");
      if (me.role === "COMPANY") await refreshCompany();
      setUser(me);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <div className="min-h-screen bg-[#F4F5F7]"><Loading label="Opening your dashboard…" /></div>;

  const items = menuFor(user, company);
  return (
    <SessionContext.Provider value={{ user, company, refreshCompany }}>
      <div className="min-h-screen bg-[#F4F5F7] text-[#111827] font-body">
        <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
          <Sidebar user={user} company={company} items={items} />
        </div>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-[#08283B]/50" onClick={() => setOpen(false)} />
            <div className="relative h-full w-[248px]"><Sidebar user={user} company={company} items={items} onNavigate={() => setOpen(false)} /></div>
          </div>
        )}
        <div className="lg:pl-[248px] min-h-screen flex flex-col">
          <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5E7EB]">
            <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-[#F4F5F7]">
              <Menu className="w-5 h-5 text-[#08283B]" />
            </button>
            <span className="font-heading font-bold text-[#08283B]">{user.role === "COMPANY" ? company?.name : user.role === "ADMIN" ? "Ozone Events" : "Developer"}</span>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}

/** Render children only for the given roles; others are sent to their home. */
export function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useSession();
  const router = useRouter();
  const allowed = roles.includes(user.role);
  useEffect(() => {
    if (!allowed) router.replace(user.role === "ADMIN" ? "/dashboard/admin" : user.role === "DEVELOPER" ? "/dashboard/dev" : "/dashboard");
  }, [allowed, router, user.role]);
  return allowed ? <>{children}</> : <Loading />;
}
