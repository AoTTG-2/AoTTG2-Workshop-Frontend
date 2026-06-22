import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "../lib/seo";
import "@aottg2/ui/styles.css";
import "../index.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AoTTG2 Workshop",
  description: "Browse and import AoTTG2 skins, skin sets, maps, and custom logic shared by the community.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "AoTTG2 Workshop",
    description: "Browse and import AoTTG2 skins, skin sets, maps, and custom logic shared by the community.",
    url: SITE_URL,
    siteName: "AoTTG2 Workshop",
    images: ["/og/workshop.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AoTTG2 Workshop",
    description: "Browse and import AoTTG2 skins, skin sets, maps, and custom logic shared by the community.",
    images: ["/og/workshop.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
