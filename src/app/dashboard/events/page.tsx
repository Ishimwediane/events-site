"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Loading } from "@/platform/v2/ui";

/** Events live on the Tickets page now. */
export default function EventsRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/dashboard/tickets"), [router]);
  return <Loading />;
}
