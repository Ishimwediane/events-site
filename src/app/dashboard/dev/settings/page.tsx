"use client";

import { API_URL } from "@/platform/lib/api";
import { RoleGate } from "@/platform/v2/Shell";
import { PasswordCard } from "@/platform/v2/PasswordCard";
import { Badge, Card, Page } from "@/platform/v2/ui";

const apiHost = API_URL.replace(/^https?:\/\//, "").replace(/\/api\/?$/, "");

const SERVICES = [
  { name: "Weflexfy payments", detail: `Keys saved on the server · webhook ${apiHost}/api/payments/weflexfy/webhook` },
  { name: "Weflexfy USSD", detail: `*550*2*15# · ${apiHost}/api/ussd/webhook` },
  { name: "Cloudinary (photos)", detail: "Flyers and nominee photos" },
  { name: "Cloudflare Tunnel", detail: `${apiHost} → server` },
];

function Settings() {
  return (
    <Page title="Developer settings" subtitle="The services the platform runs on, deploys, backups and your password.">
      <Card title="Connected services">
        {SERVICES.map((s) => (
          <div key={s.name} className="flex flex-wrap justify-between items-center gap-3 p-3.5 border border-[#E5E7EB] rounded-xl">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-semibold">{s.name}</span>
              <span className="font-mono text-xs text-[#374151] break-all">{s.detail}</span>
            </div>
            <Badge tone="green">Configured</Badge>
          </div>
        ))}
        <p className="m-0 text-xs text-[#5B6472]">Keys and secrets live only in the server&apos;s .env.docker and are never shown here.</p>
      </Card>

      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card title="Deploys">
          <p className="m-0 text-sm text-[#374151]">
            Every push to <b>main</b> on GitHub goes live by itself, only if all tests pass. If the new version fails its health check, the old one comes back.
          </p>
        </Card>
        <Card title="Backups">
          <p className="m-0 text-sm text-[#374151]">The whole database is saved every night at 02:00. The last 14 days are kept on the server.</p>
        </Card>
      </div>

      <PasswordCard />
    </Page>
  );
}

export default function DevSettingsPage() {
  return (
    <RoleGate roles={["DEVELOPER"]}>
      <Settings />
    </RoleGate>
  );
}
