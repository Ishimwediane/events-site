"use client";

import { api } from "@/platform/lib/api";
import { fetchAll, type AdminUser, type Earnings } from "@/platform/v2/admin/data";
import { PasswordCard } from "@/platform/v2/admin/PasswordCard";
import { RoleGate, useSession } from "@/platform/v2/Shell";
import { Badge, Card, ErrorNote, Field, inputClass, LinkButton, Loading, NotBuilt, Notice, Page } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

export default function AdminSettingsPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Settings />
    </RoleGate>
  );
}

const HELP_PHONE = "0790 755 673";

function Settings() {
  const { user: me } = useSession();
  const { data, error, loading } = useLoad(async () => {
    const [earnings, users] = await Promise.all([
      api.get<Earnings>("/payments/earnings/?to=2000-01-01").then((r) => r.data),
      fetchAll<AdminUser>("/users/"),
    ]);
    return { shares: earnings.shares, people: users.filter((u) => u.role === "ADMIN" || u.role === "DEVELOPER") };
  });

  if (loading) return <Loading />;
  if (error || !data) return <Page title="Platform settings"><ErrorNote>{error}</ErrorNote></Page>;
  const s = { gateway: Number(data.shares.gateway), developer: Number(data.shares.developer), host: Number(data.shares.host) };

  return (
    <Page title="Platform settings" subtitle="What every client sees, how money is shared, and who runs the platform.">
      <Card title="Support shown to clients">
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label="Help phone"><input className={`${inputClass} bg-[#F7F8FA] text-[#5B6472]`} value={HELP_PHONE} disabled /></Field>
        </div>
        <NotBuilt>Changing the help phone and email from here. They are part of the website for now; ask the developer to change them.</NotBuilt>
      </Card>

      <Card title="How each payment is shared">
        <div className="flex h-11 rounded-xl overflow-hidden text-[13px] font-semibold">
          <div className="bg-[#E5E7EB] text-[#374151] flex items-center justify-center" style={{ flex: `${s.gateway} 1 0` }}>Weflexfy {s.gateway}%</div>
          <div className="bg-[#F39C12] text-[#111827] flex items-center justify-center" style={{ flex: `${s.developer} 1 0` }}>Developer {s.developer}%</div>
          <div className="bg-[#08283B] text-white flex items-center justify-center" style={{ flex: `${s.host} 1 0` }}>Client {s.host}%</div>
        </div>
        <Notice>Only payments made through Weflexfy are shared. Older payments through LMB belong wholly to the client. The percentages are set on the server.</Notice>
      </Card>

      <Card title="Ways to pay">
        {[
          ["MoMo on the website", "Through Weflexfy · MTN Mobile Money"],
          ["USSD *550*2*15#", "Vote and buy tickets from any phone, no internet"],
          ["Card", "Visa and Mastercard through Weflexfy"],
        ].map(([name, note]) => (
          <div key={name} className="flex flex-wrap justify-between items-center gap-3 p-3.5 border border-[#E5E7EB] rounded-xl">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{name}</span>
              <span className="text-[13px] text-[#5B6472]">{note}</span>
            </div>
            <Badge tone="green">On</Badge>
          </div>
        ))}
      </Card>

      <Card title="Admins and developer" actions={<LinkButton href="/dashboard/admin/users" kind="dark" small>Manage users</LinkButton>}>
        {data.people.map((u) => (
          <div key={u.id} className="flex flex-wrap justify-between items-center gap-3 px-3.5 py-3 border border-[#E5E7EB] rounded-xl">
            <span className="font-semibold break-all">{u.email}</span>
            <span className="inline-flex gap-2 items-center">
              <Badge tone={u.role === "ADMIN" ? "amber" : "navy"}>{u.role === "ADMIN" ? "Ozone admin" : "Developer"}</Badge>
              {u.id === me.id && <span className="text-[13px] text-[#5B6472]">You</span>}
            </span>
          </div>
        ))}
      </Card>

      <PasswordCard />
    </Page>
  );
}
