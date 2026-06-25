"use client";

import { AssetDetail as FeatureAssetDetail } from "@/features/asset-detail/AssetDetail";

type AssetDetailProps = NonNullable<Parameters<typeof FeatureAssetDetail>[0]>;

export function AssetDetail(props: AssetDetailProps = {}) {
  return <FeatureAssetDetail {...props} />;
}
