"use client";

import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Spinner, StatCard, Tabs, TabsList, TabsTrigger } from "@aottg2/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Flag, FolderOpen, MessageCircle, Search, ThumbsUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FaDiscord, FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiLink } from "react-icons/fi";
import type { IconType } from "react-icons";
import { authApi, authAssetUrl } from "../auth/api";
import { getAccessToken } from "../auth/storage";
import type { ProfilePreset } from "../auth/types";
import { useAuth } from "../auth/useAuth";
import { ReportDialog } from "../components/ReportDialog";
import { WorkshopAssetCard } from "../components/WorkshopAssetCard";
import { AUTH_FRONTEND_PROFILE_URL } from "../lib/config";
import { assetPath, getFeaturedAssets, listAssets, reportWorkshopAccount, setFeaturedAssets, type PublicCreator, type WorkshopAsset } from "../lib/api/workshop";
import { toast } from "../lib/toast";

const maxFeaturedAssets = 6;
type ProfileAssetTab = "featured" | "latest";

export function CreatorProfile({ creator }: { creator: PublicCreator }) {
  const { isAuthenticated, isLoading, profile: viewerProfile } = useAuth();
  const queryClient = useQueryClient();
  const profile = creator.profile;
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [assetTab, setAssetTab] = useState<ProfileAssetTab>("featured");
  const [featuredPickerOpen, setFeaturedPickerOpen] = useState(false);
  const [featuredAssets, setFeaturedAssetsState] = useState(creator.featuredAssets);
  const socialLinks = socialLinksFromProfile(profile?.socials);
  const token = getAccessToken();
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
  const isOwnProfile = viewerProfile?.accountId === creator.authAccountId;
  const canManageFeatured = Boolean(isOwnProfile && token);
  const featuredQuery = useQuery({
    queryKey: ["workshop", "featured-assets"],
    queryFn: () => getFeaturedAssets(token!),
    enabled: canManageFeatured,
  });
  const saveFeatured = useMutation({
    mutationFn: (ids: string[]) => setFeaturedAssets(token!, ids),
    onSuccess: async (data) => {
      setFeaturedAssetsState(data.assets);
      await queryClient.invalidateQueries({ queryKey: ["workshop", "featured-assets"] });
      setFeaturedPickerOpen(false);
      toast.success("Featured assets saved", { description: "Your public creator page was updated." });
    },
    onError: (error) => toast.error("Could not save featured assets", { description: error instanceof Error ? error.message : "Try again." }),
  });
  const shownFeaturedAssets = featuredAssets;

  useEffect(() => {
    setFeaturedAssetsState(creator.featuredAssets);
  }, [creator.featuredAssets]);

  useEffect(() => {
    if (featuredQuery.data) setFeaturedAssetsState(featuredQuery.data.assets);
  }, [featuredQuery.data]);

  async function submitReport(reason: string, details: string | null) {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to report creators.", { description: "Reports are attached to your account." });
      return;
    }
    try {
      setReportBusy(true);
      await reportWorkshopAccount(creator.authAccountId, reason, details, token);
      toast.success("Creator reported", { description: "Moderators can review it now." });
      setReportOpen(false);
    } catch (error) {
      toast.error("Could not report creator", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <Card className="overflow-hidden border-border bg-card/90 text-card-foreground">
          <div className="relative h-44 bg-muted md:h-56">
            {bannerUrl ? (
              <img src={bannerUrl} alt="" className="h-full w-full object-cover" decoding="async" />
            ) : (
              <div className="h-full w-full bg-background/70" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/85 to-transparent" />
            <div className="absolute -bottom-10 left-6 h-24 w-24 overflow-hidden border-4 border-background bg-muted shadow-xl md:left-8 md:h-28 md:w-28">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${displayName} avatar`} className="h-full w-full object-cover" decoding="async" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-primary text-3xl text-muted-foreground">
                  {initials(displayName)}
                </div>
              )}
            </div>
          </div>
          <CardHeader className="pt-6 md:min-h-32 md:pt-6">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] md:items-start">
              <div className="min-w-0 space-y-3 pt-8 md:pt-10">
                <div className="min-w-0 space-y-2">
                  <CardTitle>{displayName}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">/{creator.creatorName}</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(profile?.createdAt ?? "")}</span>
                  </div>
                </div>
                {profile?.description?.trim() ? (
                  <CardDescription className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed">
                    {profile.description.trim()}
                  </CardDescription>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col items-start gap-4 md:items-end md:justify-self-end">
                {!isLoading && (
                  isOwnProfile ? (
                    <Button type="button" variant="secondary" onClick={() => { window.location.href = AUTH_FRONTEND_PROFILE_URL; }}>
                      Edit Profile
                    </Button>
                  ) : (
                    <Button type="button" variant="destructive" onClick={() => setReportOpen(true)}>
                      <Flag className="h-4 w-4" aria-hidden="true" />
                      Report
                    </Button>
                  )
                )}
                {socialLinks.length ? <SocialLinks links={socialLinks} /> : null}
              </div>
            </div>
          </CardHeader>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Assets" value={formatCount(creator.stats.assetCount)} hint={`${creator.stats.skinPartCount} parts / ${creator.stats.skinSetCount} sets`} icon={<FolderOpen className="h-5 w-5" />} />
          <StatCard label="Followers" value={formatCount(creator.followerCount ?? 0)} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Downloads" value={formatCount(creator.stats.downloadCount)} icon={<Download className="h-5 w-5" />} />
          <StatCard label="Thanks" value={formatCount(creator.stats.likeCount)} icon={<ThumbsUp className="h-5 w-5" />} />
          <StatCard label="Comments" value={formatCount(creator.stats.commentCount)} icon={<MessageCircle className="h-5 w-5" />} />
        </section>

        <Tabs value={assetTab} onValueChange={(value) => setAssetTab(value as ProfileAssetTab)}>
          <TabsList>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="latest">Latest</TabsTrigger>
          </TabsList>
        </Tabs>
        {assetTab === "featured" ? (
          <AssetSection
            title="Featured"
            assets={shownFeaturedAssets}
            empty="No featured assets yet."
            action={canManageFeatured ? <Button type="button" variant="secondary" onClick={() => setFeaturedPickerOpen(true)}>Manage Featured</Button> : null}
          />
        ) : (
          <AssetSection title="Latest" assets={creator.latestAssets} empty="No assets yet." />
        )}
      </div>
      <ReportDialog open={reportOpen} title="Report Creator" description="Send this creator account to the moderation queue." busy={reportBusy} onOpenChange={setReportOpen} onSubmit={submitReport} />
      {canManageFeatured ? (
        <FeaturedAssetPickerDialog
          open={featuredPickerOpen}
          onOpenChange={setFeaturedPickerOpen}
          selectedAssets={shownFeaturedAssets}
          saving={saveFeatured.isPending}
          onSave={(ids) => saveFeatured.mutate(ids)}
        />
      ) : null}
    </main>
  );
}

function SocialLinks({ links }: { links: string[] }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 md:items-end">
      {links.map((url, index) => {
        const href = safeSocialUrl(url);
        const label = socialLabel(url);
        const Icon = socialIcon(url);
        const className = "inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary";
        return href ? (
          <a key={`${url}-${index}`} href={href} target="_blank" rel="noreferrer" className={className}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </a>
        ) : (
          <span key={`${url}-${index}`} className="inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </span>
        );
      })}
    </div>
  );
}

function AssetSection({ title, assets, empty, action }: { title: string; assets: WorkshopAsset[]; empty: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-primary text-xl font-semibold uppercase">{title}</h2>
        {action}
      </div>
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

function FeaturedAssetPickerDialog({
  open,
  onOpenChange,
  selectedAssets,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: WorkshopAsset[];
  saving: boolean;
  onSave: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const token = getAccessToken();
  const selectedIds = useMemo(() => new Set(draftIds), [draftIds]);
  const assetsQuery = useQuery({
    queryKey: ["workshop", "featured-asset-picker", query],
    queryFn: () => listAssets({ mine: true, q: query, pageSize: 48 }, token),
    enabled: open && Boolean(token),
  });

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDraftIds(selectedAssets.map((asset) => asset.id));
  }, [open, selectedAssets]);

  function toggleAsset(asset: WorkshopAsset) {
    setDraftIds((current) => {
      if (current.includes(asset.id)) return current.filter((id) => id !== asset.id);
      if (current.length >= maxFeaturedAssets) {
        toast.info(`Choose up to ${maxFeaturedAssets} featured assets.`, { description: "Remove one before selecting another." });
        return current;
      }
      return [...current, asset.id];
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Featured Assets</DialogTitle>
          <DialogDescription>Choose up to {maxFeaturedAssets} assets for your public profile.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9 text-sm" placeholder="Search your assets" value={query} onChange={(event) => setQuery(event.target.value)} />
            <span className="sr-only">Search assets</span>
          </label>
          {assetsQuery.isLoading ? (
            <div className="grid min-h-48 place-items-center border border-border bg-card/40">
              <Spinner size="sm" variant="primary" label="Loading assets" />
            </div>
          ) : assetsQuery.isError ? (
            <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">Could not load your assets.</div>
          ) : assetsQuery.data?.assets.length ? (
            <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
              {assetsQuery.data.assets.map((asset) => {
                const selected = selectedIds.has(asset.id);
                return (
                  <div key={asset.id} className={`relative z-0 hover:z-50 focus-within:z-50 ${selected ? "ring-2 ring-primary" : ""}`}>
                    <WorkshopAssetCard asset={asset} onOpen={() => toggleAsset(asset)} />
                    {selected ? (
                      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-background/65">
                        <span className="border border-primary bg-primary px-3 py-1 font-primary text-sm font-semibold uppercase text-primary-foreground shadow">SELECTED</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">No matching assets yet.</div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={() => onSave(draftIds)} disabled={saving}>
            {saving ? "Saving..." : "Save Featured"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function socialLinksFromProfile(socials?: Record<string, string>) {
  return Object.values(socials ?? {})
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function socialLabel(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    return url;
  }
}

function socialIcon(url: string): IconType {
  const host = safeSocialUrl(url) ? new URL(url).hostname.replace(/^www\./, "").toLowerCase() : "";
  if (host === "discord.gg" || host.endsWith("discord.com")) return FaDiscord;
  if (host.endsWith("facebook.com") || host === "fb.com") return FaFacebookF;
  if (host.endsWith("instagram.com")) return FaInstagram;
  if (host === "x.com" || host.endsWith("twitter.com")) return FaXTwitter;
  if (host.endsWith("youtube.com") || host === "youtu.be") return FaYoutube;
  return FiLink;
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
