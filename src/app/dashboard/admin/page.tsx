"use client";

import { RoleGate } from "@/platform/v2/Shell";
import { Card, Page } from "@/platform/v2/ui";

/** Ozone's admin dashboard is being built separately; this dashboard is for organisers. */
export default function AdminHomePage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Page title="Admin dashboard" subtitle="Coming soon.">
        <Card>
          <p className="m-0 text-sm text-[#374151] leading-relaxed">
            This dashboard is for organisers. The Ozone Events admin dashboard is being built and will open here.
            To manage AGACIRO, sign in with the AGACIRO organiser account.
          </p>
        </Card>
      </Page>
    </RoleGate>
  );
}
