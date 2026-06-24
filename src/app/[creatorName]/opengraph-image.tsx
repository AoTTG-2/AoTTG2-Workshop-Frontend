import { ImageResponse } from "next/og";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import type { ProfilePresetCatalog } from "../../auth/types";
import { getPublicCreator } from "../../lib/api/workshop";
import { AUTH_API_BASE_URL } from "../../lib/config";
import { compactCount, creatorInitials } from "../../lib/seo";

export const alt = "AoTTG2 Workshop creator profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const AUTH_API_ORIGIN = AUTH_API_BASE_URL.replace(/\/v1$/i, "");
const WORKSHOP_BLUE = "#47c9f4";
const CARD = "#141719";
const BORDER = "#2b343a";
const MUTED = "#b8c1c7";

const fontPromise = Promise.all([
  fetch("https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3j-wc4A.ttf").then((response) => response.arrayBuffer()),
  fetch("https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3t-4c4A.ttf").then((response) => response.arrayBuffer()),
]).then(([black, bold]) => [
  { name: "Barlow", data: black, weight: 900 as const },
  { name: "Barlow", data: bold, weight: 700 as const },
]).catch(() => []);

interface ImageProps {
  params: Promise<{ creatorName: string }>;
}

export default async function CreatorOpenGraphImage({ params }: ImageProps) {
  const { creatorName } = await params;
  const creator = await loadCreator(creatorName);
  const displayName = creator?.profile?.displayName || creator?.displayName || creatorName;
  const handle = creator?.creatorName || creatorName;
  const avatarUrl = creator?.profile?.avatarKey ? await presetImage("avatars", creator.profile.avatarKey, 156, 156) : null;
  const bannerUrl = creator?.profile?.bannerKey ? await presetImage("banners", creator.profile.bannerKey, 1116, 244) : null;
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
          backgroundColor: "#090b0c",
          color: "#f5f5f0",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Barlow, Arial, sans-serif",
          height: "100%",
          padding: 42,
          width: "100%",
        }}
      >
        <div
          style={{
            border: `2px solid ${BORDER}`,
            boxShadow: `0 0 0 4px #0c0e0f, 0 0 0 7px ${WORKSHOP_BLUE}`,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            style={{
              backgroundColor: "#111",
              display: "flex",
              height: 244,
              position: "relative",
              width: "100%",
            }}
          >
            {bannerUrl ? (
              <img
                alt=""
                height="244"
                src={bannerUrl}
                style={{
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.52,
                  width: "100%",
                }}
                width="1116"
              />
            ) : (
              <div style={{ backgroundColor: "#111518", display: "flex", height: "100%", width: "100%" }} />
            )}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(5,6,7,0.25), rgba(5,6,7,0.98))",
                bottom: 0,
                display: "flex",
                height: 140,
                left: 0,
                position: "absolute",
                right: 0,
              }}
            />
            <div style={{ color: "#f5f5f0", display: "flex", fontSize: 31, fontWeight: 900, left: 34, position: "absolute", top: 27 }}>
              AoTTG<span style={{ color: WORKSHOP_BLUE, display: "flex", marginLeft: 7 }}>WORKSHOP</span>
            </div>
          </div>

          <div style={{ backgroundColor: CARD, display: "flex", flex: 1, flexDirection: "column", padding: "0 42px 38px" }}>
            <div style={{ alignItems: "flex-end", display: "flex", gap: 28, marginTop: -74 }}>
              <div
                style={{
                  alignItems: "center",
                  backgroundColor: "#20272b",
                  border: "7px solid #090b0c",
                  color: WORKSHOP_BLUE,
                  display: "flex",
                  fontSize: 76,
                  fontWeight: 900,
                  height: 156,
                  justifyContent: "center",
                  overflow: "hidden",
                  width: 156,
                }}
              >
                {avatarUrl ? <img alt="" height="156" src={avatarUrl} style={{ height: "100%", objectFit: "cover", width: "100%" }} width="156" /> : creator ? creatorInitials(creator) : handle.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, paddingBottom: 13 }}>
                <div style={{ color: WORKSHOP_BLUE, display: "flex", fontSize: 25, fontWeight: 900, textTransform: "uppercase" }}>
                  Creator Profile
                </div>
                <div style={{ display: "flex", fontSize: 72, fontWeight: 900, lineHeight: 0.96, maxWidth: 820, textTransform: "uppercase" }}>
                  {displayName}
                </div>
                <div style={{ color: MUTED, display: "flex", fontSize: 34, fontWeight: 700 }}>
                  /{handle}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 18, marginTop: 34 }}>
              {stats.length ? stats.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: "#0f1214",
                    border: `2px solid ${BORDER}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "19px 22px",
                    width: 250,
                  }}
                >
                  <div style={{ color: MUTED, display: "flex", fontSize: 21, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: "#ffffff", display: "flex", fontSize: 48, fontWeight: 900 }}>{compactCount(value)}</div>
                </div>
              )) : (
                <div style={{ color: MUTED, display: "flex", fontSize: 34, fontWeight: 700 }}>Creator profile</div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await fontPromise },
  );
}

async function presetImage(kind: "avatars" | "banners", key: string, width: number, height: number) {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/profile-presets`, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const presets = await response.json() as ProfilePresetCatalog;
    const preset = presets[kind].find((item) => item.key === key);
    if (!preset?.imageUrl) return null;
    const imageUrl = preset.imageUrl.startsWith("http") ? preset.imageUrl : `${AUTH_API_ORIGIN}${preset.imageUrl}`;
    const imageResponse = await fetch(imageUrl, { next: { revalidate: 3600 } });
    if (!imageResponse.ok) return null;
    const source = Buffer.from(await imageResponse.arrayBuffer());
    const png = await sharp(source).resize(width, height, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadCreator(creatorName: string) {
  try {
    return await getPublicCreator(creatorName);
  } catch {
    return null;
  }
}
