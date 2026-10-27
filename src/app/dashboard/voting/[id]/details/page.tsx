"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { api } from "@/platform/lib/api";
import { getImageUrl } from "@/platform/lib/images";
import { errorText } from "@/platform/v2/format";
import { RoleGate, useListHref } from "@/platform/v2/Shell";
import { Button, Card, ErrorNote, Field, Loading, Notice, Page, inputClass } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";
import { PackageRows, savePackages, toDraft, type PackageDraft } from "@/platform/v2/voting/packages";
import {
  CampaignTabs, ImagePicker, StatusSelect, campaignDates, fromLocalInput, toLocalInput, type Campaign,
} from "@/platform/v2/voting/shared";

/** The form starts from the loaded campaign; it is re-mounted (fresh values) after each load. */
function DetailsForm({ c, reload, savedNote }: { c: Campaign; reload: (note?: boolean) => void; savedNote: boolean }) {
  const [title, setTitle] = useState(c.title);
  const [description, setDescription] = useState(c.description ?? "");
  const [start, setStart] = useState(toLocalInput(c.start_date));
  const [end, setEnd] = useState(toLocalInput(c.end_date));
  const [cover, setCover] = useState<File | null>(null);
  const [packages, setPackages] = useState<PackageDraft[]>(
    () => [...c.packages].sort((a, b) => Number(a.price) - Number(b.price)).map(toDraft),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    if (!title.trim() || !start) return setError("The campaign needs a name and the date voting opens.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("start_date", fromLocalInput(start));
      form.append("end_date", end ? fromLocalInput(end) : "");
      if (cover) form.append("cover_image", cover);
      await api.patch(`/voting/campaigns/${c.id}/`, form, { headers: { "Content-Type": "multipart/form-data" } });
      await savePackages(c.id, c.packages, packages);
      reload(true);
    } catch (e) {
      setError(errorText(e, "Could not save the changes."));
      setBusy(false);
    }
  };

  return (
    <>
      {error && <ErrorNote>{error}</ErrorNote>}
      {savedNote && !error && <Notice>Saved.</Notice>}
      <Card title="Details">
        <ImagePicker
          label="Cover picture"
          hint="Shown on the voting page and when the link is shared"
          current={c.cover_image ? getImageUrl(c.cover_image) : null}
          file={cover}
          onChange={setCover}
        />
        <Field label="Campaign name" hint="Changing the name keeps old shared links working.">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
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

      <Card title="Vote packages" actions={<span className="text-[13px] text-[#5B6472]">What voters can buy. The price per vote is worked out for you.</span>}>
        <PackageRows rows={packages} onChange={setPackages} />
      </Card>

      <div className="flex flex-wrap justify-end gap-2.5">
        <Button onClick={() => reload()}>Undo changes</Button>
        <Button kind="primary" busy={busy} onClick={save}>Save</Button>
      </div>
    </>
  );
}

function Details() {
  const list = useListHref("voting");
  const id = useParams().id as string;
  const { data: c, error, loading, reload } = useLoad(
    () => api.get(`/voting/campaigns/${id}/`).then((r) => r.data as Campaign),
    [id],
  );
  const [version, setVersion] = useState(0);
  const [saved, setSaved] = useState(false);

  if (loading) return <Loading />;
  if (!c) return <Page title="Voting"><ErrorNote>{error || "Campaign not found."}</ErrorNote></Page>;

  const refresh = async (note = false) => {
    await reload();
    setSaved(note);
    setVersion((v) => v + 1);
  };

  return (
    <Page
      title={c.title}
      subtitle={campaignDates(c)}
      back={{ href: list, label: "Voting" }}
      actions={<StatusSelect campaign={c} onSaved={reload} />}
    >
      <CampaignTabs id={id} active="details" />
      <DetailsForm key={version} c={c} reload={refresh} savedNote={saved} />
    </Page>
  );
}

export default function CampaignDetailsPage() {
  return (
    <RoleGate roles={["COMPANY", "ADMIN"]}>
      <Details />
    </RoleGate>
  );
}
