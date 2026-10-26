import { redirect } from "next/navigation";

/** The vote log was taken out of the organiser dashboard; old links land on the results. */
export default async function VoteLogPage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/dashboard/voting/${(await params).id}`);
}
