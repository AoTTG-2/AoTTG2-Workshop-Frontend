"use client";

import { Button } from "@aottg2/ui";
import { Search, UploadCloud } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BrowseAssetGrid, BrowseAssetRail, BrowseSectionShell, BrowseSectionState } from "@/components/BrowseSection";
import { WorkshopAssetCard } from "@/components/WorkshopAssetCard";
import { assetPath, type WorkshopAsset } from "@/lib/api/workshop";
import type { DiscoverData, DiscoverSectionData } from "@/lib/workshop/discover";

export function DiscoverView({ data }: { data: DiscoverData }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  function renderAsset(asset: WorkshopAsset, index: number) {
    return (
      <motion.div key={asset.id} className="relative z-0 hover:z-50 focus-within:z-50" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(Math.min(index, 10) * 0.025)}>
        <WorkshopAssetCard asset={asset} onOpen={() => router.push(assetPath(asset))} />
      </motion.div>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 sm:px-6">
      <motion.header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0)}>
        <div className="min-w-0">
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Discover</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Featured and trending skins, maps, custom logic, and addons.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/skins"><Search className="h-4 w-4" aria-hidden="true" />Browse Skins</Link>
          </Button>
          <Button asChild>
            <Link href="/library/publish"><UploadCloud className="h-4 w-4" aria-hidden="true" />Publish</Link>
          </Button>
        </div>
      </motion.header>

      <div className="grid gap-8 xl:grid-cols-2">
        <DiscoverRailSection
          title="Featured Experiences"
          description="Popular maps, custom logic, and addons."
          viewAllHref="/experiences?sort=popular"
          section={data.featuredExperiences}
          renderAsset={renderAsset}
        />
        <DiscoverRailSection
          title="Featured Skins"
          description="Popular skin uploads and sets."
          viewAllHref="/skins?sort=popular"
          section={data.featuredSkins}
          renderAsset={renderAsset}
        />
      </div>

      <DiscoverGridSection
        title="Trending Experiences"
        description="Maps, custom logic, and addons getting recent activity."
        viewAllHref="/experiences?sort=trending"
        section={data.trendingExperiences}
        renderAsset={renderAsset}
      />

      <DiscoverGridSection
        title="Trending Skins"
        description="Skin uploads and sets getting recent activity."
        viewAllHref="/skins?sort=trending"
        section={data.trendingSkins}
        renderAsset={renderAsset}
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <DiscoverRailSection
          title="New Experiences"
          description="Latest maps, custom logic, and addons."
          viewAllHref="/experiences?sort=newest"
          section={data.newExperiences}
          renderAsset={renderAsset}
        />
        <DiscoverRailSection
          title="New Skins"
          description="Latest skin uploads."
          viewAllHref="/skins?sort=newest"
          section={data.newSkins}
          renderAsset={renderAsset}
        />
      </div>
    </main>
  );
}

function DiscoverGridSection({ title, description, viewAllHref, section, renderAsset }: DiscoverSectionProps) {
  return (
    <BrowseSectionShell title={title} description={description} viewAllHref={viewAllHref}>
      <SectionBody section={section} emptyMessage="No uploads found for this section yet.">
        <BrowseAssetGrid assets={section.assets} renderAsset={renderAsset} />
      </SectionBody>
    </BrowseSectionShell>
  );
}

function DiscoverRailSection({ title, description, viewAllHref, section, renderAsset }: DiscoverSectionProps) {
  return (
    <BrowseSectionShell title={title} description={description} viewAllHref={viewAllHref}>
      <SectionBody section={section} emptyMessage="No uploads found for this rail yet.">
        <BrowseAssetRail assets={section.assets} renderAsset={renderAsset} />
      </SectionBody>
    </BrowseSectionShell>
  );
}

function SectionBody({ section, emptyMessage, children }: { section: DiscoverSectionData; emptyMessage: string; children: ReactNode }) {
  if (section.error) return <BrowseSectionState title="Section unavailable" message="Workshop API data could not be loaded." />;
  if (section.assets.length === 0) return <BrowseSectionState title="No assets yet" message={emptyMessage} />;
  return children;
}

interface DiscoverSectionProps {
  title: string;
  description: string;
  viewAllHref: string;
  section: DiscoverSectionData;
  renderAsset: (asset: WorkshopAsset, index: number) => ReactNode;
}

const motionAnimate = { opacity: 1, y: 0 };

function motionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y };
}

function motionTransition(delay: number) {
  return { duration: 0.18, ease: "easeOut" as const, delay };
}
