"use client";

import EventForm from "@/platform/v2/org/EventForm";
import { RoleGate } from "@/platform/v2/Shell";

export default function NewEventPage() {
  return <RoleGate roles={["COMPANY"]}><EventForm /></RoleGate>;
}
