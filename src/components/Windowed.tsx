"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders its children only while they are near the screen; further away they
 * are replaced by an empty box of the same height. On long lists (AGACIRO: 21
 * categories, 67 nominees) this keeps memory flat however far the visitor
 * scrolls — every image already scrolled past used to stay decoded until
 * Chrome on iPhone ran out of memory ("Can't open this page").
 *
 * `initiallyVisible` sections render on the server too, so the top of the
 * page is in the HTML and shows before any JavaScript runs.
 */
export default function Windowed({
  children,
  id,
  className = "",
  initiallyVisible = false,
  estimatedHeight = 900,
}: {
  children: ReactNode;
  /** Anchor id, kept on the wrapper so #links work even while unloaded. */
  id?: string;
  className?: string;
  initiallyVisible?: boolean;
  estimatedHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(initiallyVisible);
  const [height, setHeight] = useState(estimatedHeight);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Remember the real height while the content is still there, so the
        // placeholder keeps the page from jumping.
        if (!entry.isIntersecting && el.offsetHeight > 0) setHeight(el.offsetHeight);
        setNear(entry.isIntersecting);
      },
      // About two phone screens above and below stay loaded.
      { rootMargin: "1600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={className} style={near ? undefined : { height }}>
      {near ? children : null}
    </div>
  );
}
