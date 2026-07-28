import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  History,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
  Trophy,
  X,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  SectionTitle,
  Stat,
} from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { isoOffset, shortDay, todayISO } from "@/lib/nutrition";
import {
  currentUserId,
  useAllExerciseLogs,
  useInvalidate,
  useSession,
  useSessionHistory,
  type ExerciseLog,
  type ExerciseSet,
} from "@/lib/queries";
import {
  ATHLETE_STYLES,
  EXERCISE_LIBRARY,
  MUSCLE_GROUPS,
  type AthleteStyle,
  type PlanDay,
} from "@/lib/style-library";

export const Route = createFileRoute("/_authenticated/workout")({
  head: () => ({
    meta: [
      { title: "Workout Log — NutrientLens" },
      {
        name: "description",
        content:
          "Pick today's athlete style, log sets, reps and weight, run the rest timer and track volume, PRs and progressive overload.",
      },
      { property: "og:title", content: "Workout Log — NutrientLens" },
      {
        property: "og:description",
        content: "Set-by-set logging with volume and PR tracking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkoutPage,
});

const WEEK = Array.from({ length: 7 }, (_, i) => isoOffset(i - 6));

function WorkoutPage() {
  const [date, setDate] = useState(todayISO());
  const invalidate = useInvalidate();
  const { data, isLoading } = useSession(date);
  const { data: history } = useSessionHistory(42);
  const { data: allLogs } = useAllExerciseLogs();

  const [picker, setPicker] = useState(false);
  const [pickedStyle, setPickedStyle] = useState<AthleteStyle | null>(null);
  const [adding, setAdding] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const [restRunning, setRestRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (rest === null || !restRunning) return;
    if (rest <= 0) {
      setRestRunning(false);
      toast.success("Rest over — next set.");
      return;
    }
    const t = setTimeout(() => setRest((r) => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [rest, restRunning]);

  const session = data?.session ?? null;
  const exercises = data?.exercises ?? [];

  const volumeByMuscle = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of exercises) {
      const vol = e.sets
        .filter((s) => s.done)
        .reduce((sum, s) => sum + Number(s.reps || 0) * Number(s.weight || 0), 0);
      map.set(e.muscle_group, (map.get(e.muscle_group) ?? 0) + vol);
    }
    return [...map.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  }, [exercises]);

  const totalVolume = volumeByMuscle.reduce((s, [, v]) => s + v, 0);

  const bestByExercise = useMemo(() => {
    const map = new Map<string, { weight: number; reps: number; date: string }>();
    for (const log of allLogs ?? []) {
      for (const s of log.sets ?? []) {
        if (!s.done) continue;
        const w = Number(s.weight) || 0;
        const prev = map.get(log.exercise_name);
        if (!prev || w > prev.weight) {
          map.set(log.exercise_name, {
            weight: w,
            reps: Number(s.reps) || 0,
            date: log.workout_sessions?.session_date ?? "",
          });
        }
      }
    }
    return map;
  }, [allLogs]);

  const lastSessionByExercise = useMemo(() => {
    const map = new Map<string, { weight: number; reps: number; date: string }>();
    for (const log of allLogs ?? []) {
      const d = log.workout_sessions?.session_date ?? "";
      if (!d || d >= date) continue;
      if (map.has(log.exercise_name)) continue;
      const best = (log.sets ?? [])
        .filter((s) => s.done)
        .sort((a, b) => Number(b.weight) - Number(a.weight))[0];
      if (best)
        map.set(log.exercise_name, {
          weight: Number(best.weight) || 0,
          reps: Number(best.reps) || 0,
          date: d,
        });
    }
    return map;
  }, [allLogs, date]);

  async function ensureSession(style?: AthleteStyle, day?: PlanDay) {
    const user_id = await currentUserId();
    const payload = {
      user_id,
      session_date: date,
      style_id: style?.id ?? null,
      style_name: style?.name ?? null,
      day_label: day?.focus ?? "Freestyle session",
      muscle_groups: day?.muscles ?? [],
    };
    const { data: row, error } = await supabase
      .from("workout_sessions")
      .upsert(payload, { onConflict: "user_id,session_date" })
      .select()
      .single();
    if (error) throw error;
    return row;
  }

  async function loadStyleDay(style: AthleteStyle, day: PlanDay) {
    try {
      const row = await ensureSession(style, day);
      await supabase.from("exercise_logs").delete().eq("session_id", row.id);
      const user_id = await currentUserId();
      const rows = day.exercises.map((e, i) => ({
        user_id,
        session_id: row.id,
        exercise_name: e.name,
        muscle_group: e.muscle,
        position: i,
        target_sets: e.sets,
        target_reps: e.reps,
        rest_seconds: e.rest,
        sets: Array.from({ length: e.sets }, () => ({
          reps: "",
          weight: "",
          done: false,
        })),
      }));
      const { error } = await supabase.from("exercise_logs").insert(rows);
      if (error) throw error;
      setPicker(false);
      setPickedStyle(null);
      invalidate(["session", "session-history", "all-exercise-logs"]);
      toast.success(`${style.name} loaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load style");
    }
  }

  async function addExercise(name: string, muscle: string) {
    try {
      const row = session ?? (await ensureSession());
      const user_id = await currentUserId();
      const { error } = await supabase.from("exercise_logs").insert({
        user_id,
        session_id: row.id,
        exercise_name: name,
        muscle_group: muscle,
        position: exercises.length,
        target_sets: 3,
        target_reps: "8-12",
        rest_seconds: 90,
        sets: Array.from({ length: 3 }, () => ({
          reps: "",
          weight: "",
          done: false,
        })),
      });
      if (error) throw error;
      setAdding(false);
      invalidate(["session", "session-history", "all-exercise-logs"]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add");
    }
  }

  async function saveSets(ex: ExerciseLog, sets: ExerciseSet[]) {
    const { error } = await supabase
      .from("exercise_logs")
      .update({ sets })
      .eq("id", ex.id);
    if (error) return toast.error(error.message);
    invalidate(["session", "all-exercise-logs"]);
  }

  async function removeExercise(id: string) {
    const { error } = await supabase.from("exercise_logs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate(["session", "all-exercise-logs"]);
  }

  return (
    <AppShell
      title="Workout"
      subtitle={
        session?.style_name ? `${session.style_name}` : "No style selected yet"
      }
      action={
        <button
          aria-label="History"
          onClick={() => setShowHistory(true)}
          className="rounded-full border border-border bg-elevated p-2.5 text-muted-foreground"
        >
          <History className="h-4 w-4" />
        </button>
      }
    >
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {WEEK.map((d) => {
          const logged = history?.find((h) => h.session_date === d);
          const active = d === date;
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`flex min-w-14 flex-col items-center rounded-xl border px-3 py-2.5 ${
                active
                  ? "border-primary bg-primary/12"
                  : "border-border bg-elevated"
              }`}
            >
              <span className="label-caps">{shortDay(d)}</span>
              <span
                className={`numeric mt-1 text-lg ${active ? "text-primary" : "text-foreground"}`}
              >
                {Number(d.slice(-2))}
              </span>
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${
                  logged ? "bg-accent" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button onClick={() => setPicker(true)}>Choose style</Button>
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Exercise
        </Button>
      </div>

      {session && (
        <Card className="mt-4">
          <p className="font-display text-2xl font-bold uppercase">
            {session.day_label}
          </p>
          <p className="mt-1 text-sm text-primary">
            {session.style_name ?? "Freestyle"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <Stat
              tone="primary"
              value={Math.round(totalVolume).toLocaleString()}
              unit="kg"
              label="Volume"
            />
            <Stat value={exercises.length} label="Exercises" />
            <Stat
              tone="accent"
              value={exercises.reduce(
                (s, e) => s + e.sets.filter((x) => x.done).length,
                0,
              )}
              label="Sets done"
            />
          </div>
          {volumeByMuscle.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {volumeByMuscle.map(([m, v]) => (
                <div key={m}>
                  <div className="flex justify-between">
                    <span className="label-caps">{m}</span>
                    <span className="numeric text-sm">
                      {Math.round(v).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(v / totalVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <Empty>Loading session…</Empty>
        ) : exercises.length === 0 ? (
          <Empty>
            No exercises yet. Choose today's style or add one manually.
          </Empty>
        ) : (
          exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              pr={bestByExercise.get(ex.exercise_name)}
              last={lastSessionByExercise.get(ex.exercise_name)}
              onSave={(sets) => saveSets(ex, sets)}
              onDelete={() => removeExercise(ex.id)}
              onRest={(sec) => {
                setRest(sec);
                setRestRunning(true);
              }}
            />
          ))
        )}
      </div>

      {rest !== null && (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto w-full max-w-lg px-5">
          <div className="surface flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-primary" />
              <span className="numeric text-2xl">
                {Math.floor(Math.max(0, rest) / 60)}:
                {String(Math.max(0, rest) % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRestRunning((r) => !r)}
              >
                {restRunning ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRest(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {picker && (
        <Sheet
          title={pickedStyle ? pickedStyle.name : "Choose today's style"}
          onClose={() => {
            setPicker(false);
            setPickedStyle(null);
          }}
        >
          {!pickedStyle ? (
            <ul className="space-y-2">
              {ATHLETE_STYLES.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setPickedStyle(s)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3 text-left"
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-semibold uppercase tracking-wide">
                        {s.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.tag}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setPickedStyle(null)}
                className="label-caps mb-2 text-primary"
              >
                ← All styles
              </button>
              {pickedStyle.days.map((day) => (
                <button
                  key={day.label}
                  onClick={() => loadStyleDay(pickedStyle, day)}
                  className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-left"
                >
                  <p className="label-caps">{day.label}</p>
                  <p className="mt-0.5 font-display text-base font-semibold uppercase">
                    {day.focus}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {day.exercises.length} exercises ·{" "}
                    {day.exercises.reduce((s, e) => s + e.sets, 0)} sets
                  </p>
                </button>
              ))}
            </div>
          )}
        </Sheet>
      )}

      {adding && (
        <AddExerciseSheet
          onClose={() => setAdding(false)}
          onPick={addExercise}
        />
      )}

      {showHistory && (
        <Sheet title="Style history" onClose={() => setShowHistory(false)}>
          {history && history.length > 0 ? (
            <ul className="space-y-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-elevated px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold uppercase tracking-wide">
                      {h.day_label}
                    </p>
                    <p className="truncate text-xs text-primary">
                      {h.style_name ?? "Freestyle"}
                    </p>
                  </div>
                  <span className="label-caps shrink-0">{h.session_date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No sessions logged yet.</Empty>
          )}
        </Sheet>
      )}
    </AppShell>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold uppercase">{title}</h3>
          <button aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddExerciseSheet({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (name: string, muscle: string) => void;
}) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string>("all");

  const list = EXERCISE_LIBRARY.filter(
    (e) =>
      (muscle === "all" || e.muscle === muscle) &&
      e.name.toLowerCase().includes(q.trim().toLowerCase()),
  ).slice(0, 40);

  return (
    <Sheet title="Exercise library" onClose={onClose}>
      <Field
        placeholder="Search exercises"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
          all
        </Chip>
        {MUSCLE_GROUPS.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
            {m}
          </Chip>
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((e) => (
          <li key={e.name}>
            <button
              onClick={() => onPick(e.name, e.muscle)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-elevated px-4 py-3 text-left"
            >
              <span className="min-w-0 truncate text-sm font-semibold">
                {e.name}
              </span>
              <span className="label-caps shrink-0">{e.muscle}</span>
            </button>
          </li>
        ))}
        {q.trim() && (
          <li>
            <button
              onClick={() => onPick(q.trim(), muscle === "all" ? "other" : muscle)}
              className="w-full rounded-xl border border-dashed border-primary/60 px-4 py-3 text-sm text-primary"
            >
              Add custom "{q.trim()}"
            </button>
          </li>
        )}
      </ul>
    </Sheet>
  );
}

function ExerciseCard({
  ex,
  pr,
  last,
  onSave,
  onDelete,
  onRest,
}: {
  ex: ExerciseLog;
  pr?: { weight: number; reps: number; date: string };
  last?: { weight: number; reps: number; date: string };
  onSave: (sets: ExerciseSet[]) => void;
  onDelete: () => void;
  onRest: (sec: number) => void;
}) {
  const [sets, setSets] = useState<ExerciseSet[]>(ex.sets ?? []);

  useEffect(() => setSets(ex.sets ?? []), [ex.sets]);

  const update = (i: number, patch: Partial<ExerciseSet>) => {
    const next = sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    setSets(next);
    return next;
  };

  const topWeight = Math.max(
    0,
    ...sets.filter((s) => s.done).map((s) => Number(s.weight) || 0),
  );
  const delta = last ? topWeight - last.weight : 0;
  const isPR = pr && topWeight > 0 && topWeight >= pr.weight;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold uppercase">
            {ex.exercise_name}
          </h3>
          <p className="label-caps mt-0.5">
            {ex.muscle_group} · target {ex.target_sets} × {ex.target_reps}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Start rest timer"
            onClick={() => onRest(ex.rest_seconds)}
            className="rounded-lg border border-border bg-elevated px-2.5 py-1.5"
          >
            <Timer className="h-4 w-4 text-primary" />
          </button>
          <button
            aria-label="Remove exercise"
            onClick={onDelete}
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FormGuide name={ex.exercise_name} rest={ex.rest_seconds} />

      {(last || isPR) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {last && (
            <span
              className={`label-caps rounded-full px-2.5 py-1 ${
                delta > 0
                  ? "bg-accent/15 text-accent"
                  : delta < 0
                    ? "bg-destructive/15 text-destructive"
                    : "bg-secondary"
              }`}
            >
              Last {last.weight}kg×{last.reps}
              {topWeight > 0 && (delta > 0 ? ` ▲ +${delta}kg` : delta < 0 ? ` ▼ ${delta}kg` : " =")}
            </span>
          )}
          {isPR && (
            <span className="label-caps pr-glow flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-accent">
              <Trophy className="h-3 w-3" /> PR {topWeight}kg
            </span>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {sets.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="numeric w-6 shrink-0 text-sm text-muted-foreground">
              {i + 1}
            </span>
            <input
              inputMode="decimal"
              placeholder="kg"
              value={String(s.weight ?? "")}
              onChange={(e) => update(i, { weight: e.target.value })}
              onBlur={() => onSave(sets)}
              className="numeric w-full min-w-0 rounded-lg border border-input bg-elevated px-3 py-2 text-center text-lg outline-none focus:border-primary"
            />
            <span className="label-caps shrink-0">×</span>
            <input
              inputMode="numeric"
              placeholder="reps"
              value={String(s.reps ?? "")}
              onChange={(e) => update(i, { reps: e.target.value })}
              onBlur={() => onSave(sets)}
              className="numeric w-full min-w-0 rounded-lg border border-input bg-elevated px-3 py-2 text-center text-lg outline-none focus:border-primary"
            />
            <button
              aria-label="Complete set"
              onClick={() => {
                const next = update(i, { done: !s.done });
                onSave(next);
                if (!s.done) onRest(ex.rest_seconds);
              }}
              className={`shrink-0 rounded-lg border px-3 py-2 ${
                s.done
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-elevated text-muted-foreground"
              }`}
            >
              <Check className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = [...sets, { reps: "", weight: "", done: false }];
            setSets(next);
            onSave(next);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Set
        </Button>
        {sets.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = sets.slice(0, -1);
              setSets(next);
              onSave(next);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Remove
          </Button>
        )}
      </div>
    </Card>
  );
}

function FormGuide({ name, rest }: { name: string; rest: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="label-caps flex items-center gap-1.5 text-primary"
      >
        <Activity className="h-3.5 w-3.5" />
        {open ? "Hide form guide" : "Show form guide"}
      </button>
      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-elevated">
          <div className="relative flex h-24 items-center justify-center">
            <svg viewBox="0 0 120 80" className="h-full w-full">
              <path
                d="M10 40 Q 35 10, 60 40 T 110 40"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                className="form-guide-arc"
              />
              <circle r="5" fill="var(--accent)" className="form-guide-dot">
                <animateMotion
                  dur="2.4s"
                  repeatCount="indefinite"
                  path="M10 40 Q 35 10, 60 40 T 110 40"
                />
              </circle>
            </svg>
            <span className="label-caps absolute bottom-2 left-3">
              tempo · {rest}s rest
            </span>
          </div>
          <ul className="space-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <li>• Control the negative for ~2s, explode up.</li>
            <li>• Full range of motion — no half reps on {name}.</li>
            <li>• Brace your core, keep tension through the set.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
