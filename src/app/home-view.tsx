"use client";

import { Button, Card, CardContent, Spinner } from "@aottg2/ui";
import { Download, FileCode2, Gamepad2, Map, Palette, Search, Sparkles, ThumbsUp, UploadCloud, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type ElementRef, useEffect, useRef, useState } from "react";
import { assetPath, type WorkshopAsset, type WorkshopMedia } from "../lib/api/workshop";
import { thumbnailDisplayUrls } from "../lib/media";

const heroSlides = [
  { src: "/hero/nemona-poster.webp", alt: "Nemona AoTTG2 skin by Divinityxrc" },
  { src: "/hero/psylocke-poster.webp", alt: "Psylocke AoTTG2 skin by Divinityxrc" },
  { src: "/hero/nemona-poster-2.webp", alt: "Nemona alternate AoTTG2 skin by Divinityxrc" },
  { src: "/hero/rebecca-poster.webp", alt: "Rebecca AoTTG2 skin by Divinityxrc" },
  { src: "/hero/jinx-poster.webp", alt: "Jinx AoTTG2 skin by Divinityxrc" },
  { src: "/hero/serana-preview.webp", alt: "Serana AoTTG2 skin by Divinityxrc" },
  { src: "/hero/power-poster.webp", alt: "Power AoTTG2 skin by Divinityxrc" },
];

const categoryLinks = [
  { href: "/library?category=human", label: "Skins", icon: Palette },
  { href: "/library?type=map", label: "Maps", icon: Map },
  { href: "/library?type=custom_logic", label: "Custom Logic", icon: FileCode2 },
  { href: "/library?type=skin_set", label: "Skin Sets", icon: Sparkles },
];

const playerCards = [
  { title: "Find Content Fast", text: "Search skins, maps, and custom logic without digging through Discord pins.", icon: Search },
  { title: "Game Client Integration", text: "Prepared for AoTTG 2 Game Client one-click import from Workshop when the client hook lands.", icon: Gamepad2 },
  { title: "Use Community Work", text: "Preview assets, check details, and keep your next run easy to set up.", icon: Download },
];

const creatorCards = [
  { title: "Publish Assets", text: "Give skins, maps, and logic a stable Workshop page.", icon: UploadCloud },
  { title: "Build A Library", text: "Keep creator uploads discoverable under one profile.", icon: Users },
  { title: "Reach Players", text: "Show up in trending, popular, search, and category browsing.", icon: Sparkles },
];

const rotatingWords = ["Skins", "Maps", "Custom Logic", "Skin Sets"];

