import { createContext, useContext, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TabsCtx = createContext(null);

export function Tabs({ value, onValueChange, children, className }) {
  const id = useId();
  return (
    <TabsCtx.Provider value={{ value, onValueChange, id }}>
      <div className={cn("", className)}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className, ...props }) {
  return (
    <div
      role="tablist"
      aria-label="Views"
      onKeyDown={(event) => {
        const tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)'));
        const current = tabs.indexOf(event.target);
        if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next]?.focus();
        tabs[next]?.click();
      }}
      {...props}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] p-1 rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }) {
  const ctx = useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      id={`${ctx.id}-tab-${value}`}
      aria-controls={`${ctx.id}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "relative px-3.5 h-8 text-xs font-medium rounded-full transition-colors",
        active ? "text-[var(--bg)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
        className
      )}
    >
      {active && (
        <motion.span
          layoutId={`${ctx.id}-tab-active`}
          className="absolute inset-0 rounded-full bg-[var(--ink)]"
          transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const ctx = useContext(TabsCtx);
  if (ctx.value !== value) return null;
  return <div role="tabpanel" aria-labelledby={`${ctx.id}-tab-${value}`} id={`${ctx.id}-panel-${value}`} tabIndex={0} className={className}>{children}</div>;
}
