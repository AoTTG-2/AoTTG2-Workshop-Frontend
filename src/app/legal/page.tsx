import type { Metadata } from "next";
import Link from "next/link";
import AppFrame from "../app-frame";
import { LEGAL_PAGES, legalHref } from "../../lib/legal";

export const metadata: Metadata = {
  title: "Legal And Rules | AoTTG2 Workshop",
  description: "Workshop disclaimers, content rules, community guidelines, external content notice, asset usage guide, and IP report information.",
  alternates: { canonical: "/legal" },
};

export default function LegalIndexPage() {
  return (
    <AppFrame>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 max-w-3xl">
          <p className="font-primary text-xs uppercase tracking-wider text-primary">Workshop Policy</p>
          <h1 className="mt-2 font-primary text-3xl font-semibold uppercase leading-none tracking-tight">Legal And Rules</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Release-safe public documents for Workshop submissions, external content, community conduct, asset usage, and IP reports.</p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          {LEGAL_PAGES.map((page) => (
            <Link key={page.slug} href={legalHref(page.slug)} className="workshop-control-free border border-border/70 bg-card/40 p-5 transition-colors duration-150 hover:border-primary/50 hover:bg-card">
              <span className="font-primary text-lg uppercase text-foreground">{page.title}</span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{page.summary}</span>
            </Link>
          ))}
        </div>
      </main>
    </AppFrame>
  );
}
