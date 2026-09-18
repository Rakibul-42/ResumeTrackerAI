import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 mb-6", className)}>
      <div className="min-w-0 break-words">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--ink-muted)] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 max-w-full">{actions}</div>}
    </div>
  );
}
