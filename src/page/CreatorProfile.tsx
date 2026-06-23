"use client";

import { Badge, Button, StatCard } from "@aottg2/ui";
import { Download, FolderOpen, MessageCircle, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkshopAssetCard } from "../components/WorkshopAssetCard";
import { assetPath, type PublicCreator, type WorkshopAsset } from "../lib/api/workshop";

export function CreatorProfile({ creator }: { creator: PublicCreator }) {
  const router = useRouter();
  const profile = creator.profile;
  const socials = Object.entries(profile?.socials ?? {}).filter(([, value]) => value.trim());

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="grid gap-4 border border-border bg-card/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-primary text-3xl font-semibold uppercase leading-none text-foreground">{profile?.displayName || creator.displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">/{creator.creatorName}</Badge>
                <span className="text-sm text-muted-foreground">{formatDate(profile?.createdAt ?? "")}</span>
              </div>
            </div>
            <Button type="button" onClick={() => router.push("/library")}>Browse Library</Button>
          </div>
          {profile?.description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{profile.description}</p> : null}
          {socials.length ? (
            <div className="flex flex-wrap gap-2">
              {socials.map(([key, value]) => (
                <Badge key={key} variant="outline">{key}: {value}</Badge>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assets" value={formatCount(creator.stats.assetCount)} hint={`${creator.stats.skinPartCount} parts / ${creator.stats.skinSetCount} sets`} icon={<FolderOpen className="h-5 w-5" />} />
          <StatCard label="Downloads" value={formatCount(creator.stats.downloadCount)} icon={<Download className="h-5 w-5" />} />
          <StatCard label="Thanks" value={formatCount(creator.stats.likeCount)} icon={<ThumbsUp className="h-5 w-5" />} />
          <StatCard label="Comments" value={formatCount(creator.stats.commentCount)} icon={<MessageCircle className="h-5 w-5" />} />
        </section>

        <AssetSection title="Featured" assets={creator.featuredAssets} empty="No featured assets yet." />
        <AssetSection title="Latest" assets={creator.latestAssets} empty="No assets yet." />
      </div>
    </main>
  );
}

function AssetSection({ title, assets, empty }: { title: string; assets: WorkshopAsset[]; empty: string }) {
  const router = useRouter();
  return (
    <section className="grid gap-3">
      <h2 className="font-primary text-xl font-semibold uppercase">{title}</h2>
      {assets.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <WorkshopAssetCard key={asset.id} asset={asset} onOpen={() => router.push(assetPath(asset))} />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card/40 p-4 text-sm text-muted-foreground">{empty}</div>
      )}
    </section>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function formatDate(value: string) {
  if (!value) return "";
  return `Creator since ${new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(value))}`;
}
