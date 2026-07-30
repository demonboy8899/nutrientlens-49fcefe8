import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Chip, Empty, Field, SectionTitle } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/nutrition";
import {
  currentUserId,
  useInvalidate,
  useWorkoutPlans,
  type PlanExerciseRow,
  type WorkoutPlan,
} from "@/lib/queries";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from "@/lib/style-library";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({
    meta: [
      { title: "My Workout Plans — NutrientLens" },
      {
        name: "description",
        content:
          "Build your own named workout plans, add exercises with target sets and reps, reorder them and load a saved plan into any training day.",
      },
      { property: "og:title", content: "My Workout Plans — NutrientLens" },
      {
        property: "og:description",
        content: "Create, edit and reuse your own workout templates.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { data: plans, isLoading } = useWorkoutPlans();
  const [editing, setEditing] = useState<WorkoutPlan | "new" | null>(null);

  async function loadIntoToday(plan: WorkoutPlan) {
    try {
      const user_id = await currentUserId();
      const date = todayISO();
      const { data: row, error } = await supabase
        .from("workout_sessions")
        .upsert(
          {
            user_id,
            session_date: date,
            style_id: `plan:${plan.id}`,
            style_name: plan.name,
            day_label: plan.name,
            muscle_groups: [...new Set(plan.exercises.map((e) => e.muscle))],
          },
          { onConflict: "user_id,session_date" },
        )
        .select()
        .single();
      if (error) throw error;

      await supabase.from("exercise_logs").delete().eq("session_id", row.id);
      if (plan.exercises.length > 0) {
        const { error: insErr } = await supabase.from("exercise_logs").insert(
          plan.exercises.map((e, i) => ({
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
          })),
        );
        if (insErr) throw insErr;
      }
      invalidate(["session", "session-history", "all-exercise-logs"]);
      toast.success(`${plan.name} loaded into today`);
      navigate({ to: "/workout" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load plan");
    }
  }

  async function deletePlan(id: string) {
    const { error } = await supabase.from("workout_plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate(["workout-plans"]);
    toast.success("Plan deleted");
  }

  return (
    <AppShell
      title="My Plans"
      subtitle="Your own reusable workouts"
      action={
        <button
          aria-label="New plan"
          onClick={() => setEditing("new")}
          className="rounded-full border border-primary/50 bg-primary/10 p-2.5 text-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <Button size="lg" onClick={() => setEditing("new")}>
        <Plus className="h-4 w-4" /> New plan
      </Button>

      <SectionTitle>Saved plans</SectionTitle>

      {isLoading ? (
        <Empty>Loading plans…</Empty>
      ) : !plans || plans.length === 0 ? (
        <Empty>
          No plans yet. Build one — name it "Push Day", add exercises, save and
          reuse it any day.
        </Empty>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Card>
                <div className="flex items-start gap-3">
                  <ClipboardList className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold uppercase">
                      {plan.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {plan.exercises.length} exercises ·{" "}
                      {plan.exercises.reduce((s, e) => s + (e.sets || 0), 0)} sets
                    </p>
                    {plan.notes ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {plan.notes}
                      </p>
                    ) : null}
                  </div>
                  <button
                    aria-label={`Delete ${plan.name}`}
                    onClick={() => deletePlan(plan.id)}
                    className="shrink-0 text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...new Set(plan.exercises.map((e) => e.muscle))].map((m) => (
                    <span
                      key={m}
                      className="label-caps rounded-full border border-border px-2 py-1"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => loadIntoToday(plan)}>
                    <Play className="h-4 w-4" /> Use today
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(plan)}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <PlanEditor
          plan={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate(["workout-plans"]);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function PlanEditor({
  plan,
  onClose,
  onSaved,
}: {
  plan: WorkoutPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [notes, setNotes] = useState(plan?.notes ?? "");
  const [rows, setRows] = useState<PlanExerciseRow[]>(plan?.exercises ?? []);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<PlanExerciseRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function move(i: number, dir: -1 | 1) {
    setRows((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    if (!name.trim()) return toast.error("Give your plan a name");
    if (rows.length === 0) return toast.error("Add at least one exercise");
    setSaving(true);
    try {
      const user_id = await currentUserId();
      const payload = {
        user_id,
        name: name.trim(),
        notes: notes.trim() || null,
        exercises: rows as unknown as never,
      };
      const { error } = plan
        ? await supabase.from("workout_plans").update(payload).eq("id", plan.id)
        : await supabase.from("workout_plans").insert(payload);
      if (error) throw error;
      toast.success(plan ? "Plan updated" : "Plan saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold uppercase">
            {plan ? "Edit plan" : "New plan"}
          </h3>
          <button aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <Field
            label="Plan name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push Day"
          />
          <Field
            label="Note (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Heavy chest + triceps"
          />
        </div>

        <SectionTitle
          right={
            <button
              onClick={() => setPicking(true)}
              className="label-caps text-primary"
            >
              + Add exercise
            </button>
          }
        >
          Exercises
        </SectionTitle>

        {rows.length === 0 ? (
          <Empty>No exercises yet — add your first one.</Empty>
        ) : (
          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li
                key={`${row.name}-${i}`}
                className="rounded-xl border border-border bg-elevated p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold uppercase tracking-wide">
                      {row.name}
                    </p>
                    <p className="label-caps mt-0.5">{row.muscle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      aria-label="Move up"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Move down"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label={`Remove ${row.name}`}
                      onClick={() =>
                        setRows((r) => r.filter((_, idx) => idx !== i))
                      }
                      className="rounded-lg border border-border p-1.5 text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Field
                    label="Sets"
                    type="number"
                    min={1}
                    value={row.sets}
                    onChange={(e) =>
                      update(i, { sets: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                  <Field
                    label="Reps"
                    value={row.reps}
                    onChange={(e) => update(i, { reps: e.target.value })}
                  />
                  <Field
                    label="Rest"
                    type="number"
                    min={0}
                    suffix="s"
                    value={row.rest}
                    onChange={(e) =>
                      update(i, { rest: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <Button size="lg" disabled={saving} onClick={save}>
            {saving ? "Saving…" : plan ? "Save changes" : "Save plan"}
          </Button>
        </div>

        {picking ? (
          <ExercisePicker
            onClose={() => setPicking(false)}
            onPick={(name2, muscle) => {
              setRows((r) => [
                ...r,
                { name: name2, muscle, sets: 3, reps: "8-12", rest: 90 },
              ]);
              setPicking(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function ExercisePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (name: string, muscle: string) => void;
}) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string>("all");

  const list = useMemo(
    () =>
      EXERCISE_LIBRARY.filter(
        (e) =>
          (muscle === "all" || e.muscle === muscle) &&
          e.name.toLowerCase().includes(q.trim().toLowerCase()),
      ).slice(0, 40),
    [q, muscle],
  );

  const custom = q.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/85 backdrop-blur-sm">
      <div className="mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold uppercase">Add exercise</h3>
          <button aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <Field
          placeholder="Search or type your own"
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
          {custom.length > 1 &&
          !list.some((e) => e.name.toLowerCase() === custom.toLowerCase()) ? (
            <li>
              <button
                onClick={() =>
                  onPick(custom, muscle === "all" ? "other" : muscle)
                }
                className="flex w-full items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-left"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-primary">
                  Add "{custom}"
                </span>
                <Plus className="h-4 w-4 shrink-0 text-primary" />
              </button>
            </li>
          ) : null}
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
        </ul>
      </div>
    </div>
  );
}
