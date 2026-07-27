import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={cn("surface p-4", className)}>{children}</section>;
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="label-caps text-foreground/80">{children}</h2>
      {right}
    </div>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold uppercase tracking-wider transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "w-full px-5 py-3.5 text-base",
        variant === "primary" && "heat shadow-[var(--shadow-glow)]",
        variant === "accent" && "bg-accent text-accent-foreground",
        variant === "outline" && "border border-border bg-elevated text-foreground",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        variant === "danger" && "bg-destructive text-destructive-foreground",
        className,
      )}
    />
  );
}

export function Field({
  label,
  suffix,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      {label ? <span className="label-caps mb-1.5 block">{label}</span> : null}
      <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3 py-2.5 focus-within:border-primary">
        <input
          {...props}
          className={cn(
            "w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground",
            className,
          )}
        />
        {suffix ? <span className="label-caps shrink-0">{suffix}</span> : null}
      </div>
    </label>
  );
}

export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "label-caps shrink-0 rounded-full border px-3 py-1.5 transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-elevated text-muted-foreground",
        className,
      )}
    />
  );
}

export function Stat({
  value,
  unit,
  label,
  tone = "default",
}: {
  value: ReactNode;
  unit?: string;
  label: string;
  tone?: "default" | "primary" | "accent";
}) {
  return (
    <div>
      <p
        className={cn(
          "numeric text-2xl",
          tone === "primary" && "text-primary",
          tone === "accent" && "text-accent",
        )}
      >
        {value}
        {unit ? (
          <span className="ml-0.5 text-xs font-semibold text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="label-caps mt-1">{label}</p>
    </div>
  );
}

export function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label-caps">{label}</span>
        <span className="numeric text-sm text-foreground">
          {Math.round(value)}
          <span className="text-muted-foreground">/{target}g</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function CalorieRing({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const r = 76;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const remaining = Math.max(0, Math.round(target - consumed));

  return (
    <div className="relative mx-auto h-48 w-48">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="13"
        />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="numeric text-5xl text-foreground">{remaining}</p>
        <p className="label-caps mt-1">kcal left</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {Math.round(consumed)} / {target}
        </p>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
