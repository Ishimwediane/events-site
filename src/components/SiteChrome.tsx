"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The organiser dashboard (src/platform, merged from the former
 * events.ozoneentertainmentz.com app) lives in this same site. Its own
 * full-screen areas — the dashboard shell, /admin, /login, /pending — bring
 * their own chrome, so they get neither the site's navbar nor its footer.
 * Every dashboard route is wrapped in `.platform`, which scopes the
 * dashboard's own button styles (globals.css) so they never leak into the site.
 */
const FULL_SCREEN = ["/dashboard", "/admin", "/login", "/pending"];
const PLATFORM = [...FULL_SCREEN, "/register", "/scan", "/apply", "/company", "/payment-return"];

const under = (path: string, roots: string[]) => roots.some((r) => path === r || path.startsWith(`${r}/`));

export default function SiteChrome({ navbar, footer, children }: { navbar: ReactNode; footer: ReactNode; children: ReactNode }) {
  const path = usePathname() ?? "/";

  if (under(path, FULL_SCREEN)) {
    return <div className="platform min-h-screen">{children}</div>;
  }
  const content = under(path, PLATFORM) ? <div className="platform">{children}</div> : children;
  return (
    <>
      {navbar}
      {/* Clears the fixed navbar. */}
      <main className="pt-[72px] md:pt-[76px]">{content}</main>
      {footer}
    </>
  );
}
