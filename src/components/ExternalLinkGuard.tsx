"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@aottg2/ui";
import { useEffect, useMemo, useState } from "react";

function isAllowedInternalUrl(url: URL) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.hostname === "aottg2.com" || url.hostname.endsWith(".aottg2.com");
}

export function ExternalLinkGuard() {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pendingUrl = useMemo(() => {
    if (!pendingHref) return null;
    try {
      return new URL(pendingHref);
    } catch {
      return null;
    }
  }, [pendingHref]);

  useEffect(() => {
    function onClick(event: unknown) {
      const mouseEvent = event as { button?: number; defaultPrevented?: boolean; preventDefault: () => void; stopPropagation: () => void; target: unknown };
      if (mouseEvent.defaultPrevented || mouseEvent.button !== 0) return;
      const anchor = (mouseEvent.target as { closest?: (selector: string) => { href?: string } | null } | null)?.closest?.("a[href]");
      if (!anchor?.href) return;
      if (anchor.href.startsWith("mailto:") || anchor.href.startsWith("tel:")) return;

      const url = new URL(anchor.href);
      if (!["http:", "https:"].includes(url.protocol) || isAllowedInternalUrl(url)) return;

      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      setPendingHref(anchor.href);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  function openPending() {
    if (!pendingHref) return;
    window.open(pendingHref, "_blank", "noopener,noreferrer");
    setPendingHref(null);
  }

  return (
    <Dialog open={Boolean(pendingHref)} onOpenChange={(open) => { if (!open) setPendingHref(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>External Link</DialogTitle>
          <DialogDescription>You are leaving AoTTG2. Open this link?</DialogDescription>
        </DialogHeader>
        {pendingUrl ? <p className="break-all text-sm text-muted-foreground">{pendingUrl.hostname}</p> : null}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setPendingHref(null)}>Cancel</Button>
          <Button type="button" onClick={openPending}>Open Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
