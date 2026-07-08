export interface WorkshopUser {
  authAccountId: string;
  displayName: string;
  creatorName: string | null;
  photonUserId?: string | null;
  roles: string[];
  permissions?: string[];
  lastSeenAt: string;
}

export interface PublicProfile {
  accountId: string;
  displayName: string;
  description?: string | null;
  avatarKey?: string | null;
  bannerKey?: string | null;
  socials: Record<string, string>;
  createdAt: string;
}

export type WorkshopAssetType =
  | "skin_part"
  | "skin_set"
  | "titan_skin_set"
  | "shifter_skin_set"
  | "skybox_skin_set"
  | "full_preset"
  | "map"
  | "custom_logic"
  | "addon";

export interface WorkshopMedia {
  kind: "thumbnail" | "gallery" | string;
  url: string;
  description?: string | null;
}

export interface SkinPartPayload {
  category?: string;
  slot?: string;
  textureUrl?: string;
  textureUrls?: PairedTextureUrls | null;
  variantScope?: "all" | "specific" | string;
  variants?: string[];
  boots?: boolean | null;
  mirror?: boolean | null;
  hookTilings?: HookTilings | null;
}

export interface SkinSetItem {
  slot?: string;
  skinAssetId?: string | null;
  textureUrl?: string | null;
  textureUrls?: PairedTextureUrls | null;
  variantScope?: "all" | "specific" | string | null;
  variants?: string[] | null;
  boots?: boolean | null;
  mirror?: boolean | null;
  hookTilings?: HookTilings | null;
}

export interface PairedTextureUrls {
  left?: string | null;
  right?: string | null;
}

export interface HookTilings {
  left?: number | null;
  right?: number | null;
}

export interface SkinSetPayload {
  category?: string;
  items?: SkinSetItem[];
}

export interface ShifterSkinSetPayload {
  category?: "shifter" | string;
  target?: "eren" | "annie" | "colossal" | string;
  textureUrl?: string | null;
}

export interface SkyboxSkinSetPayload {
  category?: "skybox" | string;
  front?: string | null;
  back?: string | null;
  left?: string | null;
  right?: string | null;
  up?: string | null;
  down?: string | null;
}

export interface CustomLogicFile {
  filename?: string;
  uploadId?: string;
  key?: string;
  objectKey?: string;
  sizeBytes?: number;
  contentType?: string | null;
}

export interface CustomLogicPayload {
  file?: UploadedFileReference | null;
  files?: CustomLogicFile[];
}

export interface MapPayload {
  file?: UploadedFileReference | null;
  screenshots?: string[];
}

export interface AddonFile {
  filename?: string;
  contentType?: string | null;
  uploadId?: string;
  key?: string;
  objectKey?: string;
  sizeBytes?: number;
}

export interface UploadedFileReference {
  uploadId?: string;
  key?: string;
  objectKey?: string;
  filename?: string;
  sizeBytes?: number;
  contentType?: string | null;
}

export interface AddonPayload {
  file?: UploadedFileReference | null;
  files?: AddonFile[];
}

export interface WorkshopAsset {
  id: string;
  publicId: string;
  creatorName: string;
  assetSlug: string;
  status: "visible" | "hidden" | "deleted" | string;
  type: WorkshopAssetType | string;
  title: string;
  descriptionMarkdown?: string | null;
  shortDescription?: string | null;
  media: WorkshopMedia[];
  payload: SkinPartPayload | SkinSetPayload | ShifterSkinSetPayload | SkyboxSkinSetPayload | CustomLogicPayload | MapPayload | AddonPayload | Record<string, unknown>;
  tags: string[];
  ownerAuthAccountId: string;
  authorDisplayName: string;
  authorCreatorName?: string | null;
  authorAvatarKey?: string | null;
  createdAt: string;
  updatedAt: string;
  engagement?: AssetEngagement;
  viewerEngagement?: ViewerEngagement | null;
  officialUseContactAllowed?: boolean;
}

export interface AssetEngagement {
  likeCount: number;
  favoriteCount: number;
  viewCount: number;
  downloadCount: number;
  commentCount: number;
}

export interface ViewerEngagement {
  liked: boolean;
  favorited: boolean;
}

export interface EngagementWriteResponse {
  engagement: AssetEngagement;
  viewerEngagement?: ViewerEngagement | null;
  counted: boolean;
}

export interface AssetListQuery {
  q?: string;
  type?: string;
  tag?: string;
  category?: string;
  slot?: string;
  target?: string;
  sort?: string;
  mine?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AssetListResponse {
  total: number;
  page: number;
  pageSize: number;
  assets: WorkshopAsset[];
}

export interface TagSuggestion {
  tag: string;
  count: number;
}

export interface TagSuggestionResponse {
  tags: TagSuggestion[];
}

export interface CreatorStats {
  assetCount: number;
  skinPartCount: number;
  skinSetCount: number;
  downloadCount: number;
  likeCount: number;
  viewCount: number;
  commentCount: number;
}

export interface PublicCreator {
  creatorName: string;
  authAccountId: string;
  displayName: string;
  profile?: PublicProfile | null;
  stats: CreatorStats;
  followerCount: number;
  viewerFollowing: boolean;
  featuredAssets: WorkshopAsset[];
  latestAssets: WorkshopAsset[];
}

export interface CreatorSummary {
  creatorName: string;
  authAccountId: string;
  displayName: string;
  profile?: PublicProfile | null;
  stats: CreatorStats;
  followerCount: number;
  viewerFollowing: boolean;
}

export interface CreatorListQuery {
  q?: string;
  tab?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatorListResponse {
  total: number;
  page: number;
  pageSize: number;
  creators: CreatorSummary[];
}

export interface CreatorFollowResponse {
  following: boolean;
  followerCount: number;
}

export interface DashboardComment {
  id: string;
  assetId: string;
  assetPublicId: string;
  assetTitle: string;
  creatorName: string;
  assetSlug: string;
  parentCommentId?: string | null;
  body: string;
  status: "visible" | "deleted" | "hidden" | string;
  authorAuthAccountId: string;
  authorDisplayName: string;
  authorCreatorName?: string | null;
  authorAvatarKey?: string | null;
  createdAt: string;
}

export interface DashboardCommentListResponse {
  total: number;
  page: number;
  pageSize: number;
  comments: DashboardComment[];
}

export interface WorkshopNotification {
  id: string;
  type: string;
  actorAuthAccountId?: string | null;
  assetId?: string | null;
  assetPublicId?: string | null;
  assetTitle?: string | null;
  creatorName?: string | null;
  assetSlug?: string | null;
  commentId?: string | null;
  metadataJson: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  total: number;
  unread: number;
  page: number;
  pageSize: number;
  notifications: WorkshopNotification[];
}

export interface DashboardResponse {
  stats: CreatorStats;
  unreadNotificationCount: number;
  recentAssets: WorkshopAsset[];
  recentComments: DashboardComment[];
  recentNotifications: WorkshopNotification[];
}

export interface WorkshopVariantOption {
  id: string;
  label: string;
  previewUrl?: string | null;
}

export interface VariantCatalog {
  hairMale: string[];
  hairFemale: string[];
  costumeMale: string[];
  costumeFemale: string[];
  hat: string[];
  head: string[];
  back: string[];
  humanSkinParts: string[];
  humanCompatibilitySlots?: string[];
  humanCompatibilityVariants?: Record<string, WorkshopVariantOption[]>;
  textureUrlAllowlist?: string[];
  textureFileExtensions?: string[];
}
