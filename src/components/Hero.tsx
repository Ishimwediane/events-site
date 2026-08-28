"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Typewriter from "./Typewriter";
import { activeHeroSlides, brand } from "@/config/site";

const AUTOPLAY_MS = 7000;

export default function Hero() {
  const slides = activeHeroSlides();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[index];

  return (
    <section
      className="relative flex items-center bg-[var(--primary-blue)] min-h-[85vh] md:min-h-[calc(100vh-76px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Slides cross-fade rather than sliding, so no duplicate-clone bookkeeping. */}
      <div className="absolute inset-0 bg-[var(--primary-blue)] overflow-hidden z-0">
        {slides.map((s, i) => (
          <div
            key={s.image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={s.image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority={i === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[var(--primary-blue)]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-blue)] via-transparent to-[var(--primary-blue)]/10" />
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-lg bg-white border-2 border-white/20 text-gray-800 hover:bg-[var(--orange-hover)] hover:text-white hover:border-[var(--orange-hover)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => go(index + 1)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-lg bg-white border-2 border-white/20 text-gray-800 hover:bg-[var(--orange-hover)] hover:text-white hover:border-[var(--orange-hover)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="container-custom relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="text-[var(--orange-accent)] text-sm md:text-base font-semibold tracking-widest uppercase">
              <Typewriter words={[brand.name]} typingSpeed={100} />
            </div>
          </div>

          <h1
            key={slide.message}
            className="text-4xl md:text-6xl lg:text-7xl text-white font-bold mb-8 leading-tight animate-fadeInUp"
          >
            {slide.message}
          </h1>

          <div className="animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
            <Link
              href={slide.buttonLink}
              className="inline-block bg-[var(--orange-accent)] hover:bg-[var(--orange-hover)] text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl tracking-wider uppercase text-sm font-semibold"
            >
              {slide.buttonText}
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((s, i) => (
            <button
              key={s.image}
              onClick={() => go(i)}
              className={`h-3 rounded-full transition-all duration-300 ${
                i === index ? "bg-[var(--orange-accent)] w-8" : "bg-white/50 hover:bg-white/75 w-3"
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
