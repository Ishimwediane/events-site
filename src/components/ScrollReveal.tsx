"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Animation = "fadeInUp" | "fadeInDown" | "scaleIn" | "slideInLeft" | "slideInRight";

const CLASS: Record<Animation, string> = {
  fadeInUp: "animate-fadeInUp",
  fadeInDown: "animate-fadeInDown",
  scaleIn: "animate-scaleIn",
  slideInLeft: "animate-slideInLeft",
  slideInRight: "animate-slideInRight",
};

/**
 * Plays one of the globals.css keyframes the first time the element scrolls
 * into view. Content is rendered either way, so it is safe for SEO and for
 * users with JavaScript disabled.
 */
export default function ScrollReveal({
  children,
  animation = "fadeInUp",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Without IntersectionObserver, or with reduced motion, just show it.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${shown ? CLASS[animation] : "opacity-0"}`}
      style={shown && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
