import { ImageResponse } from "next/og";
import { getPublicCreator } from "../../lib/api/workshop";
import { compactCount, creatorInitials } from "../../lib/seo";

export const alt = "AoTTG2 Workshop creator profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ creatorName: string }>;
}

export default async function CreatorOpenGraphImage({ params }: ImageProps) {
  const { creatorName } = await params;
  const creator = await loadCreator(creatorName);
  const displayName = creator?.profile?.displayName || creator?.displayName || creatorName;
  const handle = creator?.creatorName || creatorName;
  const stats: Array<[string, number]> = creator
    ? [
        ["Assets", creator.stats.assetCount],
        ["Downloads", creator.stats.downloadCount],
        ["Thanks", creator.stats.likeCount],
        ["Followers", creator.followerCount ?? 0],
      ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#101214",
          color: "#f7f1df",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 34 }}>
          <div
            style={{
              alignItems: "center",
              background: "#e7b85a",
              color: "#161616",
              display: "flex",
              fontSize: 78,
              fontWeight: 800,
              height: 172,
              justifyContent: "center",
              width: 172,
            }}
          >
            {creator ? creatorInitials(creator) : handle.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <div style={{ color: "#e7b85a", fontSize: 30, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              AoTTG2 Workshop
            </div>
            <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.03, maxWidth: 780 }}>
              {displayName}
            </div>
            <div style={{ color: "#b8c1c7", fontSize: 34 }}>
              /{handle}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          {stats.length ? stats.map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "#1b2024",
                border: "2px solid #2f363c",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "24px 28px",
                width: 250,
              }}
            >
              <div style={{ color: "#b8c1c7", fontSize: 23, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: "#ffffff", fontSize: 48, fontWeight: 900 }}>{compactCount(value)}</div>
            </div>
          )) : (
            <div style={{ color: "#b8c1c7", fontSize: 34 }}>Creator profile</div>
          )}
        </div>
      </div>
    ),
    size,
  );
}

async function loadCreator(creatorName: string) {
  try {
    return await getPublicCreator(creatorName);
  } catch {
    return null;
  }
}
