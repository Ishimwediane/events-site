"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getImageUrl } from "@/platform/lib/images";
import { day, num, statusLabel } from "@/platform/v2/format";
import { RoleGate, useSession } from "@/platform/v2/Shell";
import { Badge, Card, ErrorNote, LinkButton, Loading, Page, statusTone } from "@/platform/v2/ui";
import { fetchAll } from "@/platform/v2/voting/shared";
import { useLoad } from "@/platform/v2/useLoad";

type Row = {
  id: string; title: string; status: string; start_date: string; end_date?: string | null;
  cover_image?: string | null; organizer_name?: string; category_count?: number; nominee_count?: number;
};

function CampaignList() {
  const { user } = useSession();
  const router = useRouter();
  const admin = user.role === "ADMIN";
  const { data, error, loading } = useLoad(
    () => fetchAll<Row>(admin ? "/voting/campaigns/admin_all/" : "/voting/campaigns/mine/"),
    [admin],
  );

  // One campaign: go straight to it.
  useEffect(() => {
    if (admin) router.replace("/dashboard/admin/voting");
    else if (data && data.length === 1) router.replace(`/dashboard/voting/${data[0].id}`);
  }, [admin, data, router]);

  return (
    <Page
      title="Voting"
      subtitle={admin ? "Every client's voting campaigns." : "Your voting campaigns."}
      actions={!admin && <LinkButton href="/dashboard/voting/new" kind="primary">+ New campaign</LinkButton>}
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      {loading || (!admin && data?.length === 1) ? (
        <Loading />
      ) : !data?.length ? (
        <Card>
          <p className="m-0 text-sm text-[#5B6472]">No voting campaigns yet. Create one to add categories, nominees and vote packages.</p>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {data.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/voting/${c.id}`}
              className="no-underline bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {c.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(c.cover_image)} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 bg-[#0F3A52]" />
              )}
              <div className="p-5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 font-heading text-base font-semibold text-[#08283B]">{c.title}</h2>
                  <Badge tone={statusTone(c.status)}>{statusLabel[c.status] ?? c.status}</Badge>
                </div>
                {admin && c.organizer_name && <span className="text-xs text-[#5B6472]">{c.organizer_name}</span>}
                <span className="text-[13px] text-[#5B6472]">
                  {day(c.start_date)}{c.end_date ? ` – ${day(c.end_date)}` : ""}
                </span>
                <span className="text-[13px] text-[#374151]">
                  {num(c.category_count)} categories · {num(c.nominee_count)} nominees
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}

export default function VotingPage() {
  return (
    <RoleGate roles={["COMPANY", "ADMIN"]}>
      <CampaignList />
    </RoleGate>
  );
}
