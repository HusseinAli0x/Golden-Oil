import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { fontVariables } from "@/lib/fonts";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: getDictionary("en").meta.notFound.title,
  description: getDictionary("en").meta.notFound.description,
};

/** Unmatched URLs outside /en and /ar (no language in the path): English 404 with a link to Arabic. */
export default function GlobalNotFound() {
  const dict = getDictionary("en");
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>
        <main id="main">
          <NotFoundView locale="en" dict={dict} />
          <p className="wrap pb-12 text-center">
            <Link href="/ar" lang="ar" dir="rtl" className="text-primary">
              {getDictionary("ar").notFound.home}
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
