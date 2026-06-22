import type { Metadata } from "next";
import Link from "next/link";
import AppFrame from "./app-frame";
import { assetPath, listAssets, type WorkshopAsset } from "../lib/api/workshop";
import { absoluteUrl, safeJsonLd } from "../lib/seo";

export const metadata: Metadata = {
  title: "AoTTG2 Workshop | Browse AoTTG2 Skins",
  description: "Find AoTTG2 skins and skin sets from community creators. Browse human, titan, shifter, skybox, map, and custom logic assets.",
  alternates: { canonical: "/" },
};

const skinLinks = [
  { href: "/library?category=human", label: "Human skins" },
  { href: "/library?category=titan", label: "Titan skins" },
  { href: "/library?category=shifter", label: "Shifter skins" },
  { href: "/library?type=skin_set", label: "Skin sets" },
];

export const revalidate = 300;

export default async function HomePage() {
  const featured = await loadFeaturedAssets();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AoTTG2 Workshop",
    url: absoluteUrl("/"),
    description: "Browse and import AoTTG2 skins, skin sets, maps, and custom logic shared by the community.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/library")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <section className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="font-primary text-sm uppercase text-primary">Community assets for AoTTG2</p>
            <h1 className="mt-3 max-w-4xl text-balance font-primary text-5xl font-semibold uppercase leading-none tracking-tight sm:text-6xl">AoTTG2 Workshop</h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
              Browse AoTTG2 skins, skin sets, maps, skyboxes, and custom logic from community creators. Find assets, preview details, and import what fits your next run.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-11 items-center border border-primary bg-primary px-4 font-primary text-sm font-semibold uppercase text-primary-foreground transition-transform active:scale-[0.96]" href="/library">
                Browse library
              </Link>
              <Link className="inline-flex min-h-11 items-center border border-border px-4 font-primary text-sm font-semibold uppercase text-foreground hover:text-primary" href="/login">
                Sign in to publish
              </Link>
            </div>
          </div>
          <nav className="grid gap-2" aria-label="Popular Workshop categories">
            {skinLinks.map((item) => (
              <Link key={item.href} className="border border-border bg-card/50 px-4 py-3 font-primary text-sm font-semibold uppercase text-foreground hover:border-primary/70 hover:text-primary" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-primary text-2xl font-semibold uppercase leading-none">Latest assets</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fresh Workshop uploads for players looking for AoTTG2 skins and content.</p>
            </div>
            <Link className="text-sm font-semibold uppercase text-muted-foreground hover:text-primary" href="/library">
              View all
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((asset) => (
                <FeaturedAsset key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card/40 p-5 text-sm text-muted-foreground">The Workshop library will appear here when the API is available.</div>
          )}
        </section>
      </main>
    </AppFrame>
  );
}

async function loadFeaturedAssets() {
  try {
    const data = await listAssets({ pageSize: 6 });
    return data.assets;
  } catch {
    // ponytail: API can be offline during build; homepage copy is still crawlable.
    return [];
  }
}

function FeaturedAsset({ asset }: { asset: WorkshopAsset }) {
  const thumbnail = asset.media.find((item) => item.kind === "thumbnail") ?? asset.media[0];

  return (
    <article className="grid overflow-hidden border border-border bg-card/60">
      <Link className="grid" href={assetPath(asset)}>
        {thumbnail ? (
          <img className="aspect-video w-full object-cover" src={thumbnail.url} alt={thumbnail.description || asset.title} loading="lazy" />
        ) : (
          <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>
        )}
      </Link>
      <div className="grid gap-2 p-3">
        <Link className="line-clamp-1 font-primary text-sm font-semibold uppercase text-foreground hover:text-primary" href={assetPath(asset)}>
          {asset.title}
        </Link>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{asset.shortDescription || `${asset.title} by ${asset.authorDisplayName}`}</p>
      </div>
    </article>
  );
}
