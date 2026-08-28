"use client";

import { useEffect, useState } from "react";

/**
 * Types each word out, holds it, deletes it, moves on. With a single word it
 * types once and stops, which is how the hero eyebrow uses it.
 */
export default function Typewriter({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  holdMs = 2000,
}: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  holdMs?: number;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex % words.length] ?? "";
    const done = text === word;

    // A lone word stays on screen once typed.
    if (done && words.length === 1) return;

    if (done && !deleting) {
      const t = setTimeout(() => setDeleting(true), holdMs);
      return () => clearTimeout(t);
    }

    if (deleting && text === "") {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
      return;
    }

    const t = setTimeout(
      () => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)),
      deleting ? deletingSpeed : typingSpeed,
    );
    return () => clearTimeout(t);
  }, [text, deleting, wordIndex, words, typingSpeed, deletingSpeed, holdMs]);

  return (
    <span>
      {text}
      <span className="animate-pulse" aria-hidden="true">
        |
      </span>
    </span>
  );
}
