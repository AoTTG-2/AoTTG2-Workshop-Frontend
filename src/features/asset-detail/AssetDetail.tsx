"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/auth/storage";
import { assetPath, getAsset, getAssetBySeoPath, trackAssetView, type WorkshopAsset } from "@/lib/api/workshop";
import { AssetDetailContent } from "./components/AssetDetailContent";

interface AssetDetailProps {
  id?: string;
  creatorName?: string;
  assetSlug?: string;
  initialAsset?: WorkshopAsset;
}

export function AssetDetail({ id = "", creatorName = "", assetSlug = "", initialAsset }: AssetDetailProps = {}) {
  const router = useRouter();
  const seoLookup = creatorName && assetSlug ? { creatorName, assetSlug } : null;
  const query = useQuery({
    queryKey: ["workshop", "asset", seoLookup ?? id],
    queryFn: () => (seoLookup ? getAssetBySeoPath(seoLookup.creatorName, seoLookup.assetSlug, getAccessToken()) : getAsset(id, getAccessToken())),
    enabled: Boolean(seoLookup || id),
    initialData: initialAsset,
  });
  const asset = query.data;
  const refetchAsset = query.refetch;
  const trackedView = useRef<string | null>(null);

  useEffect(() => {
    if (asset && id) {
      const canonicalPath = assetPath(asset);
      if (canonicalPath !== "/library/" + id) {
        router.replace(canonicalPath);
      }
    }
  }, [asset, id, router]);

  useEffect(() => {
    if (!asset?.id || asset.status !== "visible" || trackedView.current === asset.id) return;
    trackedView.current = asset.id;
    void trackAssetView(asset.id, getAccessToken())
      .then((result) => {
        if (result.counted) void refetchAsset();
      })
      .catch(() => undefined);
  }, [asset?.id, asset?.status, refetchAsset]);

  if (query.isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 h-28 animate-pulse bg-muted" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="h-80 animate-pulse bg-muted" />
        </div>
      </main>
    );
  }

  if (query.isError || !asset) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/discover">
          Back to discover
        </Link>
        <div className="mt-6 border border-border bg-card/40 p-6">
          <h1 className="font-primary text-3xl uppercase">Asset not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This asset could not be loaded.</p>
        </div>
      </main>
    );
  }

  return <AssetDetailContent asset={asset} onRefresh={() => refetchAsset()} />;
}
