import { useRef } from "react";
import type { ElementRef } from "react";
import { Button, Label, Textarea } from "@aottg2/ui";
import { markdownTools } from "../markdown";

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const textareaRef = useRef<ElementRef<typeof Textarea>>(null);

  function insertMarkup(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    const nextStart = start + before.length;
    const nextEnd = nextStart + selected.length;

    onChange(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <Label className="grid gap-0 text-sm font-medium">
      Post Content
      <div className="mt-2 flex flex-wrap items-center gap-1 border border-input border-b-0 bg-muted/40 px-2 py-1" aria-label="Post content formatting toolbar">
        {markdownTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button key={tool.label} type="button" variant="ghost" size="icon" static onClick={() => insertMarkup(tool.before, tool.after, tool.placeholder)} className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
              <Icon className="h-4 w-4" />
              <span className="sr-only">{tool.label}</span>
            </Button>
          );
        })}
      </div>
      <Textarea ref={textareaRef} className="min-h-64 border-t-0 focus-visible:ring-offset-0" value={value} onChange={(event) => onChange(event.target.value)} />
    </Label>
  );
}
