import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type AssetTagVariant = "category" | "tag" | "empty";
type AssetTagSize = "sm" | "md";

interface AssetTagBaseProps {
  children: ReactNode;
  variant?: AssetTagVariant;
  size?: AssetTagSize;
}

const baseClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none font-semibold uppercase tracking-normal transition-colors";

const variantClass: Record<AssetTagVariant, string> = {
  category: "bg-primary/18 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)_/_0.18)]",
  tag: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
  empty: "bg-transparent text-muted-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]",
};

const sizeClass: Record<AssetTagSize, string> = {
  sm: "h-7 px-2 text-xs leading-none",
  md: "h-8 px-2.5 text-xs leading-none",
};

function classNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function assetTagClass(variant: AssetTagVariant, size: AssetTagSize, className?: string) {
  return classNames(baseClass, variantClass[variant], sizeClass[size], className);
}

export function AssetTag({ children, variant = "tag", size = "sm" }: AssetTagBaseProps) {
  return <span className={assetTagClass(variant, size)}>{children}</span>;
}

export function AssetTagButton({
  children,
  variant = "tag",
  size = "sm",
  className,
  ...props
}: AssetTagBaseProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button type="button" className={assetTagClass(variant, size, classNames("workshop-control-free workshop-tag", `workshop-tag-${size}`, className))} {...props}>
      {children}
    </button>
  );
}

export function AssetTagLink({
  children,
  variant = "tag",
  size = "sm",
  className,
  ...props
}: AssetTagBaseProps & LinkProps & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link className={assetTagClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
