import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkshopMedia } from "@/lib/api/workshop";
import { motionAnimate, motionInitial, motionTransition } from "../motion";
import { GalleryImage, GalleryNavButton, GalleryThumb } from "./Gallery";

export function AssetDetailGallery({ activeIndex, activeMedia, galleryDirection, media, reduceMotion, title, onMove, onSelect }: { activeIndex: number; activeMedia?: WorkshopMedia; galleryDirection: number; media: WorkshopMedia[]; reduceMotion: boolean | null; title: string; onMove: (offset: number) => void; onSelect: (index: number) => void }) {
  return (
    <motion.section className="workshop-gallery-card border border-border bg-card/50 p-3" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.09)}>
      <GalleryImage media={activeMedia} title={title} direction={galleryDirection} reduceMotion={reduceMotion} />
      {media.length > 1 ? (
        <div className="workshop-gallery-rail mt-3">
          <GalleryNavButton label="Previous image" onClick={() => onMove(-1)}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </GalleryNavButton>
          <div className="workshop-gallery-thumbs">
            {media.map((item, index) => (
              <motion.div key={item.url + "-" + index} initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0.12 + Math.min(index, 8) * 0.02)}>
                <GalleryThumb item={item} title={title} active={index === activeIndex} onClick={() => onSelect(index)} />
              </motion.div>
            ))}
          </div>
          <GalleryNavButton label="Next image" onClick={() => onMove(1)}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </GalleryNavButton>
        </div>
      ) : null}
    </motion.section>
  );
}
