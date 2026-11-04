import { normalizeEnquiry, validateEnquiry } from "@/lib/enquiry";
import { checkToken, issueToken, mailerConfigured, rateLimited, sendEnquiryEmail } from "@/lib/server/mailer";

/**
 * Enquiry form endpoint (called with fetch — no page navigation).
 * GET  → a short-lived signed form token (anti-bot timing check).
 * POST → validates, runs spam checks, and emails the enquiry to the refinery.
 * Responses carry an `error` code the form maps to a localized message.
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  // 200 either way: an unconfigured server is reported on submit, not as a console error on page load.
  return json({ token: mailerConfigured() ? issueToken() : null });
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // some privacy setups strip it; the token still applies
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") || req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "spam" }, 403);
  if (!mailerConfigured()) {
    console.error("[contact] RESEND_API_KEY / CONTACT_FROM_EMAIL are not set; enquiry not sent.");
    return json({ error: "unavailable" }, 503);
  }
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "bad-request" }, 415);

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 20_000) return json({ error: "bad-request" }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object") throw new Error();
  } catch {
    return json({ error: "bad-request" }, 400);
  }

  // Honeypot: a hidden field real visitors never fill. Pretend success so bots learn nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") return json({ ok: true });

  if (checkToken(body.token) !== "ok") return json({ error: "spam" }, 400);

  if (rateLimited(clientIp(req))) return json({ error: "rate" }, 429);

  const enquiry = normalizeEnquiry(body);
  const fields = validateEnquiry(enquiry);
  if (Object.keys(fields).length) return json({ error: "invalid", fields }, 422);

  const locale = body.locale === "ar" ? "ar" : "en";
  try {
    await sendEnquiryEmail(enquiry, locale);
  } catch (err) {
    console.error("[contact] email send failed:", err instanceof Error ? err.message : err);
    return json({ error: "send" }, 502);
  }
  return json({ ok: true });
}
