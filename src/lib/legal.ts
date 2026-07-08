export const LEGAL_PAGES = [
  {
    slug: "disclaimer",
    title: "Disclaimer",
    summary: "Unofficial project notice, user-submitted content role, and no-warranty limits.",
  },
  {
    slug: "content-rules",
    title: "Content Rules",
    summary: "Rules for listings, external URLs, hosted files, descriptions, tags, and submissions.",
  },
  {
    slug: "external-content",
    title: "External Content Notice",
    summary: "How external hosts, preview providers, and URL-backed content work.",
  },
  {
    slug: "community",
    title: "Community Guidelines",
    summary: "Expected behavior for creators, commenters, reporters, and moderators.",
  },
  {
    slug: "asset-usage",
    title: "Asset Usage Guide",
    summary: "Plain-language guide for uploader permissions and user usage limits.",
  },
  {
    slug: "report-ip",
    title: "IP Report Page",
    summary: "How to report copyright, trademark, privacy, or other rights concerns.",
  },
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number]["slug"];

export const LEGAL_FOOTER_LINKS = LEGAL_PAGES.map((page) => ({
  label: page.title,
  href: legalHref(page.slug),
}));

export function legalHref(slug: LegalSlug) {
  return `/legal/${slug}`;
}

export function legalPageForSlug(slug: string) {
  return LEGAL_PAGES.find((page) => page.slug === slug);
}
