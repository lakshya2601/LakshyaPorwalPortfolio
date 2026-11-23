import { NextResponse } from "next/server";

// Sends contact-form messages to your inbox through Resend (https://resend.com).
// Set RESEND_API_KEY and CONTACT_TO_EMAIL in Vercel → Project → Settings → Environment Variables.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "").trim().slice(0, 200);
  const company = String(body.company || "").trim().slice(0, 200);
  const reason = String(body.reason || "").trim().slice(0, 100);
  const message = String(body.message || "").trim().slice(0, 5000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Write a short message first." }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    return NextResponse.json({ error: "Contact form isn't set up yet. Email me directly instead." }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `Portfolio: ${reason || "New message"}${company ? ` · ${company}` : ""}`,
      html: `<p><b>From:</b> ${esc(email)}</p><p><b>Company:</b> ${esc(company || "—")}</p><p><b>Reason:</b> ${esc(reason)}</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Couldn't send right now. Try again or email me." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
