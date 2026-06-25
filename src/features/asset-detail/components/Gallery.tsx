import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Spinner } from "@aottg2/ui";
import { thumbnailDisplayUrls } from "@/lib/media";
import type { WorkshopMedia } from "@/lib/api/workshop";

export function GalleryImage({ media, title, direction, reduceMotion }: { media?: WorkshopMedia; title: string; direction: number; reduceMotion: boolean | null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setSourceIndex(0);
  }, [media?.url]);

  if (!media) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  if (failed) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  const sources = thumbnailDisplayUrls(media.url, { width: 960, height: 540, fit: "inside" });

  return (
    <div className="workshop-gallery-image relative aspect-video overflow-hidden bg-muted/50">
      {!loaded ? <ThumbnailLoading /> : null}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.img
          key={`${media.url}-${sourceIndex}`}
          className="absolute inset-0 h-full w-full object-contain"
          src={sources[sourceIndex]}
          alt={media.description || title}
          custom={direction}
          initial={reduceMotion ? false : { opacity: 0, x: direction * 24, scale: 0.985 }}
          animate={{ opacity: loaded ? 1 : 0, x: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -20, scale: 0.99 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          ref={(image) => {
            if (image?.complete && image.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setLoaded(false);
              setSourceIndex((index) => index + 1);
              return;
            }
            setFailed(true);
          }}
        />
      </AnimatePresence>
    </div>
  );
}

export function GalleryThumb({ item, title, active, onClick }: { item: WorkshopMedia; title: string; active: boolean; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setSourceIndex(0);
  }, [item.url]);

  const sources = thumbnailDisplayUrls(item.url, { width: 180, height: 101, fit: "cover" });

  return (
    <button type="button" className={`workshop-control-free workshop-gallery-thumb relative aspect-video overflow-hidden bg-muted/50 ${active ? "is-active" : ""}`} aria-current={active ? "true" : undefined} onClick={onClick}>
      {!loaded ? <div className="absolute inset-0 grid place-items-center bg-muted/50"><Spinner size="sm" variant="primary" label="Loading thumbnail" /></div> : null}
      <img
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`}
        src={sources[sourceIndex]}
        alt={item.description || title}
        loading="lazy"
        ref={(image) => {
          if (image?.complete && image.naturalWidth > 0 && !loaded) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (sourceIndex < sources.length - 1) {
            setLoaded(false);
            setSourceIndex((index) => index + 1);
            return;
          }
          setLoaded(true);
        }}
      />
    </button>
  );
}

export function GalleryNavButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" className="workshop-control-free workshop-gallery-nav" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function ThumbnailLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-muted/50">
      <div className="flex animate-pulse items-center gap-2 font-primary text-xs font-semibold uppercase text-muted-foreground">
        <Spinner size="sm" variant="primary" label="Loading thumbnail" />
      </div>
    </div>
  );
}
