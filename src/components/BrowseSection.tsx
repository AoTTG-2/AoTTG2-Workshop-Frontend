"use client";

import { Button } from "@aottg2/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import type { WorkshopAsset } from "@/lib/api/workshop";

interface BrowseSectionShellProps {
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
}

interface BrowseAssetsProps {
  assets: WorkshopAsset[];
  renderAsset: (asset: WorkshopAsset, index: number) => ReactNode;
}

export function BrowseSectionShell({ title, description, viewAllHref, viewAllLabel = "View all", children }: BrowseSectionShellProps) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-primary text-xl font-semibold uppercase leading-none text-foreground">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {viewAllHref ? (
          <Button asChild type="button" variant="secondary" className="min-h-9">
            <Link href={viewAllHref}>{viewAllLabel}</Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function BrowseAssetGrid({ assets, renderAsset }: BrowseAssetsProps) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{assets.map(renderAsset)}</div>;
}

export function BrowseAssetRail({ assets, renderAsset }: BrowseAssetsProps) {
  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-2">
      {assets.map((asset, index) => (
        <div key={asset.id} className="w-[min(20rem,82vw)] shrink-0 snap-start">
          {renderAsset(asset, index)}
        </div>
      ))}
    </div>
  );
}

export function BrowseSectionSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid border border-border bg-card/60">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="grid gap-3 p-3">
            <div className="h-4 animate-pulse bg-muted" />
            <div className="h-10 animate-pulse bg-muted" />
            <div className="h-7 animate-pulse bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BrowseSectionState({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid min-h-60 place-items-center border border-border bg-card/40 p-6 text-center">
      <div>
        <h2 className="font-primary text-2xl uppercase text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
