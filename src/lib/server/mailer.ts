import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Enquiry } from "@/lib/enquiry";

/**
 * Server-side email delivery for the enquiry form, through the Resend HTTP API
 * (https://resend.com/docs/api-reference/emails/send-email). Keys never leave the server.
 *
 * Environment:
 *   RESEND_API_KEY       required — API key from Resend
 *   CONTACT_FROM_EMAIL   required — sender on a domain verified in Resend,
 *                        e.g. "GOR Website <website@alshabaka-althahabiya.com.iq>"
 *   CONTACT_TO_EMAIL     optional — recipient, defaults to info@alshabaka-althahabiya.com.iq
 *   CONTACT_FORM_SECRET  optional — signs form tokens; derived from RESEND_API_KEY when unset
 *   RESEND_API_URL       optional — override the API endpoint (testing only)
 */

const DEFAULT_TO = "info@alshabaka-althahabiya.com.iq";

export function mailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);
}

// ── Form tokens: prove the form was loaded from this site, and not submitted instantly ──

const TOKEN_MIN_AGE_MS = 3_000; // humans need at least a few seconds to fill the form
const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.CONTACT_FORM_SECRET || process.env.RESEND_API_KEY;
  if (!s) throw new Error("CONTACT_FORM_SECRET or RESEND_API_KEY must be set");
  return s;
}

function sign(ts: string): string {
  return createHmac("sha256", secret()).update(`enquiry:${ts}`).digest("base64url");
}

export function issueToken(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

export type TokenCheck = "ok" | "invalid" | "too-fast" | "expired";

export function checkToken(token: unknown, now = Date.now()): TokenCheck {
  if (typeof token !== "string") return "invalid";
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !/^\d{13}$/.test(ts)) return "invalid";
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  const age = now - Number(ts);
  if (age < TOKEN_MIN_AGE_MS) return "too-fast";
  if (age > TOKEN_MAX_AGE_MS) return "expired";
  return "ok";
}

// ── Best-effort rate limit (per server instance) ──

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function rateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear(); // keep memory bounded
  return false;
}

// ── Sending ──

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const LABELS: Array<[keyof Enquiry, string]> = [
  ["person", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["company", "Company"],
  ["product", "Product of interest"],
  ["quantity", "Required quantity"],
  ["delivery", "Delivery location"],
  ["subject", "Subject"],
];

/** Sends the enquiry; resolves with the provider's message id only once Resend accepted it. */
export async function sendEnquiryEmail(e: Enquiry, locale: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email is not configured (RESEND_API_KEY / CONTACT_FROM_EMAIL)");
  const to = process.env.CONTACT_TO_EMAIL || DEFAULT_TO;

  const rows = LABELS.filter(([k]) => e[k]);
  const text = [
    "New enquiry from the Golden Oil Refinery website",
    "",
    ...rows.map(([k, label]) => `${label}: ${e[k]}`),
    `Site language: ${locale}`,
    "",
    "Message:",
    e.message,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2933;line-height:1.6">
<h2 style="margin:0 0 12px;font-size:18px;color:#0f3949">New enquiry from the Golden Oil Refinery website</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, label]) => `<tr><td style="color:#5b6673;vertical-align:top"><b>${label}</b></td><td>${esc(e[k])}</td></tr>`)
    .join("")}<tr><td style="color:#5b6673"><b>Site language</b></td><td>${esc(locale)}</td></tr></table>
<h3 style="margin:18px 0 6px;font-size:15px;color:#0f3949">Message</h3>
<div style="white-space:pre-wrap;border-left:3px solid #ffc000;padding-left:12px">${esc(e.message)}</div>
</div>`;

  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: e.email,
      subject: `Website enquiry: ${e.subject}`,
      text,
      html,
    }),
    // Below the form's 15 s client timeout, so the visitor gets the real server answer.
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
  if (!data || typeof data.id !== "string") throw new Error("Resend accepted the request but returned no message id");
  return data.id;
}
