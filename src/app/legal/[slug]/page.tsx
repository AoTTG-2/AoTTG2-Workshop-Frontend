import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFrame from "../../app-frame";
import { LEGAL_PAGES, legalHref, legalPageForSlug, type LegalSlug } from "../../../lib/legal";
import { legalBodyForSlug } from "../legal-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LEGAL_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPageForSlug(slug);
  if (!page) return {};
  return {
    title: `${page.title} | AoTTG2 Workshop`,
    description: page.summary,
    alternates: { canonical: legalHref(page.slug) },
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = legalPageForSlug(slug);
  if (!page) notFound();
  const body = legalBodyForSlug(page.slug as LegalSlug);

  return (
    <AppFrame>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-8 border-b border-border pb-6">
          <Link href="/legal" className="font-primary text-xs uppercase tracking-wider text-primary hover:underline">Legal And Rules</Link>
          <h1 className="mt-3 font-primary text-3xl font-semibold uppercase leading-none tracking-tight">{page.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{page.summary}</p>
        </header>

        <article className="grid gap-8">
          <section className="grid gap-4 text-sm leading-7 text-foreground/90">
            {body.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>

          {body.sections.map((section) => (
            <section key={section.title} className="grid gap-3 border-t border-border/70 pt-6">
              <h2 className="font-primary text-xl font-semibold uppercase leading-none tracking-tight">{section.title}</h2>
              {section.body?.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-foreground/90">{paragraph}</p>)}
              {section.bullets ? (
                <ul className="grid gap-2 pl-5 text-sm leading-7 text-foreground/90">
                  {section.bullets.map((item) => <li key={item} className="list-disc">{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </main>
    </AppFrame>
  );
}
