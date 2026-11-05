/**
 * Enquiry form rules, shared by the browser (instant feedback) and the
 * /api/contact route (the check that actually counts).
 */

export const ENQUIRY_FIELDS = ["person", "email", "subject", "message", "company", "phone", "product", "quantity", "delivery"] as const;
export type EnquiryField = (typeof ENQUIRY_FIELDS)[number];
export type Enquiry = Record<EnquiryField, string>;

export const REQUIRED_FIELDS: ReadonlyArray<EnquiryField> = ["person", "email", "subject", "message"];

export const MAX_LENGTH: Record<EnquiryField, number> = {
  person: 100,
  email: 254,
  subject: 150,
  message: 5000,
  company: 150,
  phone: 40,
  product: 120,
  quantity: 120,
  delivery: 200,
};

export const MIN_MESSAGE = 10;

/** Error codes map to dictionary keys on the client. */
export type FieldError = "errRequired" | "errEmail" | "errShort" | "errPhone";

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
/** Optional phone: digits with the usual separators, optional leading +, 7–15 digits in total. */
const PHONE_RE = /^\+?[0-9٠-٩\s().-]+$/;
const phoneDigits = (s: string) => s.replace(/[^0-9٠-٩]/g, "").length;

/** Trims every field, drops unknown keys, cuts over-long values and strips control characters. */
export function normalizeEnquiry(input: Record<string, unknown>): Enquiry {
  const out = {} as Enquiry;
  for (const k of ENQUIRY_FIELDS) {
    const raw = typeof input[k] === "string" ? (input[k] as string) : "";
    // Single-line fields lose all line breaks (no header injection); the message keeps them.
    const cleaned = k === "message" ? raw.replace(/[^\P{Cc}\n\t]/gu, "") : raw.replace(/\p{Cc}/gu, " ");
    out[k] = cleaned.trim().slice(0, MAX_LENGTH[k]);
  }
  return out;
}

export function validateEnquiry(e: Enquiry): Partial<Record<EnquiryField, FieldError>> {
  const errors: Partial<Record<EnquiryField, FieldError>> = {};
  for (const k of REQUIRED_FIELDS) if (!e[k]) errors[k] = "errRequired";
  if (e.email && !EMAIL_RE.test(e.email)) errors.email = "errEmail";
  if (e.message && e.message.length < MIN_MESSAGE) errors.message = "errShort";
  if (e.phone && (!PHONE_RE.test(e.phone) || phoneDigits(e.phone) < 7 || phoneDigits(e.phone) > 15)) errors.phone = "errPhone";
  return errors;
}
