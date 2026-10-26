"use client";

import { useState } from "react";

import { api } from "@/platform/lib/api";
import { errorText } from "@/platform/v2/format";
import { Button, Card, ErrorNote, Field, inputClass } from "@/platform/v2/ui";

/** Change my own password (POST /dashboard/password/). */
export function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    setMessage("");
    try {
      await api.post("/dashboard/password/", { current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setMessage("Password changed.");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="My password">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Field label="Current password">
          <input type="password" autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" hint="At least 8 characters, not too common.">
          <input type="password" autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
      </div>
      {err && <ErrorNote>{err}</ErrorNote>}
      {message && <p className="m-0 text-sm font-semibold text-[#0B6B43]">{message}</p>}
      <div><Button kind="dark" busy={busy} disabled={!current || !next} onClick={save}>Change password</Button></div>
    </Card>
  );
}
