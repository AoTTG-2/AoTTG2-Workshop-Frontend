"use client";

import { Badge, Button, StatCard } from "@aottg2/ui";
import { useQuery } from "@tanstack/react-query";
import { Download, FolderOpen, MessageCircle, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { authApi, authAssetUrl } from "../auth/api";
import type { ProfilePreset } from "../auth/types";
import { WorkshopAssetCard } from "../components/WorkshopAssetCard";
import { assetPath, type PublicCreator, type WorkshopAsset } from "../lib/api/workshop";

export function CreatorProfile({ creator }: { creator: PublicCreator }) {
  const router = useRouter();
  const profile = creator.profile;
  const socials = Object.entries(profile?.socials ?? {}).filter(([, value]) => value.trim());
  const presetsQuery = useQuery({
    queryKey: ["auth", "profile-presets"],
    queryFn: async () => {
      const result = await authApi.getProfilePresets();
      if (!result.ok) throw new Error(result.data.error ?? "Failed to load profile presets");
      return result.data;
    },
    enabled: Boolean(profile?.avatarKey || profile?.bannerKey),
    staleTime: 60 * 60 * 1000,
  });
  const avatarPreset = presetsQuery.data?.avatars.find((preset) => preset.key === profile?.avatarKey);
  const bannerPreset = presetsQuery.data?.banners.find((preset) => preset.key === profile?.bannerKey);
  const displayName = profile?.displayName || creator.displayName;
  const avatarUrl = presetImageUrl(avatarPreset);
  const bannerUrl = presetImageUrl(bannerPreset);

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="overflow-hidden border border-border bg-card/50">
          <div className="h-32 bg-muted/40 sm:h-44">
            {bannerUrl ? <img src={bannerUrl} alt={`${displayName} banner`} className="h-full w-full object-cover" /> : null}
          </div>
          <div className="grid gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-wrap items-end gap-4">
                <ProfileAvatar imageUrl={avatarUrl} name={displayName} />
                <div className="min-w-0 pb-1">
                  <h1 className="font-primary text-3xl font-semibold uppercase leading-none text-foreground">{displayName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">/{creator.creatorName}</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(profile?.createdAt ?? "")}</span>
                  </div>
                </div>
              </div>
              <Button type="button" onClick={() => router.push("/library")}>Browse Library</Button>
            </div>
            {profile?.description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{profile.description}</p> : null}
            {socials.length ? (
              <div className="flex flex-wrap gap-2">
                {socials.map(([key, value]) => (
                  <SocialBadge key={key} label={key} value={value} />
                ))}
              </div>
            ) : null}
          </div>
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

function ProfileAvatar({ imageUrl, name }: { imageUrl: string; name: string }) {
  return (
    <div className="-mt-14 grid h-24 w-24 shrink-0 place-items-center overflow-hidden border-4 border-background bg-muted font-primary text-2xl uppercase text-muted-foreground">
      {imageUrl ? <img src={imageUrl} alt={`${name} avatar`} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

function SocialBadge({ label, value }: { label: string; value: string }) {
  const href = safeSocialUrl(value);
  if (!href) return <Badge variant="outline">{label}: {value}</Badge>;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <Badge variant="outline">{label}</Badge>
    </a>
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

function presetImageUrl(preset?: ProfilePreset) {
  return preset ? authAssetUrl(preset.imageUrl) : "";
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("") || "?";
}

function safeSocialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
