"use client";

/** Add or remove votes by hand (cash votes, corrections). Every change is logged with the user's email. */
import { useState } from "react";

import { api } from "@/platform/lib/api";
import { errorText } from "../format";
import { Button, ErrorNote, Field, Modal, inputClass } from "../ui";
import type { Nominee } from "./shared";

type Props = {
  open: boolean; onClose: () => void; onSaved: () => void;
  nominees: (Nominee & { categoryName?: string })[]; nomineeId?: string;
};

/** Mounted only while open, so every opening starts with an empty form. */
export default function VotesModal(props: Props) {
  return props.open ? <VotesForm {...props} /> : null;
}

function VotesForm({ onClose, onSaved, nominees, nomineeId }: Props) {
  const [nominee, setNominee] = useState(nomineeId || "");
  const [votes, setVotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const chosen = nominees.find((n) => n.id === nominee);
  const save = async () => {
    const n = parseInt(votes, 10);
    if (!nominee) return setError("Choose a nominee.");
    if (!n) return setError("Enter how many votes to add, or a minus number to remove.");
    if (!reason.trim()) return setError("Write a reason. It is recorded with the change.");
    setBusy(true);
    setError("");
    try {
      await api.post("/voting/manual-adjustments/", { nominee, votes_added: n, reason: reason.trim() });
      onSaved();
      onClose();
    } catch (e) {
      setError(errorText(e, "Could not save the change."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={nomineeId && chosen ? `± Votes for ${chosen.name}` : "Add or remove votes by hand"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="dark" busy={busy} onClick={save}>Save change</Button>
        </>
      }
    >
      <p className="m-0 text-[13px] text-[#5B6472]">For votes paid in cash or corrections. Every change is recorded with your name.</p>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!nomineeId && (
        <Field label="Nominee">
          <select className={inputClass} value={nominee} onChange={(e) => setNominee(e.target.value)}>
            <option value="">Choose a nominee</option>
            {[...nominees].sort((a, b) => a.name.localeCompare(b.name)).map((n) => (
              <option key={n.id} value={n.id}>{n.name}{n.categoryName ? ` · ${n.categoryName}` : ""}</option>
            ))}
          </select>
        </Field>
      )}
      {chosen && <p className="m-0 text-[13px] text-[#374151]">Now: <b>{chosen.votes.toLocaleString("en-GB")}</b> votes</p>}
      <Field label="Votes (− to remove)">
        <input className={inputClass} inputMode="numeric" value={votes} onChange={(e) => setVotes(e.target.value.replace(/[^\d-]/g, ""))} placeholder="e.g. 50 or -10" />
      </Field>
      <Field label="Reason">
        <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Cash at the office, receipt 014" />
      </Field>
    </Modal>
  );
}
