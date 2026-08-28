import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const REQUIRED_ENV = ["EMAIL_USER", "EMAIL_PASS", "CONTACT_EMAIL"] as const;

/** Escapes user input before it goes anywhere near the HTML body of an email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Keeps a crafted value from injecting extra headers into the subject line. */
function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { success: false, message: "Please fill in your name, email, subject and message." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, message: "That email address does not look right." },
      { status: 400 },
    );
  }

  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Names only — never log anything derived from the password.
    console.error("[contact] missing env vars:", missing.join(", "));
    return NextResponse.json(
      {
        success: false,
        message: `Email is not configured on this server. Please call us instead.`,
      },
      { status: 503 },
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        // App passwords are shown in groups of four; strip the spaces.
        pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
      },
    });

    await transporter.sendMail({
      from: `"${sanitizeHeader(name)}" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `Website enquiry: ${sanitizeHeader(subject)}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "not given"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <h3>New website enquiry</h3>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone) || "not given"}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] send failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, message: "Could not send your message. Please call us instead." },
      { status: 502 },
    );
  }
}
