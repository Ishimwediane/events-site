"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { errorText } from "./format";
import { Button, Card, ErrorNote, Field, inputClass } from "./ui";

/** Change your own password: the current one, then the new one. */
export function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api.post("/dashboard/password/", { current_password: current, new_password: next });
      setMsg("Password changed.");
      setCurrent("");
      setNext("");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Password">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Field label="Current password">
          <input type="password" name="current-password-check" autoComplete="new-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" hint="At least 8 characters, not only numbers.">
          <input type="password" name="new-password" autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
      </div>
      {err && <ErrorNote>{err}</ErrorNote>}
      {msg && <p className="m-0 text-sm font-semibold text-[#0B6B43]">{msg}</p>}
      <div><Button kind="dark" busy={busy} disabled={!current || !next} onClick={save}>Change password</Button></div>
    </Card>
  );
}
