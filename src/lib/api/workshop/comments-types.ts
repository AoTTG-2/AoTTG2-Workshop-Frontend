export interface WorkshopComment {
  id: string;
  assetId: string;
  parentCommentId: string | null;
  body: string;
  status: "visible" | "deleted" | "hidden";
  authorAuthAccountId: string;
  authorDisplayName: string;
  authorCreatorName?: string | null;
  authorAvatarKey?: string | null;
  createdAt: string;
  updatedAt: string;
  replies: WorkshopComment[];
}

export interface CommentListResponse {
  total: number;
  page: number;
  pageSize: number;
  comments: WorkshopComment[];
}

export interface CommentReportResponse {
  id: string;
  commentId: string;
  reporterAuthAccountId: string;
  reason: string;
  createdAt: string;
  resolvedAt?: string | null;
}
