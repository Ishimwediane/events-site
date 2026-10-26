"use client";

import { useState } from "react";

import { api, API_URL } from "@/platform/lib/api";
import { RoleGate } from "@/platform/v2/Shell";
import { errorText } from "@/platform/v2/format";
import { Badge, Button, Card, ErrorNote, Field, inputClass, NotBuilt, Notice, Page } from "@/platform/v2/ui";

const apiHost = API_URL.replace(/^https?:\/\//, "").replace(/\/api\/?$/, "");

const SERVICES = [
  { name: "Weflexfy payments", detail: `Keys saved on the server · webhook ${apiHost}/api/payments/weflexfy/webhook` },
  { name: "Weflexfy USSD", detail: `*550*2*15# · ${apiHost}/api/ussd/webhook` },
  { name: "Cloudinary (photos)", detail: "Flyers and nominee photos" },
  { name: "Cloudflare Tunnel", detail: `${apiHost} → server` },
];

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api.post("/dashboard/password/", { current_password: current, new_password: next });
      setMsg("Password changed.");
      setCurrent("");
      setNext("");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Password">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Field label="Current password">
          <input type="password" autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" hint="At least 8 characters, not only numbers.">
          <input type="password" autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
      </div>
      {err && <ErrorNote>{err}</ErrorNote>}
      {msg && <p className="m-0 text-sm font-semibold text-[#0B6B43]">{msg}</p>}
      <div><Button kind="dark" busy={busy} disabled={!current || !next} onClick={save}>Change password</Button></div>
    </Card>
  );
}

function Settings() {
  return (
    <Page title="Developer settings" subtitle="Your payout, alerts, and the services the platform runs on.">
      <Card title="My 10%">
        <NotBuilt>Receiving your share automatically on your own MoMo number needs a second Weflexfy recipient on the server. Until then it shows as &quot;still to collect&quot; on My earnings.</NotBuilt>
      </Card>

      <Card title="Alert me when">
        <NotBuilt>Email or SMS alerts (website down, failed payouts, stuck payments, many errors, missed backup) are not set up yet. Check System health meanwhile.</NotBuilt>
      </Card>

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
          <Notice>Rolling back from here is not available; use the deploy script on the server.</Notice>
        </Card>
        <Card title="Backups">
          <p className="m-0 text-sm text-[#374151]">The whole database is saved every night at 02:00. The last 14 days are kept on the server.</p>
          <Notice>Downloading a backup from here is not available; copy it from the server.</Notice>
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