export function HomeView({ trending, popular }: { trending: WorkshopAsset[]; popular: WorkshopAsset[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden">
      <section className="relative isolate min-h-[620px] overflow-hidden border-b border-border px-4 py-14 sm:px-6 lg:min-h-[720px] lg:py-20">
        <HeroSlideshow />
        <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-7xl items-end">
          <motion.div className="max-w-5xl pb-10" initial={motionInitial(reduceMotion, 18)} animate={motionAnimate} transition={{ duration: 0.36, ease: "easeOut" }}>
            <h1 className="landing-hero-title font-primary uppercase leading-none tracking-tight">
              <span className="landing-hero-kicker">Workshop for</span>
              <img className="landing-hero-logo" src="/brand/logo-aottg2.webp" alt="AoTTG 2" />
              <RotatingWords reduceMotion={reduceMotion} />
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/82 sm:text-lg">
              Discover and publish AoTTG2 skins, skin sets, maps, and custom logic from community creators.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/discover"><Search className="h-4 w-4" aria-hidden="true" />Discover</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/library/publish"><UploadCloud className="h-4 w-4" aria-hidden="true" />Publish</Link>
              </Button>
            </div>
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Workshop categories">
              {categoryLinks.map((item) => (
                <Link key={item.href} className="inline-flex h-9 items-center gap-2 border border-foreground/12 bg-background/55 px-3 font-primary text-xs font-semibold uppercase text-foreground/88 backdrop-blur hover:border-primary/60 hover:text-primary" href={item.href}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="mt-7 text-xs font-semibold uppercase tracking-wide text-foreground/60">Featured skin art by Divinityxrc</p>
          </motion.div>
        </div>
      </section>

      <section className="landing-marquee-shell">
        <AssetMarquee title="Trending" assets={trending} align="left" />
        <AssetMarquee title="Popular" assets={popular} align="right" reverse />
      </section>

      <section className="landing-feature-shell">
        <FeatureShowcase eyebrow="For Players" title="Find it, import it, play it." text="A cleaner path from community discovery to the AoTTG 2 Game Client. The Workshop can already present the flow; the one-click import hook lands when the client integration is ready." cards={playerCards} reduceMotion={reduceMotion} />
        <FeatureShowcase eyebrow="For Creators" title="Publish once, share everywhere." text="A public home for skins, maps, and custom logic with creator identity, category discovery, and enough stats to see what players are using." cards={creatorCards} reduceMotion={reduceMotion} reverse />
      </section>
    </main>
  );
}

function HeroSlideshow() {
  return (
    <div className="landing-hero-slideshow" aria-hidden="true">
      <div className="landing-hero-track">
        {[...heroSlides, ...heroSlides].map((slide, index) => (
          <img key={`${slide.src}-${index}`} src={slide.src} alt={slide.alt} />
        ))}
      </div>
      <div className="landing-hero-dim" />
    </div>
  );
}

function RotatingWords({ reduceMotion }: { reduceMotion: boolean | null }) {
  const [index, setIndex] = useState(0);
  const word = rotatingWords[index];

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % rotatingWords.length), 3200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  if (reduceMotion) {
    return <span className="landing-word-static aottg2-textured-text aottg2-emboss-text" data-text={rotatingWords[0]}>{rotatingWords[0]}</span>;
  }

  return (
    <span className="landing-word-stage" aria-live="polite" aria-label={word}>
      <AnimatePresence initial={false}>
        <motion.span
          key={word}
          className="landing-word-current"
          aria-hidden="true"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.035 } },
            exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.08, ease: "easeIn" } },
          }}
        >
          {[...word].map((letter, letterIndex) => (
            <motion.span
              key={`${word}-${letterIndex}`}
              className="landing-word-letter aottg2-textured-text aottg2-emboss-text"
              data-text={letter === " " ? "\u00a0" : letter}
              variants={{
                hidden: { opacity: 0, y: 18, scale: 0.72 },
                show: {
                  opacity: 1,
                  y: [18, -5, 0],
                  scale: [0.72, 1.12, 1],
                  transition: { duration: 0.42, ease: "easeOut" },
                },
              }}
            >
              {letter === " " ? "\u00a0" : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function AssetMarquee({ title, assets, align, reverse = false }: { title: string; assets: WorkshopAsset[]; align: "left" | "right"; reverse?: boolean }) {
  return (
    <section className={`landing-marquee landing-marquee-${align}`}>
      <div className="landing-marquee-heading">
        <h2 className="font-primary text-2xl font-semibold uppercase leading-none">{title}</h2>
        <Button asChild variant="link" className="h-auto p-0">
          <Link href={`/library?sort=${title.toLowerCase()}`}>View all</Link>
        </Button>
      </div>
      {assets.length ? (
        <div className="landing-asset-marquee">
          <div className={`landing-asset-track ${reverse ? "landing-asset-track-reverse" : ""}`}>
            {[...assets, ...assets].map((asset, index) => <AssetCard key={`${asset.id}-${index}`} asset={asset} />)}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">Workshop assets will appear here when the API is available.</CardContent>
        </Card>
      )}
    </section>
  );
}

function AssetCard({ asset }: { asset: WorkshopAsset }) {
  const thumbnail = selectPreview(asset.media);
  const href = assetPath(asset);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const imageRef = useRef<ElementRef<"img"> | null>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setSourceIndex(0);
  }, [thumbnail?.url]);

  const sources = thumbnail ? thumbnailDisplayUrls(thumbnail.url, { width: 360, height: 203, fit: "cover" }) : [];
  const source = sources[sourceIndex];

  useEffect(() => {
    setLoaded(false);
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, [source]);

  return (
    <Link className="landing-asset-card block" href={href}>
      <Card className="workshop-hover-card h-full overflow-hidden bg-card/70">
        {thumbnail && !failed ? (
          <div className="relative aspect-video overflow-hidden bg-muted/50">
            {!loaded ? <ThumbnailLoading /> : null}
            <img
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`}
              src={source}
              alt={thumbnail.description || asset.title}
              loading="eager"
              ref={(image) => {
                imageRef.current = image;
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
          </div>
        ) : (
          <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>
        )}
        <CardContent className="grid gap-2 p-3">
          <span className="workshop-card-title line-clamp-1 font-primary text-sm font-semibold uppercase text-foreground">{asset.title}</span>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{asset.shortDescription || `${asset.title} by ${asset.authorDisplayName}`}</p>
          <div className="flex gap-3 text-xs font-semibold uppercase text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" aria-hidden="true" />{formatCount(asset.engagement?.downloadCount ?? 0)}</span>
            <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />{formatCount(asset.engagement?.likeCount ?? 0)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
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

function FeatureShowcase({ eyebrow, title, text, cards, reduceMotion, reverse = false }: { eyebrow: string; title: string; text: string; cards: typeof playerCards; reduceMotion: boolean | null; reverse?: boolean }) {
  return (
    <motion.section className="landing-feature-showcase" initial={motionInitial(reduceMotion, 18)} whileInView={motionAnimate} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.3, ease: "easeOut" }}>
      <Card className="landing-feature-card">
        <CardContent className={`landing-feature-content ${reverse ? "landing-feature-content-reverse" : ""}`}>
          <div className="landing-feature-copy">
            <p className="font-primary text-sm uppercase text-primary">{eyebrow}</p>
            <h2 className="mt-3 font-primary text-4xl font-semibold uppercase leading-none sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{text}</p>
          </div>
          <div className="landing-feature-panel">
            {cards.map((card, index) => (
              <motion.div key={card.title} className="landing-feature-item" initial={motionInitial(reduceMotion, 10)} whileInView={motionAnimate} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.22, ease: "easeOut", delay: reduceMotion ? 0 : index * 0.04 }}>
                <card.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-primary text-base font-semibold uppercase">{card.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function selectPreview(media: WorkshopMedia[]) {
  return media.find((item) => item.kind === "thumbnail") ?? media.find((item) => item.kind === "gallery") ?? media[0];
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

const motionAnimate = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };

function motionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y, scale: 0.985, filter: "blur(6px)" };
}
