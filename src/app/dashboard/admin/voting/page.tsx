"use client";

import { Suspense } from "react";

import { Catalog } from "@/platform/v2/admin/Catalog";
import { RoleGate } from "@/platform/v2/Shell";
import { Loading } from "@/platform/v2/ui";

export default function AdminVotingPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Suspense fallback={<Loading />}>
        <Catalog show="voting" />
      </Suspense>
    </RoleGate>
  );
}
