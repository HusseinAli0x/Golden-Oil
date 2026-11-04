import { notFound } from "next/navigation";

// Any unknown path under /en or /ar renders the localized 404 inside the site shell.
export function generateStaticParams() {
  return [{ missing: ["404"] }];
}

export default function MissingPage(): never {
  notFound();
}
