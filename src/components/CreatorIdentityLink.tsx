"use client";

import { Avatar, AvatarFallback, AvatarImage, Badge, Card, CardContent, Popover, PopoverContent, PopoverTrigger, Spinner } from "@aottg2/ui";
import { useQuery } from "@tanstack/react-query";
import { Download, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { authApi, authAssetUrl } from "../auth/api";
import type { ProfilePreset } from "../auth/types";
import { getPublicCreator, type PublicCreator } from "../lib/api/workshop";

interface CreatorIdentityLinkProps {
  displayName: string;
  creatorName?: string | null;
  avatarKey?: string | null;
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  showAvatar?: boolean;
  showNoCreatorPill?: boolean;
  prefixBy?: boolean;
  stopPropagation?: boolean;
}

export function CreatorIdentityLink({
  displayName,
  creatorName,
  avatarKey,
  className,
  avatarClassName = "h-8 w-8",
  nameClassName,
  showAvatar = true,
  showNoCreatorPill = true,
  prefixBy = false,
  stopPropagation = false,
}: CreatorIdentityLinkProps) {
  const avatarUrl = useAvatarUrl(showAvatar ? avatarKey : null);
  const name = displayName?.trim() || "Unknown";
  const content = (
    <>
      {prefixBy ? <span className="font-normal normal-case text-muted-foreground/70">by</span> : null}
      {showAvatar ? (
        <Avatar className={`shrink-0 border border-border bg-muted ${avatarClassName}`}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${name} avatar`} /> : null}
          <AvatarFallback className="font-primary text-xs uppercase">{initials(name)}</AvatarFallback>
        </Avatar>
      ) : null}
      <span className={`font-primary font-semibold uppercase leading-none ${nameClassName ?? ""}`}>{name}</span>
      {!creatorName && showNoCreatorPill ? (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {"{no creator name yet}"}
        </Badge>
      ) : null}
    </>
  );

  const classes = `inline-flex min-w-0 items-center gap-2 text-foreground ${className ?? ""}`;
  const onClick = stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined;

  if (!creatorName) {
    return (
      <span className={classes} onClick={onClick}>
        {content}
      </span>
    );
  }

  return (
    <CreatorProfilePopover creatorName={creatorName} fallbackDisplayName={name}>
      <Link className={`${classes} hover:text-primary`} href={`/${encodeURIComponent(creatorName)}`} onClick={onClick}>
        {content}
      </Link>
    </CreatorProfilePopover>
  );
}

export function CreatorMention({
  displayName,
  creatorName,
  children,
}: {
  displayName: string;
  creatorName?: string | null;
  children?: ReactNode;
}) {
  const label = children ?? displayName;
  return creatorName ? (
    <CreatorProfilePopover creatorName={creatorName} fallbackDisplayName={displayName}>
      <Link className="font-primary font-semibold text-foreground transition-colors hover:text-primary focus:text-primary" href={`/${encodeURIComponent(creatorName)}`}>
        {label}
      </Link>
    </CreatorProfilePopover>
  ) : (
    <span className="font-primary font-semibold text-foreground">{label}</span>
  );
}

function CreatorProfilePopover({ creatorName, fallbackDisplayName, children }: { creatorName: string; fallbackDisplayName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const creatorQuery = useQuery({
    queryKey: ["workshop", "creator-preview", creatorName],
    queryFn: () => getPublicCreator(creatorName),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const profile = creatorQuery.data?.profile;
  const presetsQuery = useQuery({
    queryKey: ["auth", "profile-presets"],
    queryFn: async () => {
      const result = await authApi.getProfilePresets();
      if (!result.ok) throw new Error(result.data.error ?? "Failed to load profile presets");
      return result.data;
    },
    enabled: open && Boolean(profile?.avatarKey || profile?.bannerKey),
    staleTime: 60 * 60 * 1000,
  });
  const avatarUrl = presetImageUrl(presetsQuery.data?.avatars.find((preset) => preset.key === profile?.avatarKey));
  const bannerUrl = presetImageUrl(presetsQuery.data?.banners.find((preset) => preset.key === profile?.bannerKey));

  function clearCloseTimer() {
    if (!closeTimerRef.current) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function openNow() {
    clearCloseTimer();
    setOpen(true);
  }

  function closeSoon() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onBlur={closeSoon} onFocus={openNow} onPointerEnter={openNow} onPointerLeave={closeSoon}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="z-[9999] w-80 border-border bg-card p-0 text-card-foreground shadow-2xl"
        sideOffset={1}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={openNow}
        onPointerLeave={closeSoon}
      >
        <CreatorProfilePreview
          creator={creatorQuery.data}
          creatorName={creatorName}
          displayName={profile?.displayName || creatorQuery.data?.displayName || fallbackDisplayName}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
          loading={creatorQuery.isLoading}
        />
      </PopoverContent>
    </Popover>
  );
}

function CreatorProfilePreview({
  creator,
  creatorName,
  displayName,
  avatarUrl,
  bannerUrl,
  loading,
}: {
  creator?: PublicCreator;
  creatorName: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  loading: boolean;
}) {
  const bio = creator?.profile?.description?.trim();
  return (
    <Card className="overflow-hidden border-0 bg-card text-card-foreground shadow-none">
      <div className="relative h-20 bg-muted">
        {bannerUrl ? <img src={bannerUrl} alt="" className="h-full w-full object-cover" decoding="async" /> : <div className="h-full w-full bg-background/70" />}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/85 to-transparent" />
        <Avatar className="absolute -bottom-7 left-4 h-14 w-14 border-4 border-background bg-muted shadow-lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} /> : null}
          <AvatarFallback className="font-primary text-lg uppercase">{initials(displayName)}</AvatarFallback>
        </Avatar>
      </div>
      <CardContent className="grid gap-3 p-4 pt-9">
        <div className="min-w-0">
          <div className="truncate font-primary text-lg font-semibold uppercase leading-none">{displayName}</div>
          <Badge variant="secondary" className="mt-2">/{creatorName}</Badge>
        </div>
        {loading ? (
          <Spinner variant="primary" label="Loading creator" />
        ) : (
          <>
            <p className="line-clamp-3 min-h-10 text-sm leading-5 text-muted-foreground">{bio || "No bio yet."}</p>
            <div className="flex items-center gap-4 text-xs font-semibold uppercase text-muted-foreground">
              <StatIcon icon={<Users className="h-4 w-4" />} label="followers" value={creator?.followerCount ?? 0} />
              <StatIcon icon={<ThumbsUp className="h-4 w-4" />} label="Thanks" value={creator?.stats.likeCount ?? 0} />
              <StatIcon icon={<Download className="h-4 w-4" />} label="downloads" value={creator?.stats.downloadCount ?? 0} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatIcon({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${formatCount(value)} ${label}`} title={`${formatCount(value)} ${label}`}>
      {icon}
      {formatCount(value)}
    </span>
  );
}

function useAvatarUrl(avatarKey?: string | null) {
  const presetsQuery = useQuery({
    queryKey: ["auth", "profile-presets"],
    queryFn: async () => {
      const result = await authApi.getProfilePresets();
      if (!result.ok) throw new Error(result.data.error ?? "Failed to load profile presets");
      return result.data;
    },
    enabled: Boolean(avatarKey),
    staleTime: 60 * 60 * 1000,
  });
  return presetImageUrl(presetsQuery.data?.avatars.find((preset) => preset.key === avatarKey));
}

function presetImageUrl(preset?: ProfilePreset) {
  return preset?.imageUrl ? authAssetUrl(preset.imageUrl) : undefined;
}

function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || "?";
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}
