"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { api } from "@/platform/lib/api";
import { errorText } from "@/platform/v2/format";
import { RoleGate, useSession } from "@/platform/v2/Shell";
import { Button, Card, ErrorNote, Field, LinkButton, Page, inputClass } from "@/platform/v2/ui";
import { useLoad, listOf } from "@/platform/v2/useLoad";
import { ImagePicker, fromLocalInput } from "@/platform/v2/voting/shared";
import { PackageRows, type PackageDraft, savePackages } from "@/platform/v2/voting/packages";

function NewCampaign() {
  const { user } = useSession();
  const admin = user.role === "ADMIN";
  const router = useRouter();
  const params = useSearchParams();
  const [organizer, setOrganizer] = useState(params.get("organizer") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [packages, setPackages] = useState<PackageDraft[]>([{ name: "", number_of_votes: "", price: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const clients = useLoad(
    () => (admin ? api.get("/companies/list/").then((r) => listOf<{ id: string; name: string }>(r.data)) : Promise.resolve([])),
    [admin],
  );

  const save = async () => {
    setError("");
    if (!title.trim() || !description.trim() || !start) return setError("Add a name, a description and the date voting opens.");
    if (admin && !organizer) return setError("Choose which client this campaign is for.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("start_date", fromLocalInput(start));
      form.append("end_date", end ? fromLocalInput(end) : "");
      if (cover) form.append("cover_image", cover);
      if (admin) form.append("organizer", organizer);
      const created = (await api.post("/voting/campaigns/", form, { headers: { "Content-Type": "multipart/form-data" } })).data;
      await savePackages(created.id, [], packages);
      router.push(`/dashboard/voting/${created.id}/nominees`);
    } catch (e) {
      setError(errorText(e, "Could not create the campaign."));
      setBusy(false);
    }
  };

  return (
    <Page title="New voting campaign" subtitle="Add the details now; categories and nominees come next." back={{ href: "/dashboard/voting", label: "Voting" }}>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Card title="Details">
        {admin && (
          <Field label="Client">
            <select value={organizer} onChange={(e) => setOrganizer(e.target.value)} className={inputClass}>
              <option value="">Choose a client</option>
              {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <ImagePicker label="Cover picture" hint="Shown on the voting page and when the link is shared" file={cover} onChange={setCover} />
        <Field label="Campaign name">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AGACIRO Entertainment Awards 2027" />
        </Field>
        <Field label="Description">
          <textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Voting opens">
            <input type="datetime-local" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Voting closes (optional)">
            <input type="datetime-local" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
      </Card>
      <Card title="Vote packages" actions={<span className="text-[13px] text-[#5B6472]">What voters can buy. You can change these later.</span>}>
        <PackageRows rows={packages} onChange={setPackages} />
      </Card>
      <div className="flex flex-wrap justify-end gap-2.5">
        <LinkButton href="/dashboard/voting">Cancel</LinkButton>
        <Button kind="primary" busy={busy} onClick={save}>Create campaign</Button>
      </div>
    </Page>
  );
}

export default function NewCampaignPage() {
  return (
    <RoleGate roles={["COMPANY", "ADMIN"]}>
      <Suspense>
        <NewCampaign />
      </Suspense>
    </RoleGate>
  );
}
