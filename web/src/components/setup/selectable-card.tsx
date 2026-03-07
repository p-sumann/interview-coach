"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export function SelectableCard({
  selected,
  onClick,
  children,
  className,
  badge,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer",
        "hover:border-primary/40 hover:bg-primary/5",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_20px_oklch(0.75_0.16_75/0.2)]"
          : "border-border/50 bg-card/50",
        className
      )}
    >
      {badge && (
        <Badge className="absolute -top-2 right-2 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
          {badge}
        </Badge>
      )}
      {children}
    </button>
  );
}
