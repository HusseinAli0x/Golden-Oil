"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, RotateCcw, Send } from "lucide-react";
import { ENQUIRY_FIELDS, MAX_LENGTH, normalizeEnquiry, validateEnquiry, type EnquiryField, type FieldError } from "@/lib/enquiry";
import type { Dictionary, Locale } from "@/lib/i18n";

const field =
  "min-h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-base text-ink transition-colors placeholder:text-subtle hover:border-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-amber/60 aria-[invalid=true]:border-error disabled:opacity-60";

type Status = "idle" | "sending" | "success" | "error";
/** Slightly above the server's 3 s minimum form age (src/lib/server/mailer.ts). */
const MIN_TOKEN_AGE_MS = 3_200;

/** Whole submission (token wait + request) gives up after this long. */
const TIMEOUT_MS = 15_000;

type ServerError = "spam" | "token" | "rate" | "send" | "invalid" | "unavailable" | "bad-request";
type ClientError = ServerError | "timeout" | "network";

/**
 * Enquiry form. Submits in the background with fetch to /api/contact, which emails
 * the refinery from the server — no page reload, no redirect, no mail app, no mailto.
 * Spam checks: hidden honeypot field, a signed timing token, same-origin check and
 * a per-connection rate limit.
 *
 * Success is shown only when the server answers `{ ok: true }`, which it does only
 * after the email provider accepted the message. Any failure keeps what was typed
 * and offers a retry; the whole attempt times out after 15 s.
 */
