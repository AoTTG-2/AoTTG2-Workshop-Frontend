import type { ReactNode } from "react";

type SideCardVariant = "primary" | "secondary";

interface SideCardProps {
  title: ReactNode;
  children: ReactNode;
  variant?: SideCardVariant;
  className?: string;
  contentClassName?: string;
}

function classNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SideCard({ title, children, variant = "primary", className, contentClassName }: SideCardProps) {
  const toneClass = variant === "secondary" ? "aottg2-cta-secondary text-secondary-foreground" : "aottg2-cta-primary text-primary-foreground";

  return (
    <section className={classNames("overflow-hidden border border-border bg-card/50", className)}>
      <h2 className={classNames("aottg2-emboss-bg px-3 py-2 font-primary text-sm uppercase leading-none tracking-wider", toneClass)}>{title}</h2>
      <div className={classNames("p-3", contentClassName)}>{children}</div>
    </section>
  );
}
