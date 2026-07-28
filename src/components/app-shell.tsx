import { Link, useRouterState } from "@tanstack/react-router";
import {
  Flame,
  UtensilsCrossed,
  Dumbbell,
  LayoutGrid,
  TrendingUp,
  MessageSquareText,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/home", label: "Home", icon: Flame },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/workout", label: "Train", icon: Dumbbell },
  { to: "/styles", label: "Styles", icon: LayoutGrid },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/coach", label: "Coach", icon: MessageSquareText },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      <header
        className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-background/85 px-5 pb-4 backdrop-blur-xl"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold uppercase tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="label-caps mt-1 truncate">{subtitle}</p>
          ) : null}
        </div>

        {/* Header Actions: Animation container, custom actions, and Profile button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="form-guide-arc"></div>
          {action}
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-elevated text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 pt-5 pb-32" style={{ paddingBottom: "max(8rem, calc(8rem + env(safe-area-inset-bottom)))" }}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg border-t border-border/70 bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <ul className="grid grid-cols-6">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_var(--primary)]")} />
                  <span className="label-caps text-[0.55rem] leading-none tracking-widest">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
