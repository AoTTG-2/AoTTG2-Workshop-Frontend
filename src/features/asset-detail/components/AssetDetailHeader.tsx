import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@aottg2/ui";
import { motion } from "motion/react";
import { Copy, Download, Eye, Flag, Link as LinkIcon, MessageCircle, MoreHorizontal, Pencil, Star, ThumbsUp, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { WorkshopAsset } from "@/lib/api/workshop";
import { formatCount } from "../format";
import { motionAnimate, motionInitial, motionTransition, reactionBurst, reactionTap, reactionTransition } from "../motion";

export function AssetDetailHeader({
  asset,
  canDeleteAsset,
  canEditAsset,
  favoriteBurst,
  favorited,
  isOwnAsset,
  likeBurst,
  liked,
  publicAssetUrl,
  reduceMotion,
  onCopyText,
  onEditAsset,
  onFavoriteAnimationComplete,
  onImport,
  onLikeAnimationComplete,
  onOpenDelete,
  onOpenReport,
  onToggleFavorite,
  onToggleLike,
}: {
  asset: WorkshopAsset;
  canDeleteAsset: boolean;
  canEditAsset: boolean;
  favoriteBurst: boolean;
  favorited: boolean;
  isOwnAsset: boolean;
  likeBurst: boolean;
  liked: boolean;
  publicAssetUrl: string;
  reduceMotion: boolean | null;
  onCopyText: (label: string, value: string) => void | Promise<void>;
  onEditAsset: () => void;
  onFavoriteAnimationComplete: () => void;
  onImport: () => void;
  onLikeAnimationComplete: () => void;
  onOpenDelete: () => void;
  onOpenReport: () => void;
  onToggleFavorite: () => void;
  onToggleLike: () => void;
}) {
  return (
    <motion.header className="relative z-30 mt-5 border-b border-border pb-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.03)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="font-primary text-balance text-4xl font-semibold uppercase leading-none tracking-tight">{asset.title}</h1>
          {asset.shortDescription ? <p className="mt-3 line-clamp-1 max-w-2xl text-base text-foreground">{asset.shortDescription}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase text-muted-foreground">
            <EngagementStat icon={<Download className="h-4 w-4" />} label="download" value={asset.engagement?.downloadCount ?? 0} />
            <EngagementStat icon={<ThumbsUp className="h-4 w-4" />} label="Thanks" value={asset.engagement?.likeCount ?? 0} />
            <EngagementStat icon={<Eye className="h-4 w-4" />} label="view" value={asset.engagement?.viewCount ?? 0} />
            <EngagementStat icon={<MessageCircle className="h-4 w-4" />} label="comment" value={asset.engagement?.commentCount ?? 0} />
          </div>
        </div>
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <div className="flex flex-wrap items-start gap-2 md:justify-end">
            <Button type="button" onClick={onImport}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Import Asset
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" className={"workshop-control-free workshop-reaction-button group ml-3 inline-flex items-center gap-2 px-2 py-1 text-lg font-semibold hover:text-primary hover:drop-shadow-[0_0_8px_currentColor] " + (liked ? "text-primary drop-shadow-[0_0_8px_currentColor]" : "text-muted-foreground")} aria-label={liked ? "Remove Thanks" : "Send Thanks"} whileTap={reactionTap(reduceMotion)} animate={reactionBurst(likeBurst, reduceMotion)} transition={reactionTransition} onClick={onToggleLike} onAnimationComplete={onLikeAnimationComplete}>
                  <ThumbsUp className="workshop-reaction-icon h-7 w-7 fill-none transition-colors" aria-hidden="true" />
                  {formatCount(asset.engagement?.likeCount ?? 0)}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{liked ? "Remove Thanks" : "Send Thanks"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" className={"workshop-control-free workshop-reaction-button group inline-flex items-center px-2 py-1 hover:text-yellow-400 hover:drop-shadow-[0_0_8px_currentColor] " + (favorited ? "text-yellow-400 drop-shadow-[0_0_8px_currentColor]" : "text-muted-foreground")} aria-label={favorited ? "Unfavorite" : "Favorite"} whileTap={reactionTap(reduceMotion)} animate={reactionBurst(favoriteBurst, reduceMotion)} transition={reactionTransition} onClick={onToggleFavorite} onAnimationComplete={onFavoriteAnimationComplete}>
                  <Star className={"workshop-reaction-icon h-7 w-7 transition-colors " + (favorited ? "fill-current" : "fill-none group-hover:fill-current")} aria-hidden="true" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{favorited ? "Unfavorite" : "Favorite"}</TooltipContent>
            </Tooltip>
            <details className="group relative">
              <summary className="workshop-control-free flex h-10 min-h-10 cursor-pointer list-none items-center border border-border px-3 text-sm font-semibold uppercase text-muted-foreground hover:text-primary [&::-webkit-details-marker]:hidden" aria-label="More actions" title="More actions">
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-11 z-20 grid w-44 border border-border bg-popover p-1 text-popover-foreground shadow-md">
                <MenuAction icon={<Copy className="h-4 w-4" />} label="Copy ID" onClick={() => onCopyText("asset id", asset.publicId)} />
                <MenuAction icon={<LinkIcon className="h-4 w-4" />} label="Copy Link" onClick={() => onCopyText("asset link", publicAssetUrl)} />
                {canEditAsset ? <MenuAction icon={<Pencil className="h-4 w-4" />} label="Edit Asset" onClick={onEditAsset} /> : null}
                {!isOwnAsset ? <MenuAction icon={<Flag className="h-4 w-4" />} label="Report" onClick={onOpenReport} /> : null}
                {canDeleteAsset ? <MenuAction destructive icon={<Trash2 className="h-4 w-4" />} label="Delete Asset" onClick={onOpenDelete} /> : null}
              </div>
            </details>
          </div>
        </TooltipProvider>
      </div>
    </motion.header>
  );
}

function EngagementStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {formatCount(value)} {label === "Thanks" ? "Thanks" : value === 1 ? label : label + "s"}
    </span>
  );
}

function MenuAction({ icon, label, destructive = false, onClick }: { icon: ReactNode; label: string; destructive?: boolean; onClick: () => void | Promise<void> }) {
  return (
    <button type="button" role="menuitem" className={"workshop-control-free flex items-center gap-2 px-2 py-1.5 text-left text-sm font-semibold uppercase hover:bg-accent hover:text-accent-foreground " + (destructive ? "text-destructive" : "text-muted-foreground")} onClick={() => void onClick()}>
      {icon}
      {label}
    </button>
  );
}
