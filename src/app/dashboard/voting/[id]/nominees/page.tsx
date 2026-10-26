"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { brand } from "@/config/site";
import { ussdVote } from "@/lib/slug";
import { api } from "@/platform/lib/api";
import { getImageUrl } from "@/platform/lib/images";
import { errorText, num } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Button, Card, ErrorNote, Field, Loading, Modal, Page, inputClass } from "@/platform/v2/ui";
import { useLoad } from "@/platform/v2/useLoad";
import VotesModal from "@/platform/v2/voting/VotesModal";
import {
  CampaignTabs, ImagePicker, StatusSelect, allNominees, campaignDates, type Campaign, type Category, type Nominee,
} from "@/platform/v2/voting/shared";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

type CategoryProps = { open: boolean; onClose: () => void; onSaved: (id?: string) => void; campaignId: string; category: Category | null };

/** Popups are mounted only while open, so each opening starts from the current values. */
function CategoryModal(props: CategoryProps) {
  return props.open ? <CategoryForm {...props} /> : null;
}

function CategoryForm({ onClose, onSaved, campaignId, category }: CategoryProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!name.trim()) return setError("Give the category a name.");
    setBusy(true);
    setError("");
    try {
      const body = { campaign: campaignId, name: name.trim(), description: description.trim() };
      const saved = category
        ? (await api.patch(`/voting/categories/${category.id}/`, body)).data
        : (await api.post("/voting/categories/", body)).data;
      onSaved(saved?.id);
      onClose();
    } catch (e) {
      setError(errorText(e, "Could not save the category."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={category ? "Rename category" : "Add a category"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button kind="primary" busy={busy} onClick={save}>Save category</Button></>}>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field label="Category name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Best Music Video" />
      </Field>
      <Field label="Description (optional)" hint="Shown on the vote page">
        <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
    </Modal>
  );
}

type NomineeProps = { open: boolean; onClose: () => void; onSaved: () => void; categoryId: string; nominee: Nominee | null };

function NomineeModal(props: NomineeProps) {
  return props.open ? <NomineeForm {...props} /> : null;
}

function NomineeForm({ onClose, onSaved, categoryId, nominee }: NomineeProps) {
  const [name, setName] = useState(nominee?.name ?? "");
  const [bio, setBio] = useState(nominee?.bio ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!name.trim()) return setError("Give the nominee a name.");
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("category", nominee?.category ?? categoryId);
      form.append("name", name.trim());
      form.append("bio", bio.trim());
      if (photo) form.append("profile_image", photo);
      if (nominee) await api.patch(`/voting/nominees/${nominee.id}/`, form, multipart);
      else await api.post("/voting/nominees/", form, multipart);
      onSaved();
      onClose();
    } catch (e) {
      setError(errorText(e, "Could not save the nominee."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={nominee ? `Edit ${nominee.name}` : "Add a nominee"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button kind="primary" busy={busy} onClick={save}>Save nominee</Button></>}>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nominee name" />
      </Field>
      <Field label="Short bio (optional)">
        <textarea className={inputClass} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <ImagePicker label="Photo" hint="Any size; it is shrunk for phones" current={nominee?.profile_image ? getImageUrl(nominee.profile_image) : null} file={photo} onChange={setPhoto} />
    </Modal>
  );
}

function Nominees() {
  const id = useParams().id as string;
  const { data: c, error, loading, reload } = useLoad(
    () => api.get(`/voting/campaigns/${id}/`).then((r) => r.data as Campaign),
    [id],
  );
  const [selected, setSelected] = useState("");
  const [find, setFind] = useState("");
  const [catModal, setCatModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [nomModal, setNomModal] = useState<{ open: boolean; nominee: Nominee | null }>({ open: false, nominee: null });
  const [votesFor, setVotesFor] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const categories = useMemo(() => [...(c?.categories ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [c]);

  if (loading) return <Loading />;
  if (!c) return <Page title="Voting"><ErrorNote>{error || "Campaign not found."}</ErrorNote></Page>;

  // The chosen category, or the first one when none is chosen (or it was deleted).
  const category = categories.find((x) => x.id === selected) ?? categories[0] ?? null;
  const selectedId = category?.id ?? "";
  const shown = categories.filter((x) => !find.trim() || x.name.toLowerCase().includes(find.trim().toLowerCase()));
  const nominees = [...(category?.nominees ?? [])].sort((a, b) => b.votes - a.votes);

  const remove = async (what: "category" | "nominee", target: Category | Nominee) => {
    const warning = what === "category"
      ? `Delete the category "${target.name}"? All its nominees and their votes are deleted too. This cannot be undone.`
      : `Delete ${target.name}? Their votes are deleted too. This cannot be undone.`;
    if (!window.confirm(warning)) return;
    setActionError("");
    try {
      await api.delete(what === "category" ? `/voting/categories/${target.id}/` : `/voting/nominees/${target.id}/`);
      reload();
    } catch (e) {
      setActionError(errorText(e, "Could not delete it."));
    }
  };

  return (
    <Page
      title={c.title}
      subtitle={`${campaignDates(c)} · ${num(c.categories.length)} categories · ${num(allNominees(c).length)} nominees`}
      back={{ href: "/dashboard/voting", label: "Voting" }}
      actions={<StatusSelect campaign={c} onSaved={reload} />}
    >
      <CampaignTabs id={id} active="nominees" />
      {actionError && <ErrorNote>{actionError}</ErrorNote>}

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-[18px] flex flex-col gap-2.5">
          <h2 className="m-0 mb-1 font-heading text-[17px] font-semibold text-[#08283B]">Categories</h2>
          <input type="search" aria-label="Find a category" placeholder="Find a category" value={find} onChange={(e) => setFind(e.target.value)} className={inputClass} />
          <div className="flex flex-col gap-0.5 max-h-[520px] overflow-y-auto">
            {shown.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setSelected(x.id)}
                className={`flex justify-between gap-2 px-3 py-2.5 rounded-[10px] text-sm text-left ${x.id === selectedId ? "bg-[#FEF3E2] text-[#8A5300] font-semibold" : "text-[#374151] hover:bg-[#F4F5F7]"}`}
              >
                <span className="min-w-0">{x.name}</span>
                <span className="tabular-nums text-xs text-[#5B6472] pt-0.5">{x.nominees.length}</span>
              </button>
            ))}
            {!shown.length && <p className="m-0 px-3 py-2 text-[13px] text-[#5B6472]">No categories{find ? " match" : " yet"}.</p>}
          </div>
          <button
            type="button"
            onClick={() => setCatModal({ open: true, category: null })}
            className="px-3.5 py-2.5 rounded-[10px] border border-dashed border-[#C7CDD4] bg-white text-[#08283B] text-[13px] font-semibold hover:bg-[#F4F5F7]"
          >
            + Add category
          </button>
        </section>

        {category ? (
          <Card
            title={<span className="text-xl">{category.name}</span>}
            actions={
              <>
                <Button small onClick={() => setCatModal({ open: true, category })}>Rename</Button>
                <Button small kind="danger" onClick={() => remove("category", category)}>Delete category</Button>
              </>
            }
          >
            {category.description && <p className="m-0 -mt-2 text-[13px] text-[#5B6472]">{category.description}</p>}
            <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {nominees.map((n) => (
                <article key={n.id} className="border border-[#E5E7EB] rounded-[14px] overflow-hidden flex flex-col">
                  {n.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(n.profile_image)} alt="" loading="lazy" className="h-[140px] w-full object-cover" />
                  ) : (
                    <div className="h-[140px] bg-[#0F3A52] text-[#F7B84B] flex items-center justify-center font-heading text-[34px] font-bold">{n.name[0]}</div>
                  )}
                  <div className="p-3 flex flex-col gap-1">
                    <span className="font-semibold">{n.name}</span>
                    <span className="text-xs text-[#5B6472] tabular-nums">USSD {ussdVote(brand.ussdCode, n.public_id).steps}</span>
                    <span className="text-lg font-bold text-[#08283B] tabular-nums">{num(n.votes)} {n.votes === 1 ? "vote" : "votes"}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Button small onClick={() => setNomModal({ open: true, nominee: n })}>Edit</Button>
                      <button type="button" onClick={() => setVotesFor(n.id)} className="px-2.5 py-1.5 rounded-lg bg-[#FEF3E2] text-[#8A5300] text-xs font-semibold hover:bg-[#FCE7C4]">± Votes</button>
                      <Button small kind="danger" onClick={() => remove("nominee", n)}>Delete</Button>
                    </div>
                  </div>
                </article>
              ))}
              <button
                type="button"
                onClick={() => setNomModal({ open: true, nominee: null })}
                className="min-h-[240px] border border-dashed border-[#C7CDD4] rounded-[14px] bg-white text-sm font-semibold text-[#08283B] hover:bg-[#F4F5F7]"
              >
                + Add nominee
              </button>
            </div>
          </Card>
        ) : (
          <Card><p className="m-0 text-sm text-[#5B6472]">Add a category first, then its nominees.</p></Card>
        )}
      </div>

      <CategoryModal
        open={catModal.open}
        category={catModal.category}
        campaignId={id}
        onClose={() => setCatModal({ open: false, category: null })}
        onSaved={(newId) => { if (newId) setSelected(newId); reload(); }}
      />
      <NomineeModal
        open={nomModal.open}
        nominee={nomModal.nominee}
        categoryId={selectedId}
        onClose={() => setNomModal({ open: false, nominee: null })}
        onSaved={reload}
      />
      <VotesModal open={!!votesFor} nomineeId={votesFor ?? undefined} nominees={allNominees(c)} onClose={() => setVotesFor(null)} onSaved={reload} />
    </Page>
  );
}

export default function CampaignNomineesPage() {
  return (
    <RoleGate roles={["COMPANY", "ADMIN"]}>
      <Nominees />
    </RoleGate>
  );
}
