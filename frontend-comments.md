# Workshop Comments Frontend Integration

Base backend path: `/v1/workshop`

## Public Read

```ts
GET /v1/workshop/assets/:assetId/comments?page=1&pageSize=24
```

Response:

```ts
type CommentListResponse = {
  total: number;
  page: number;
  pageSize: number;
  comments: CommentResponse[];
};

type CommentResponse = {
  id: string;
  assetId: string;
  parentCommentId: string | null;
  body: string;
  status: "visible" | "deleted" | "hidden";
  authorAuthAccountId: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  replies: CommentResponse[];
};
```

Render rules:

- Show top-level comments in API order.
- Show `replies` under each top-level comment in API order.
- `status: "deleted"` means render a muted `[deleted]` placeholder.
- Deleted parents can still have visible replies. Do not hide the whole thread.
- `hidden` comments should not appear in public reads; if one appears in a moderator view, hide the body from normal users.

## Auth Writes

All write calls need:

```ts
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
}
```

Create top-level comment:

```ts
POST /v1/workshop/assets/:assetId/comments
body: { "body": "Nice skin." }
```

Reply to top-level comment:

```ts
POST /v1/workshop/assets/:assetId/comments/:commentId/replies
body: { "body": "Agreed." }
```

Delete own comment:

```ts
DELETE /v1/workshop/comments/:commentId
```

Report comment:

```ts
POST /v1/workshop/comments/:commentId/reports
body: { "reason": "spam" }
```

## UI Handling

- Body max is `1000` characters. Enforce client-side too.
- Empty or whitespace-only body is invalid.
- Replies are one level only. Do not show a reply box under replies.
- Anonymous users can read comments but cannot comment, reply, delete, or report.
- Treat `401` as login required.
- Treat `429` as anti-spam/rate-limit. Show a short cooldown message.
- Treat `400` on reply as invalid nesting or invalid body.
- Treat `404` on delete/report as unavailable or not allowed.

## Asset Detail Counts

Asset responses include:

```ts
engagement: {
  likeCount: number;
  favoriteCount: number;
  viewCount: number;
  downloadCount: number;
  commentCount: number;
}
```

`commentCount` counts visible comments/replies only. Deleted parent placeholders do not count, but visible replies under them do.

## Moderator Endpoints

Use only for moderator/admin UI.

```ts
GET /v1/workshop/moderation/comments?status=reported
GET /v1/workshop/moderation/comments?status=hidden
PUT /v1/workshop/moderation/comments/:commentId/hide
PUT /v1/workshop/moderation/comments/:commentId/restore
PUT /v1/workshop/moderation/comment-reports/:reportId/resolve
```

Non-moderators receive `404` for moderation endpoints.
