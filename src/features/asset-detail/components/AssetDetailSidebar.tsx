import { Button } from "@aottg2/ui";
import { motion } from "motion/react";
import { AssetTag, AssetTagLink } from "@/components/AssetTag";
import { CreatorIdentityLink } from "@/components/CreatorIdentityLink";
import { SideCard } from "@/components/SideCard";
import type { WorkshopAsset } from "@/lib/api/workshop";
import { assetTypeLabel } from "@/lib/workshop/taxonomy";
import { formatDate } from "../format";
import { motionAnimate, motionInitial, motionTransition } from "../motion";
import { AssetSummary, SummaryRow, UsedBySetsCard } from "./AssetSummary";

export function AssetDetailSidebar({ asset, category, reduceMotion, summary, textureUrls, usedByAssets, onCopyText }: { asset: WorkshopAsset; category: string; reduceMotion: boolean | null; summary: string; textureUrls: string[]; usedByAssets: WorkshopAsset[]; onCopyText: (label: string, value: string) => void | Promise<void> }) {
  return (
    <motion.aside className="grid content-start gap-4" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(0.08)}>
      <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.11)}>
        <SideCard title="Tags" variant="secondary">
        <div className="flex flex-wrap gap-2">
          <AssetTag variant="category" size="md">
            {assetTypeLabel(category)}
          </AssetTag>
          {asset.tags.length > 0 ? (
            asset.tags.map((tag, index) => (
              <AssetTagLink key={tag + "-" + index} size="md" href={"/library?tag=" + encodeURIComponent(tag)}>
                {tag}
              </AssetTagLink>
            ))
          ) : (
            <AssetTag variant="empty" size="md">
              No tags
            </AssetTag>
          )}
        </div>
        </SideCard>
      </motion.div>

      <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.14)}>
        <SideCard title="Created By" variant="secondary">
          <CreatorIdentityLink
            displayName={asset.authorDisplayName}
            creatorName={asset.authorCreatorName ?? asset.creatorName}
            avatarKey={asset.authorAvatarKey}
          />
        </SideCard>
      </motion.div>

      <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.17)}>
        <SideCard title="Details" variant="secondary">
          <dl className="grid gap-2 text-sm">
            <SummaryRow label="Type" value={assetTypeLabel(asset.type)} />
            <SummaryRow label="Category" value={assetTypeLabel(category)} />
            <SummaryRow label="Summary" value={summary} />
            <SummaryRow label="Published" value={formatDate(asset.createdAt)} />
            <SummaryRow label="Updated" value={formatDate(asset.updatedAt)} />
          </dl>
        </SideCard>
      </motion.div>

      {usedByAssets.length > 0 ? (
        <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.19)}>
          <UsedBySetsCard assets={usedByAssets} />
        </motion.div>
      ) : null}

      <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.2)}>
        <SideCard title="Payload" variant="secondary">
          <AssetSummary asset={asset} />
          {textureUrls.length > 0 ? (
            <Button className="mt-3 w-full" type="button" variant="ghost" onClick={() => void onCopyText("texture URLs", textureUrls.join("\n"))}>
              Copy Texture URLs
            </Button>
          ) : null}
        </SideCard>
      </motion.div>
    </motion.aside>
  );
}
