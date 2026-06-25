import { useRef, useState } from "react";
import type { ElementRef, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, Input, Popover, PopoverContent, PopoverTrigger, Spinner } from "@aottg2/ui";
import { X } from "lucide-react";
import { listTagSuggestions } from "@/lib/api/workshop";
import { AssetTagButton } from "@/components/AssetTag";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export function TagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<ElementRef<"input"> | null>(null);
  const debouncedDraft = useDebouncedValue(draft.trim(), 120);
  const selectedTags = value
    .map((tag) => tag.trim())
    .filter(Boolean);
  const selectedLookup = new Set(selectedTags.map((tag) => tag.toLowerCase()));
  const suggestionsQuery = useQuery({
    queryKey: ["workshop", "tag-suggestions", debouncedDraft],
    queryFn: () => listTagSuggestions(debouncedDraft, 8),
    enabled: open,
    staleTime: 30_000,
  });
  const suggestions = (suggestionsQuery.data?.tags ?? []).filter((item) => !selectedLookup.has(item.tag.toLowerCase()));

  function addTags(tags: string[], rawTags: string[]) {
    const next = [...tags];
    const lookup = new Set(next.map((tag) => tag.toLowerCase()));
    for (const rawTag of rawTags) {
      const tag = rawTag.trim();
      const key = tag.toLowerCase();
      if (!tag || lookup.has(key)) continue;
      next.push(tag);
      lookup.add(key);
    }
    return next;
  }

  function commit(rawTag = draft) {
    const next = addTags(selectedTags, [rawTag]);
    if (next.length !== selectedTags.length) onChange(next);
    setDraft("");
    setOpen(false);
  }

  function updateDraft(nextValue: string) {
    setOpen(true);
    if (!nextValue.includes(",")) {
      setDraft(nextValue);
      return;
    }

    const parts = nextValue.split(",");
    const trailingDraft = parts.pop() ?? "";
    onChange(addTags(selectedTags, parts));
    setDraft(trailingDraft);
  }

  function handleKeyDown(event: KeyboardEvent<ElementRef<"input">>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === "Backspace" && draft.length === 0 && selectedTags.length > 0) {
      event.preventDefault();
      onChange(selectedTags.slice(0, -1));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative flex h-10 w-full cursor-text items-center overflow-hidden rounded-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
          onClick={() => inputRef.current?.focus()}
        >
          <Input aria-hidden="true" tabIndex={-1} readOnly className="pointer-events-none absolute inset-0 h-10" />
          <div className="relative z-10 flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden px-3 py-2">
            {selectedTags.map((tag) => (
              <AssetTagButton key={tag} size="sm" className="h-6 max-w-32 shrink-0 gap-1 px-1.5 text-[11px]" onClick={(event) => {
                event.stopPropagation();
                onChange(selectedTags.filter((item) => item !== tag));
              }}>
                <span className="truncate">{tag}</span>
                <X className="size-3" aria-hidden="true" />
                <span className="sr-only">Remove {tag}</span>
              </AssetTagButton>
            ))}
            <input
              ref={inputRef}
              className="h-6 min-w-[7rem] flex-1 border-0 bg-transparent p-0 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              placeholder={selectedTags.length === 0 ? "Type a tag, then comma" : ""}
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0" align="start" onOpenAutoFocus={(event) => event.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandList>
            {suggestionsQuery.isFetching ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Spinner size="sm" variant="primary" label="Loading tags" />
                Loading tags
              </div>
            ) : suggestions.length > 0 ? (
              <CommandGroup heading="Existing tags">
                {suggestions.map((item) => (
                  <CommandItem key={item.tag} value={item.tag} className="cursor-pointer px-3 py-2 hover:!bg-secondary hover:!text-secondary-foreground data-[selected=true]:!bg-secondary data-[selected=true]:!text-secondary-foreground" onSelect={() => commit(item.tag)}>
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-sm font-semibold uppercase text-inherit">{item.tag}</span>
                      <span className="text-xs font-medium uppercase text-inherit opacity-75">{item.count} {item.count === 1 ? "skin" : "skins"}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No matching tags</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
