"use client";

import type { FormEvent } from "react";
import { Send } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { CONTACT } from "@/lib/site";

const field =
  "min-h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-base text-ink transition-colors placeholder:text-subtle hover:border-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-amber/60";

/** Enquiry form. There is no backend: submitting opens the visitor's mail app with the enquiry filled in. */
export function InquiryForm({ t, products }: { t: Dictionary["contact"]; products: ReadonlyArray<string> }) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const lines = [
      [t.company, v("company")],
      [t.person, v("person")],
      [t.product, v("product")],
      [t.quantity, v("quantity")],
      [t.delivery, v("delivery")],
      [t.email, v("email")],
      [t.phone, v("phone")],
    ]
      .filter(([, val]) => val)
      .map(([k, val]) => `${k}: ${val}`);
    const body = `${lines.join("\n")}\n\n${v("message")}`;
    const subject = `${t.formTi}${v("product") ? ` — ${v("product")}` : ""}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const label = "flex flex-col gap-1.5 text-sm font-semibold text-ink";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2">
      <label className={label}>
        {t.company}
        <input name="company" type="text" autoComplete="organization" className={field} />
      </label>
      <label className={label}>
        {t.person}
        <input name="person" type="text" autoComplete="name" required className={field} />
      </label>
      <label className={`${label} min-[640px]:col-span-2`}>
        {t.product}
        <select name="product" defaultValue="" className={field}>
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
        <input name="quantity" type="text" className={field} />
      </label>
      <label className={label}>
        {t.delivery}
        <input name="delivery" type="text" className={field} />
      </label>
      <label className={label}>
        {t.email}
        <input name="email" type="email" dir="ltr" autoComplete="email" required className={`${field} text-start`} />
      </label>
      <label className={label}>
        {t.phone}
        <input name="phone" type="tel" dir="ltr" autoComplete="tel" className={`${field} text-start`} />
      </label>
      <label className={`${label} min-[640px]:col-span-2`}>
        {t.message}
        <textarea name="message" rows={5} className={`${field} py-3`} />
      </label>
      <div className="flex flex-wrap items-center gap-4 min-[640px]:col-span-2">
        <button type="submit" className="btn btn-primary gap-2">
          <Send size={17} aria-hidden className="rtl:-scale-x-100" />
          {t.send}
        </button>
        <p role="status" className="m-0 text-sm text-subtle">
          {t.note}
        </p>
      </div>
    </form>
  );
}
