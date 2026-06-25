import type { ReactNode } from "react";
import { authAssetUrl } from "@/auth/api";
import type { ProfilePreset } from "@/auth/types";
import { CreatorMention } from "@/components/CreatorIdentityLink";
import type { WorkshopComment } from "@/lib/api/workshop";

interface MentionAuthor {
  displayName: string;
  creatorName?: string | null;
}

export function hasAvatarKey(comment: WorkshopComment): boolean {
  return Boolean(comment.authorAvatarKey) || comment.replies.some(hasAvatarKey);
}

export function collectMentionAuthors(comments: WorkshopComment[]) {
  const authors = new Map<string, MentionAuthor>();
  function visit(comment: WorkshopComment) {
    if (comment.status === "visible" && comment.authorDisplayName && comment.authorDisplayName !== "[deleted]") {
      const key = comment.authorDisplayName.toLowerCase();
      if (!authors.has(key)) authors.set(key, { displayName: comment.authorDisplayName, creatorName: comment.authorCreatorName });
    }
    comment.replies.forEach(visit);
  }
  comments.forEach(visit);
  return [...authors.values()];
}

export function renderCommentMarkdownWithMentions(value: string, mentions: MentionAuthor[]) {
  if (!value.trim()) return <span className="text-muted-foreground">Nothing to preview.</span>;
  return value.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
    <p className="mb-2 last:mb-0" key={paragraphIndex}>
      {paragraph.split("\n").map((line, lineIndex, lines) => (
        <span key={lineIndex}>
          {renderInlineCommentMarkdown(line, mentions)}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  ));
}

function renderInlineCommentMarkdown(value: string, mentions: MentionAuthor[]) {
  const tokens = [
    { regex: /^`([^`]+)`/, render: (match: RegExpExecArray, key: string) => <code className="bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground" key={key}>{match[1]}</code> },
    { regex: /^\[([^\]]+)\]\(([^)]+)\)/, render: (match: RegExpExecArray, key: string) => <a className="font-medium text-primary underline underline-offset-4" href={safeCommentUrl(match[2])} key={key} rel="noreferrer" target="_blank">{match[1]}</a> },
    { regex: /^\*\*([^*]+)\*\*/, render: (match: RegExpExecArray, key: string) => <strong className="font-semibold text-foreground" key={key}>{match[1]}</strong> },
    { regex: /^~~([^~]+)~~/, render: (match: RegExpExecArray, key: string) => <del key={key}>{match[1]}</del> },
    { regex: /^\*([^*]+)\*/, render: (match: RegExpExecArray, key: string) => <em key={key}>{match[1]}</em> },
  ];
  const output: ReactNode[] = [];
  let rest = value;
  let index = 0;
  while (rest.length) {
    const token = tokens.find((item) => item.regex.test(rest));
    const match = token?.regex.exec(rest);
    if (token && match) {
      output.push(token.render(match, `token-${index}`));
      rest = rest.slice(match[0].length);
      index += 1;
      continue;
    }
    const nextSpecial = rest.slice(1).search(/[`*~[]/) + 1;
    const take = nextSpecial > 0 ? nextSpecial : rest.length;
    output.push(...linkCommentMentions(rest.slice(0, take), mentions, index));
    rest = rest.slice(take);
    index += 1;
  }
  return output;
}

function linkCommentMentions(text: string, mentions: MentionAuthor[], keyStart: number) {
  const names = mentions.map((mention) => mention.displayName).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!names.length) return [text];
  const byName = new Map(mentions.map((mention) => [mention.displayName.toLowerCase(), mention]));
  const regex = new RegExp(`@(${names.map(escapeRegex).join("|")})(?=$|[\\s.,!?;:)\\]])`, "gi");
  const output: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = keyStart;
  for (const match of text.matchAll(regex)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) output.push(text.slice(lastIndex, match.index));
    const mention = byName.get(match[1].toLowerCase());
    output.push(
      <CreatorMention key={`mention-${tokenIndex}`} displayName={match[1]} creatorName={mention?.creatorName}>
        @{match[1]}
      </CreatorMention>,
    );
    lastIndex = match.index + match[0].length;
    tokenIndex += 1;
  }
  if (lastIndex < text.length) output.push(text.slice(lastIndex));
  return output.length ? output : [text];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeCommentUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : "#";
}

export function presetImageUrl(preset?: ProfilePreset) {
  return preset?.imageUrl ? authAssetUrl(preset.imageUrl) : undefined;
}

export function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || "?";
}
