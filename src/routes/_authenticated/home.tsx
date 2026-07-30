import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Droplets, LogOut, Plus, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProfileSheet, applyStoredAccent } from "@/components/profile-sheet";
import { BudgetSuggestions } from "@/components/budget-suggestions";
import {
  Button,
  CalorieRing,
  Card,
  Empty,
  MacroBar,
  SectionTitle,
  Stat,
} from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { shortDay, todayISO } from "@/lib/nutrition";
import {
  currentUserId,
  useFoodLogs,
  useInvalidate,
  useProfile,
  useSession,
  useSessionHistory,
  useWater,
  useWeeklyIntake,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Today's Dashboard — NutrientLens" },
      {
        name: "description",
        content:
          "Your daily calorie ring, macro bars, water intake, weekly trend and today's training focus in one screen.",
      },
      { property: "og:title", content: "Today's Dashboard — NutrientLens" },
      {
        property: "og:description",
        content: "Calories, macros, water and training at a glance.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Home,
});

function Home() {
  const date = todayISO();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => applyStoredAccent(), []);
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();
  const { data: foods } = useFoodLogs(date);
  const { data: water } = useWater(date);
  const { data: week } = useWeeklyIntake();
  const { data: today } = useSession(date);
  const { data: history } = useSessionHistory(7);

  const totals = useMemo(() => {
    return (foods ?? []).reduce(
      (acc, f) => ({
        calories: acc.calories + Number(f.calories),
        protein: acc.protein + Number(f.protein),
        carbs: acc.carbs + Number(f.carbs),
        fat: acc.fat + Number(f.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [foods]);

  async function addWater(ml: number) {
    const user_id = await currentUserId();
    const { error } = await supabase
      .from("water_logs")
      .insert({ user_id, amount_ml: ml, log_date: date });
    if (error) return toast.error(error.message);
    invalidate(["water"]);
  }

  const chartData = (week ?? []).map((d) => ({
    day: shortDay(d.date),
    calories: Math.round(d.calories),
  }));

  const waterTarget = profile?.water_target_ml ?? 3000;
  const waterPct = Math.min(100, ((water ?? 0) / waterTarget) * 100);

  return (
    <AppShell
      title={`Hey${profile?.display_name ? `, ${profile.display_name}` : ""}`}
      subtitle={new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "short",
      })}
      action={
        <div className="flex items-center gap-2">
          <button
            aria-label="Profile and settings"
            onClick={() => setShowSettings(true)}
            className="rounded-full border border-border bg-elevated p-2.5 text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            aria-label="Sign out"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="rounded-full border border-border bg-elevated p-2.5 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      }
    >
      {showSettings && <ProfileSheet onClose={() => setShowSettings(false)} />}

      <Card className="text-center">
        <CalorieRing
          consumed={totals.calories}
          target={profile?.calorie_target ?? 2400}
        />
        <div className="mt-5 space-y-3 border-t border-border pt-4 text-left">
          <MacroBar
            label="Protein"
            value={totals.protein}
            target={profile?.protein_target ?? 180}
            color="var(--protein)"
          />
          <MacroBar
            label="Carbs"
            value={totals.carbs}
            target={profile?.carb_target ?? 240}
            color="var(--carbs)"
          />
          <MacroBar
            label="Fat"
            value={totals.fat}
            target={profile?.fat_target ?? 70}
            color="var(--fat)"
          />
        </div>
        <Link to="/food" className="mt-5 block">
          <Button size="lg">
            <Plus className="h-4 w-4" /> Log food
          </Button>
        </Link>
      </Card>

      <BudgetSuggestions
        className="mt-4"
        remaining={{
          calories: (profile?.calorie_target ?? 2400) - totals.calories,
          protein: (profile?.protein_target ?? 180) - totals.protein,
          carbs: (profile?.carb_target ?? 240) - totals.carbs,
          fat: (profile?.fat_target ?? 70) - totals.fat,
        }}
      />

      <div className="mt-4">
        <SectionTitle>Water</SectionTitle>
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <p className="numeric text-4xl text-[var(--water)]">
                {((water ?? 0) / 1000).toFixed(1)}
                <span className="ml-1 text-sm text-muted-foreground">
                  / {(waterTarget / 1000).toFixed(1)} L
                </span>
              </p>
            </div>
            <Droplets className="h-6 w-6 text-[var(--water)]" />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[var(--water)] transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            {[250, 500, 750].map((ml) => (
              <Button
                key={ml}
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => addWater(ml)}
              >
                +{ml}ml
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionTitle>Today's training</SectionTitle>
        <Card>
          {today?.session ? (
            <>
              <p className="font-display text-2xl font-bold uppercase">
                {today.session.day_label ?? "Session"}
              </p>
              <p className="mt-1 text-sm text-primary">
                {today.session.style_name ?? "Freestyle"}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <Stat value={today.exercises.length} label="Exercises" />
                <Stat
                  tone="primary"
                  value={today.exercises.reduce(
                    (s, e) => s + e.sets.filter((x) => x.done).length,
                    0,
                  )}
                  label="Sets done"
                />
              </div>
              <Link to="/workout" className="mt-4 block">
                <Button size="lg" variant="outline">
                  Continue session
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Nothing logged yet. Pick a style and get after it.
              </p>
              <Link to="/workout" className="mt-4 block">
                <Button size="lg">Choose today's style</Button>
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <SectionTitle>7-day intake</SectionTitle>
        <Card className="pl-0">
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#cal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionTitle
          right={
            <Link to="/workout" className="label-caps text-primary">
              All
            </Link>
          }
        >
          Recent styles
        </SectionTitle>
        {history && history.length > 0 ? (
          <ul className="space-y-2">
            {history.slice(0, 4).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-elevated px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold uppercase tracking-wide">
                    {s.day_label ?? "Session"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.style_name ?? "Freestyle"}
                  </p>
                </div>
                <span className="label-caps shrink-0">
                  {shortDay(s.session_date)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No sessions logged yet this week.</Empty>
        )}
      </div>
    </AppShell>
  );
}
