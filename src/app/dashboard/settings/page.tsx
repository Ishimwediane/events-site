"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { getImageUrl } from "@/platform/lib/images";
import { errorText } from "@/platform/v2/format";
import { PasswordCard } from "@/platform/v2/PasswordCard";
import { RoleGate, useSession } from "@/platform/v2/Shell";
import { Badge, Button, Card, Empty, ErrorNote, Field, Notice, Page, Table, Td, inputClass } from "@/platform/v2/ui";
import { AddDoorStaff, RemoveDoorStaff } from "@/platform/v2/org/DoorStaff";
import { listOf, useLoad } from "@/platform/v2/useLoad";

type Staff = { id: string; email: string; name: string; event_title: string };

const Saved = ({ text }: { text: string }) => (text ? <p className="m-0 text-sm font-semibold text-[#0B6B43]">{text}</p> : null);

function Organisation() {
  const { company, refreshCompany } = useSession();
  const [name, setName] = useState(company?.name ?? "");
  const [description, setDescription] = useState(company?.description ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const data = new FormData();
      data.append("name", name);
      data.append("description", description);
      if (logo) data.append("logo", logo);
      await api.patch("/companies/profile/me/", data, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshCompany();
      setSaved("Saved.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const preview = logo ? URL.createObjectURL(logo) : company?.logo ? getImageUrl(company.logo) : null;
  return (
    <Card title="Organisation">
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex flex-wrap items-center gap-5">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-[72px] h-[72px] rounded-2xl object-cover" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-2xl bg-[#08283B] text-[#F39C12] flex items-center justify-center font-heading text-3xl font-bold">{(name[0] || "O").toUpperCase()}</div>
        )}
        <label className="px-3.5 py-2 rounded-[10px] border border-[#D1D5DB] bg-white text-sm font-semibold text-[#08283B] cursor-pointer hover:bg-[#F4F5F7]">
          Upload logo
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Field label="Organisation name"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Login email" hint="Ask Ozone Events to change it."><input className={inputClass} value={(company as { email?: string } | null)?.email ?? ""} disabled /></Field>
      </div>
      <Field label="About your organisation"><textarea rows={3} className={`${inputClass} resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <div className="flex items-center gap-3">
        <Button kind="primary" busy={busy} onClick={save} disabled={!name.trim()}>Save changes</Button>
        <Saved text={saved} />
      </div>
    </Card>
  );
}

function YourName() {
  const { user } = useSession();
  const [first, setFirst] = useState(user.first_name ?? "");
  const [last, setLast] = useState(user.last_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const save = async () => {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await api.patch("/users/me/", { first_name: first, last_name: last });
      setSaved("Saved.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Your name">
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><input className={inputClass} value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
        <Field label="Last name"><input className={inputClass} value={last} onChange={(e) => setLast(e.target.value)} /></Field>
      </div>
      <div className="flex items-center gap-3"><Button busy={busy} onClick={save}>Save name</Button><Saved text={saved} /></div>
    </Card>
  );
}

function Team() {
  const { user } = useSession();
  const staff = useLoad(() => api.get("/dashboard/gate-staff/").then((r) => listOf<Staff>(r.data)));
  return (
    <Card padded={false} title="Team" actions={<AddDoorStaff onAdded={staff.reload} />}>
      <p className="m-0 px-[22px] text-[13px] text-[#5B6472]">You can add door staff, who can only scan tickets and never see money. For any other account, contact Ozone Events · +250 784 731 957.</p>
      {staff.error && <div className="px-[22px]"><ErrorNote>{staff.error}</ErrorNote></div>}
      <Table head={["Person", "Can do", "Event", ""]} minWidth={640} empty={!staff.loading && (staff.data ?? []).length === 0 && <Empty>No door staff yet.</Empty>}>
        <tr>
          <Td first className="font-semibold">{user.email}</Td>
          <Td><Badge tone="green">Owner · everything</Badge></Td>
          <Td className="text-[#5B6472]">All</Td>
          <Td last />
        </tr>
        {(staff.data ?? []).map((s) => (
          <tr key={s.id}>
            <Td first className="font-semibold">{s.name || s.email}{s.name && <><br /><span className="text-xs font-normal text-[#5B6472]">{s.email}</span></>}</Td>
            <Td><Badge>Door staff · scan tickets</Badge></Td>
            <Td className="text-[#374151]">{s.event_title}</Td>
            <Td last className="text-right"><RemoveDoorStaff id={s.id} who={s.email} onRemoved={staff.reload} /></Td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Settings() {
  return (
    <Page title="Settings" subtitle="Your organisation, your login and the people who can sign in.">
      <div className="flex flex-col gap-5 max-w-[1100px]">
        <Organisation />
        <Team />
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <YourName />
          <PasswordCard />
        </div>
        <Notice>Need help? Call Ozone Events on +250 784 731 957.</Notice>
      </div>
    </Page>
  );
}

export default function SettingsPage() {
  return <RoleGate roles={["COMPANY"]}><Settings /></RoleGate>;
}
