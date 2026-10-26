"use client";

import { useParams } from "next/navigation";

import { api } from "@/platform/lib/api";
import EventForm from "@/platform/v2/org/EventForm";
import type { EventItem } from "@/platform/v2/org/types";
import { RoleGate } from "@/platform/v2/Shell";
import { ErrorNote, Loading, Page } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";

function Edit() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useLoad(() => api.get<EventItem>(`/events/${id}/`).then((r) => r.data), [id]);
  if (loading) return <Loading />;
  if (!data) return <Page title="Edit event"><ErrorNote>{error || "Event not found."}</ErrorNote></Page>;
  return <EventForm event={data} />;
}

export default function EditEventPage() {
  return <RoleGate roles={["COMPANY", "ADMIN"]}><Edit /></RoleGate>;
}
