import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@aottg2/ui";
import { useMutation } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { getAccessToken } from "@/auth/storage";
import { restoreModerationAsset, type WorkshopAsset } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import { ConfirmDialog, DetailRow, EmptyPanel, ListTitle, LoadingPanel, listItemClass } from "./Common";
import { formatDate, normalizeSlug } from "../utils";

export function AssetList({ assets, selectedId, loading, error, onSelect }: { assets: WorkshopAsset[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Assets unavailable" text="Could not load moderated assets." />;
  if (!assets.length) return <EmptyPanel title="No assets" text="Nothing matches this queue." />;
  return (
    <div className="grid content-start gap-3">
      {assets.map((asset) => (
        <button key={asset.id} type="button" className={listItemClass(selectedId === asset.id)} onClick={() => onSelect(asset.id)}>
          <ListTitle title={asset.title} badge={asset.status} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>/{asset.creatorName}/{asset.assetSlug}</span>
            <span>{formatDate(asset.updatedAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ModerationAssetDetail({ asset, deleted, onDone }: { asset: WorkshopAsset | null; deleted: boolean; onDone: () => void }) {
  const token = getAccessToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slugOpen, setSlugOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const restore = useMutation({
    mutationFn: (assetSlug?: string | null) => restoreModerationAsset(asset!.publicId || asset!.id, token!, assetSlug),
    onSuccess: () => {
      toast.success("Asset restored", { description: "The asset is public again." });
      setConfirmOpen(false);
      setSlugOpen(false);
      setSlug("");
      onDone();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Try again.";
      if (message.includes("assetSlug")) {
        setSlug(asset ? `${asset.assetSlug}-restored` : "");
        setSlugOpen(true);
        return;
      }
      toast.error("Restore failed", { description: message });
    },
  });
  const normalizedSlug = normalizeSlug(slug);

  if (!asset) return <EmptyPanel title="Select an asset" text="Choose an asset from the queue." />;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{asset.title}</CardTitle>
          <Badge variant="outline">{asset.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <DetailRow label="Link" value={`/${asset.creatorName}/${asset.assetSlug}`} />
        <DetailRow label="Owner" value={asset.ownerAuthAccountId} />
        <DetailRow label="Updated" value={formatDate(asset.updatedAt)} />
        <DetailRow label="Summary" value={asset.shortDescription || asset.descriptionMarkdown || "None"} />
        {!deleted && asset.status === "hidden" ? <Button size="sm" disabled={restore.isPending} onClick={() => setConfirmOpen(true)}><RotateCcw className="h-4 w-4" />RESTORE</Button> : null}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        title="Restore Asset?"
        description="This will make the asset public again. Continue only if moderation is complete."
        confirmLabel="RESTORE"
        busy={restore.isPending}
        onOpenChange={setConfirmOpen}
        onConfirm={() => restore.mutate(null)}
      />
      <Dialog open={slugOpen} onOpenChange={setSlugOpen}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogTitle>Restore With New Link</DialogTitle>
            <DialogDescription>This asset&apos;s old link is already used. Enter a new slug to restore it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="restore-asset-slug">New slug</Label>
            <Input id="restore-asset-slug" className="h-10 text-sm" value={slug} onChange={(event) => setSlug(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSlugOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!normalizedSlug || restore.isPending} onClick={() => restore.mutate(normalizedSlug)}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
