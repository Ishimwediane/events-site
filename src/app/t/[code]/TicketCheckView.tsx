"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, Ticket, XCircle } from "lucide-react";
import { checkTicket, type TicketCheck } from "@/lib/api";
import { imageUrl, FLYER_FALLBACK } from "@/lib/images";
import { brand } from "@/config/site";

const KIGALI: Intl.DateTimeFormatOptions = { timeZone: "Africa/Kigali" };

function when(iso: string, withYear = true) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    ...KIGALI, weekday: "short", day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}),
  });
  const time = d.toLocaleTimeString("en-GB", { ...KIGALI, hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

type Look = { icon: typeof CheckCircle2; color: string; ring: string; title: string; text: string };

function lookOf(check: TicketCheck): Look {
  switch (check.status) {
    case "VALID":
      return {
        icon: CheckCircle2, color: "text-green-600", ring: "bg-green-50 border-green-200",
        title: "Valid ticket",
        text: "This is a genuine ticket and it has not been used yet. Show this QR at the entrance — it is scanned once, at the door.",
      };
    case "USED":
      return {
        icon: XCircle, color: "text-amber-600", ring: "bg-amber-50 border-amber-200",
        title: "Already used",
        text: `This ticket was scanned at the entrance${"usedAt" in check && check.usedAt ? ` on ${when(check.usedAt, false)}` : ""}. It cannot get anyone in again. If you just bought it from someone, ask them for your money back.`,
      };
    case "CANCELLED":
      return {
        icon: AlertCircle, color: "text-red-600", ring: "bg-red-50 border-red-200",
        title: "Event cancelled",
        text: `This event has been cancelled. Call ${brand.phone} about your ticket.`,
      };
    case "EVENT_ENDED":
      return {
        icon: AlertCircle, color: "text-gray-500", ring: "bg-gray-50 border-gray-200",
        title: "This event has ended",
        text: "Thank you for coming. This ticket is no longer valid.",
      };
    case "NOT_FOUND":
      return {
        icon: XCircle, color: "text-red-600", ring: "bg-red-50 border-red-200",
        title: "Not a valid ticket",
        text: `This code is not one of our tickets. Buy tickets only on this website or from the organiser, and call ${brand.phone} if you were sold this one.`,
      };
    case "TOO_MANY":
      return {
        icon: Clock, color: "text-gray-500", ring: "bg-gray-50 border-gray-200",
        title: "Too many checks",
        text: "Please wait a minute and try again.",
      };
    default:
      return {
        icon: AlertCircle, color: "text-gray-500", ring: "bg-gray-50 border-gray-200",
        title: "We could not check this ticket",
        text: "Check your internet connection and reload the page.",
      };
  }
}

export default function TicketCheckView({ code }: { code: string }) {
  const [check, setCheck] = useState<TicketCheck | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkTicket(code).then((result) => {
      if (!cancelled) setCheck(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!check) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[var(--orange-accent)] animate-spin" />
      </section>
    );
  }

  const look = lookOf(check);
  const Icon = look.icon;
  const event = "event" in check ? check.event : undefined;

  return (
    <section className="min-h-[70vh] bg-white py-16 md:py-20">
      <div className="container-custom max-w-lg">
        <div className={`rounded-2xl border p-6 md:p-8 text-center ${look.ring}`}>
          <Icon className={`w-14 h-14 mx-auto mb-4 ${look.color}`} />
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--primary-blue)] mb-3">{look.title}</h1>
          <p className="text-sm text-gray-600 leading-relaxed">{look.text}</p>
        </div>

        {event && (
          <div className="mt-6 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="relative aspect-[16/9] bg-gray-100">
              <Image
                src={imageUrl(event.flyer, FLYER_FALLBACK)}
                alt={event.title}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <h2 className="text-lg font-semibold text-[var(--primary-blue)]">{event.title}</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {"ticketType" in check && check.ticketType && (
                  <li className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[var(--orange-accent)] shrink-0" />
                    <span>
                      {check.ticketType} · <span className="font-mono">{check.code}</span>
                    </span>
                  </li>
                )}
                {event.startDate && (
                  <li className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[var(--orange-accent)] shrink-0" />
                    <span>{when(event.startDate)}</span>
                  </li>
                )}
                {event.location && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--orange-accent)] shrink-0" />
                    <span>{event.location}</span>
                  </li>
                )}
              </ul>
              <Link href={`/events/${event.slug}`} className="btn-outline inline-block mt-2">
                Event details
              </Link>
            </div>
          </div>
        )}

        {!event && (
          <div className="mt-8 text-center">
            <Link href="/events" className="btn-primary">
              See our events
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
