import { Input } from "@/components/ui/input";
import { PenLine, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function RibbonBtn({
  icon: Icon,
  label,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  accent?: boolean;
}) {
  return (
    <button className="flex h-16 w-[72px] flex-col items-center justify-start gap-1 rounded px-1 py-1 text-[11px] text-foreground hover:bg-accent">
      <Icon
        className={`h-7 w-7 ${accent ? "text-primary" : "text-foreground/80"}`}
        strokeWidth={1.5}
      />
      <span className="leading-tight text-center whitespace-pre-line">{label}</span>
    </button>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1 text-base font-bold text-primary">{children}</h2>;
}

export function ICell({
  value = "",
  className = "",
  right = false,
}: {
  value?: string | number;
  className?: string;
  right?: boolean;
}) {
  return (
    <Input
      defaultValue={value as string}
      className={`h-7 rounded-none border-0 bg-transparent px-1 text-xs ${right ? "text-right" : ""} focus-visible:ring-1 ${className}`}
    />
  );
}

export function YCell({ value = "", right = true }: { value?: string | number; right?: boolean }) {
  return (
    <Input
      defaultValue={value as string}
      className={`h-7 rounded-none border-0 bg-amber-50 px-1 text-xs ${right ? "text-right" : ""} focus-visible:ring-1`}
    />
  );
}

export function TabBtn({
  active,
  children,
  onClose,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClose?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 border border-b-0 px-3 py-1 text-xs ${active ? "bg-background" : "bg-muted text-muted-foreground"}`}
    >
      {children}
      {active && <PenLine className="h-3 w-3 text-primary" />}
      {onClose && <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />}
    </div>
  );
}
