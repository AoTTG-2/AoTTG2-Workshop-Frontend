"use client";

import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Spinner, Tabs, TabsList, TabsTrigger } from "@aottg2/ui";
import { type QueryKey, useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Download, Search, Sparkles, ThumbsUp, UserCheck, UserPlus, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { authApi, authAssetUrl } from "../../auth/api";
import { getAccessToken } from "../../auth/storage";
import type { ProfilePreset } from "../../auth/types";
import { useAuth } from "../../auth/useAuth";
import { Pagination } from "../../components/Pagination";
import { listCreators, setCreatorFollow, type CreatorListResponse, type CreatorSummary } from "../../lib/api/workshop";
import { queryClient } from "../../lib/queryClient";
import { toast } from "../../lib/toast";

const pageSize = 15;
const sortOptions = [
  { label: "Popular", value: "popular", icon: Sparkles },
  { label: "Relevance", value: "relevance", icon: Search },
  { label: "Newest", value: "newest", icon: Users },
  { label: "Most Downloaded", value: "most_downloaded", icon: Download },
  { label: "Most Thanked", value: "most_liked", icon: ThumbsUp },
];

export function CreatorsView() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "followed" ? "followed" : "discover";
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? (q ? "relevance" : tab === "followed" ? "newest" : "popular");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchText, setSearchText] = useState(q);
  const token = isAuthenticated ? getAccessToken() : null;

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const creatorsQuery = useQuery({
    queryKey: ["workshop", "creators", { q, tab, sort, page, pageSize, viewer: profile?.accountId }],
    queryFn: () => listCreators({ q, tab, sort, page, pageSize }, token),
    enabled: tab !== "followed" || Boolean(token),
  });
  const creators = creatorsQuery.data?.creators ?? [];
  const needsAvatars = creators.some((creator) => creator.profile?.avatarKey);
  const presetsQuery = useQuery({
    queryKey: ["auth", "profile-presets"],
    queryFn: async () => {
      const result = await authApi.getProfilePresets();
      if (!result.ok) throw new Error(result.data.error ?? "Failed to load profile presets");
      return result.data;
    },
    enabled: needsAvatars,
    staleTime: 60 * 60 * 1000,
  });
  const avatarByKey = useMemo(() => new Map((presetsQuery.data?.avatars ?? []).map((preset) => [preset.key, preset])), [presetsQuery.data?.avatars]);
  function updateCreatorCache(creatorName: string, update: (creator: CreatorSummary) => CreatorSummary) {
    queryClient.setQueriesData<CreatorListResponse>({ queryKey: ["workshop", "creators"] }, (data) => data
      ? { ...data, creators: data.creators.map((creator) => creator.creatorName === creatorName ? update(creator) : creator) }
      : data);
  }

  const follow = useMutation({
    mutationFn: (input: { creator: CreatorSummary; following: boolean }) => setCreatorFollow(input.creator.creatorName, input.following, token!),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["workshop", "creators"] });
      const previous = queryClient.getQueriesData<CreatorListResponse>({ queryKey: ["workshop", "creators"] });
      updateCreatorCache(input.creator.creatorName, (creator) => ({
        ...creator,
        viewerFollowing: input.following,
        followerCount: Math.max(0, creator.followerCount + (input.following ? 1 : -1)),
      }));
      return { previous };
    },
    onSuccess: (result, input) => {
      updateCreatorCache(input.creator.creatorName, (creator) => ({
        ...creator,
        viewerFollowing: result.following,
        followerCount: result.followerCount,
      }));
    },
    onError: (error, _input, context?: { previous: [QueryKey, CreatorListResponse | undefined][] }) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error("Could not update follow", { description: error instanceof Error ? error.message : "Try again." });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["workshop", "creators"] });
      void queryClient.invalidateQueries({ queryKey: ["workshop", "notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["workshop", "dashboard"] });
    },
  });
  function updateParams(next: { q?: string; tab?: string; sort?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 1 || (key === "tab" && value === "discover")) params.delete(key);
      else params.set(key, String(value));
    }
    if (next.q !== undefined || next.tab !== undefined || next.sort !== undefined) params.delete("page");
    router.push(`/creators${params.size ? `?${params.toString()}` : ""}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchText.trim(), sort: "relevance", page: 1 });
  }

  function handleTabChange(value: string) {
    const nextTab = value === "followed" ? "followed" : "discover";
    updateParams({ tab: nextTab, sort: searchText.trim() ? "relevance" : nextTab === "followed" ? "newest" : "popular", page: 1 });
  }

  function toggleFollow(event: MouseEvent, creator: CreatorSummary) {
    event.stopPropagation();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to follow creators.", { description: "Follows are saved to your account." });
      return;
    }
    if (profile?.accountId === creator.authAccountId) return;
    follow.mutate({ creator, following: !creator.viewerFollowing });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Creators</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">Find Workshop creators and keep track of the people you follow.</p>
        </div>
      </div>

      <section className="grid gap-4">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="flex flex-col gap-3 border border-border bg-card/50 p-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList>
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="followed">Followed</TabsTrigger>
            </TabsList>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
              <Input className="h-10 text-sm" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search creators..." />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="secondary" className="min-h-10 justify-between gap-2">
                    {renderSortIcon(sort)}
                    {sortLabel(sort)}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem key={option.value} className={`gap-2 ${sort === option.value ? "bg-secondary text-secondary-foreground" : ""}`} onSelect={() => updateParams({ sort: option.value, page: 1 })}>
                      <option.icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </Tabs>

        {tab === "followed" && isLoading ? <LoadingPanel /> : null}
        {tab === "followed" && !isLoading && !isAuthenticated ? <StateMessage title="Sign in to follow creators" message="Followed creators are saved to your account." /> : null}
        {creatorsQuery.isLoading ? <LoadingPanel /> : null}
        {creatorsQuery.isError ? <StateMessage title="Creators unavailable" message="Could not load creators. Try again." /> : null}
        {creatorsQuery.data && creators.length === 0 ? <StateMessage title={tab === "followed" ? "No followed creators" : "No creators found"} message={tab === "followed" ? "Follow creators from Discover." : "Try a different search."} /> : null}
        {creators.length ? (
          <>
            <div className="grid gap-3">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.creatorName}
                  creator={creator}
                  avatarUrl={presetImageUrl(creator.profile?.avatarKey ? avatarByKey.get(creator.profile.avatarKey) : undefined)}
                  busy={follow.isPending && follow.variables?.creator.creatorName === creator.creatorName}
                  isOwn={profile?.accountId === creator.authAccountId}
                  onOpen={() => router.push(`/${encodeURIComponent(creator.creatorName)}`)}
                  onFollow={toggleFollow}
                />
              ))}
            </div>
            <Pagination className="mt-4" page={page} total={creatorsQuery.data?.total ?? 0} pageSize={pageSize} onPage={(nextPage) => updateParams({ page: nextPage })} />
          </>
        ) : null}
      </section>
    </main>
  );
}

function CreatorCard({ creator, avatarUrl, busy, isOwn, onOpen, onFollow }: { creator: CreatorSummary; avatarUrl?: string; busy: boolean; isOwn: boolean; onOpen: () => void; onFollow: (event: MouseEvent, creator: CreatorSummary) => void }) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  }

  return (
    <Card className="workshop-hover-card cursor-pointer border-border bg-card/70" role="link" tabIndex={0} aria-label={`Open ${creator.displayName}`} onClick={onOpen} onKeyDown={handleKeyDown}>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 gap-4">
          <Avatar className="h-16 w-16 shrink-0 border border-border bg-muted">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${creator.displayName} avatar`} /> : null}
            <AvatarFallback className="font-primary text-lg uppercase">{initials(creator.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-primary text-xl font-semibold uppercase">{creator.displayName}</h2>
              <Badge variant="secondary">/{creator.creatorName}</Badge>
            </div>
            <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-5 text-muted-foreground">{creator.profile?.description?.trim() || "No bio yet."}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold uppercase text-muted-foreground">
              <Stat icon={<Users className="h-3.5 w-3.5" />} label="followers" value={creator.followerCount} />
              <Stat icon={<Download className="h-3.5 w-3.5" />} label="downloads" value={creator.stats.downloadCount} />
              <Stat icon={<ThumbsUp className="h-3.5 w-3.5" />} label="thanks" value={creator.stats.likeCount} />
            </div>
          </div>
        </div>
        {isOwn ? (
          <Button type="button" variant="secondary" disabled onClick={(event) => event.stopPropagation()}>You</Button>
        ) : (
          <Button type="button" variant={creator.viewerFollowing ? "secondary" : "default"} disabled={busy} onClick={(event) => onFollow(event, creator)}>
            {creator.viewerFollowing ? <UserCheck className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {busy ? "Saving..." : creator.viewerFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} ${label}`}>
      {icon}
      {formatCount(value)}
    </span>
  );
}

function LoadingPanel() {
  return (
    <div className="grid min-h-64 place-items-center border border-border bg-card/40">
      <Spinner variant="primary" label="Loading creators" />
    </div>
  );
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid min-h-60 place-items-center border border-border bg-card/40 p-6 text-center">
      <div>
        <h2 className="font-primary text-2xl uppercase text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function presetImageUrl(preset?: ProfilePreset) {
  return preset?.imageUrl ? authAssetUrl(preset.imageUrl) : undefined;
}

function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || "?";
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function renderSortIcon(sort: string) {
  const Icon = sortOptions.find((option) => option.value === sort)?.icon ?? Search;
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

function sortLabel(sort: string) {
  return sortOptions.find((option) => option.value === sort)?.label ?? sort.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
