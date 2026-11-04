import { Mail, Phone } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { CONTACT, mailtoHref } from "@/lib/site";

interface ContactButtonsProps {
  common: Dictionary["common"];
  /** Email subject, e.g. "Product enquiry: VDO". */
  subject?: string;
  tone?: "light" | "dark";
  compact?: boolean;
}

/** Phone + email are the only contact channels (no forms, no contact page). */
export function ContactButtons({ common, subject, tone = "light", compact = false }: ContactButtonsProps) {
  const size = compact ? "min-h-[46px] px-4" : "";
  const secondary = tone === "dark" ? "btn-ghost-light" : "btn-outline";
  return (
    <div className="flex flex-wrap gap-2.5">
      <a
        href={CONTACT.phoneHref}
        dir="ltr"
        className={`btn ${tone === "dark" ? "btn-amber" : "btn-primary"} ${size} gap-2`}
        aria-label={`${common.phoneAria}: ${CONTACT.phoneDisplay}`}
      >
        <Phone size={17} aria-hidden />
        {CONTACT.phoneDisplay}
      </a>
      <a
        href={mailtoHref(subject)}
        dir="ltr"
        className={`btn ${secondary} ${size} gap-2 text-start [overflow-wrap:anywhere] ${compact ? "text-[13px]" : "text-sm"}`}
        aria-label={`${common.emailAria}: ${CONTACT.email}`}
      >
        <Mail size={17} aria-hidden className="shrink-0" />
        {CONTACT.email}
      </a>
    </div>
  );
}
