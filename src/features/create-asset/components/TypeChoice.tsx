import type { ReactNode } from "react";
import { Button } from "@aottg2/ui";

export function TypeChoice({ active = false, compact = false, disabled = false, icon, title, body, onClick }: { active?: boolean; compact?: boolean; disabled?: boolean; icon?: ReactNode; title: string; body?: string; onClick: () => void }) {
  const minHeight = body ? (compact ? "min-h-[76px]" : "min-h-[104px]") : compact ? "min-h-16" : "min-h-20";

  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      className={`group flex !h-auto w-full min-w-0 flex-col !items-start !justify-center gap-2 !overflow-hidden !whitespace-normal px-4 py-4 text-left ${minHeight} ${active ? "aottg2-emboss-bg aottg2-cta-primary shadow-[0_3px_0_hsl(var(--primary)/0.45)]" : "bg-[color-mix(in_srgb,hsl(var(--input))_58%,hsl(var(--background)))] shadow-[inset_0_1px_5px_rgb(0_0_0_/_0.28),inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-foreground"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={`flex w-full min-w-0 items-center gap-2 whitespace-normal font-primary font-semibold uppercase leading-tight ${compact ? "text-lg" : "text-2xl"} ${active ? "text-primary-foreground" : "text-foreground group-hover:text-background"}`}>
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 max-w-full break-words">{title}</span>
      </span>
      {body ? <span className={`block whitespace-normal text-sm leading-5 ${active ? "text-primary-foreground" : "text-foreground group-hover:text-background"}`}>{body}</span> : null}
    </Button>
  );
}