export function InquiryForm({ t, products, locale }: { t: Dictionary["contact"]; products: ReadonlyArray<string>; locale: Locale }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<EnquiryField, FieldError>>>({});
  const token = useRef<{ value: string | null; at: number } | null>(null);
  const busy = useRef(false); // synchronous guard against double clicks / double Enter

  const fetchToken = useCallback(async () => {
    try {
      const r = await fetch("/api/contact", { cache: "no-store" });
      const d = (r.ok ? await r.json() : null) as { token?: string | null } | null;
      token.current = { value: d?.token ?? null, at: Date.now() };
    } catch {
      token.current = null;
    }
  }, []);
  const loadToken = useCallback(() => {
    token.current = null;
    void fetchToken();
  }, [fetchToken]);

  /** A fresh form token, at least as old as the server's minimum (very fast autofill waits briefly). */
  const readyToken = async () => {
    if (!token.current) await fetchToken();
    const wait = (token.current?.at ?? Date.now()) + MIN_TOKEN_AGE_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return token.current?.value ?? null;
  };

  useEffect(loadToken, [loadToken]);

  const errorMessage = (code: ClientError | undefined) => {
    switch (code) {
      case "rate":
        return t.errRate;
      case "spam":
      case "token":
        return t.errSpam;
      case "unavailable":
        return t.errUnavailable;
      case "send":
        return t.errSend;
      case "invalid":
        return t.errInvalid;
      case "timeout":
        return t.errTimeout;
      case "network":
        return t.errNetwork;
      default:
        return t.error;
    }
  };

  const focusFirst = (form: HTMLFormElement, found: Partial<Record<EnquiryField, FieldError>>) =>
    form.querySelector<HTMLElement>(`[name="${ENQUIRY_FIELDS.find((k) => found[k])}"]`)?.focus();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // stay on the page: no navigation, no reload
    if (busy.current) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const enquiry = normalizeEnquiry(Object.fromEntries(ENQUIRY_FIELDS.map((k) => [k, String(data.get(k) ?? "")])));
    const found = validateEnquiry(enquiry);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus("idle");
      setMessage("");
      focusFirst(form, found);
      return;
    }

    busy.current = true;
    setStatus("sending");
    setMessage("");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const post = async () => {
      const formToken = await readyToken();
      if (ctrl.signal.aborted) throw new DOMException("timeout", "AbortError");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...enquiry, website: String(data.get("website") ?? ""), token: formToken, locale }),
        signal: ctrl.signal,
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: ServerError; fields?: Partial<Record<EnquiryField, FieldError>> };
      return { ok: res.ok && body.ok === true, body };
    };
    try {
      let result = await post();
      // An expired or missing form token (e.g. the page sat open for hours): get a fresh one and retry once.
      if (!result.ok && result.body.error === "token") {
        token.current = null;
        result = await post();
      }
      if (result.ok) {
        form.reset(); // clear only after the server confirmed delivery
        setErrors({});
        setStatus("success");
        setMessage(t.success);
      } else {
        if (result.body.fields) {
          setErrors(result.body.fields);
          focusFirst(form, result.body.fields);
        }
        setStatus("error");
        setMessage(errorMessage(result.body.error));
      }
    } catch (err) {
      setStatus("error");
      setMessage(errorMessage(err instanceof DOMException && err.name === "AbortError" ? "timeout" : "network"));
    } finally {
      window.clearTimeout(timer);
      busy.current = false;
      loadToken(); // tokens are per form; fetch a fresh one for any next attempt
    }
  };

  const sending = status === "sending";
  const label = "flex flex-col gap-1.5 text-sm font-semibold text-ink";
  const req = <span aria-hidden className="text-error"> *</span>;

  /** Accessible wiring for one field: name, validity, error text. */
  const a11y = (k: EnquiryField) => ({
    name: k,
    maxLength: MAX_LENGTH[k],
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `err-${k}` : undefined,
  });
  const err = (k: EnquiryField) =>
    errors[k] ? (
      <span id={`err-${k}`} className="text-[13px] font-medium text-error">
        {t[errors[k]!]}
      </span>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className="relative grid grid-cols-1 gap-4 min-[640px]:grid-cols-2">
      <fieldset disabled={sending} className="contents">
        <label className={label}>
          <span>
            {t.person}
            {req}
          </span>
          <input type="text" autoComplete="name" required className={field} {...a11y("person")} />
          {err("person")}
        </label>
        <label className={label}>
          <span>
            {t.email}
            {req}
          </span>
          <input type="email" dir="ltr" autoComplete="email" required className={`${field} text-start`} {...a11y("email")} />
          {err("email")}
        </label>
        <label className={`${label} min-[640px]:col-span-2`}>
          <span>
            {t.subject}
            {req}
          </span>
          <input type="text" required className={field} {...a11y("subject")} />
          {err("subject")}
        </label>
        <label className={label}>
          {t.company}
          <input type="text" autoComplete="organization" className={field} {...a11y("company")} />
        </label>
        <label className={label}>
          {t.phone}
          <input type="tel" dir="ltr" autoComplete="tel" className={`${field} text-start`} {...a11y("phone")} />
          {err("phone")}
        </label>
        <label className={`${label} min-[640px]:col-span-2`}>
          {t.product}
          <select defaultValue="" className={field} {...a11y("product")}>
            <option value="">{t.productPh}</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value={t.other}>{t.other}</option>
          </select>
        </label>
        <label className={label}>
          {t.quantity}
          <input type="text" className={field} {...a11y("quantity")} />
        </label>
        <label className={label}>
          {t.delivery}
          <input type="text" className={field} {...a11y("delivery")} />
        </label>
        <label className={`${label} min-[640px]:col-span-2`}>
          <span>
            {t.message}
            {req}
          </span>
          <textarea rows={5} required className={`${field} py-3`} {...a11y("message")} />
          {err("message")}
        </label>
      </fieldset>

      {/* Honeypot: invisible to people and screen readers; bots tend to fill it. */}
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          {t.website}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="flex flex-col gap-3 min-[640px]:col-span-2">
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary gap-2 disabled:cursor-wait disabled:opacity-80" disabled={sending} aria-disabled={sending}>
            {sending ? <LoaderCircle size={17} aria-hidden className="animate-spin" /> : <Send size={17} aria-hidden className="rtl:-scale-x-100" />}
            {sending ? t.sending : t.send}
          </button>
          {status === "idle" && <p className="m-0 text-sm text-subtle">{t.note}</p>}
        </div>
        <div role="status" aria-live="polite">
          {message && (
            <p
              className={`m-0 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[15px] leading-relaxed [animation:fade-in_.25s_ease_both] ${
                status === "success" ? "border-teal/30 bg-teal/[0.07] text-teal" : "border-error/30 bg-error/[0.06] text-error"
              }`}
            >
              {status === "success" ? <CircleCheck size={19} aria-hidden className="mt-0.5 shrink-0" /> : <CircleAlert size={19} aria-hidden className="mt-0.5 shrink-0" />}
              <span className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span>{message}</span>
                {status === "error" && (
                  <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-error/40 bg-surface px-4 text-sm font-semibold text-error hover:border-error">
                    <RotateCcw size={15} aria-hidden className="rtl:-scale-x-100" />
                    {t.retry}
                  </button>
                )}
              </span>
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
