import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Chip, Field, Stat } from "@/components/ui-kit";
import {
  ACTIVITY_LEVELS,
  GOALS,
  calculateTargets,
  type Goal,
} from "@/lib/nutrition";
import { ATHLETE_STYLES } from "@/lib/style-library";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set your targets — NutrientLens" },
      {
        name: "description",
        content:
          "Set your goal, body stats and activity level to generate personalised daily calorie and macro targets.",
      },
      { property: "og:title", content: "Set your targets — NutrientLens" },
      {
        property: "og:description",
        content: "Build your personalised macro plan in under two minutes.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("maintain");
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("180");
  const [weight, setWeight] = useState("80");
  const [activity, setActivity] = useState("moderate");
  const [busy, setBusy] = useState(false);

  const targets = useMemo(
    () =>
      calculateTargets({
        sex,
        age: Number(age) || 25,
        heightCm: Number(height) || 180,
        weightKg: Number(weight) || 80,
        activity,
        goal,
      }),
    [sex, age, height, weight, activity, goal],
  );

  async function finish() {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").upsert({
        id: auth.user.id,
        goal,
        sex,
        age: Number(age) || 25,
        height_cm: Number(height) || 180,
        weight_kg: Number(weight) || 80,
        activity_level: activity,
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carb_target: targets.carbs,
        fat_target: targets.fat,
        water_target_ml: targets.water,
        onboarded: true,
      });
      if (error) throw error;
      await supabase.from("weight_logs").insert({
        user_id: auth.user.id,
        weight_kg: Number(weight) || 80,
      });
      toast.success("Targets locked in. Let's work.");
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg px-6 py-10">
      <div className="mb-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      {step === 0 && (
        <section>
          <p className="label-caps text-primary">Step 1</p>
          <h1 className="mt-2 text-4xl font-bold uppercase">What's the mission?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This sets your calorie and protein strategy.
          </p>
          <div className="mt-6 space-y-3">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`surface flex w-full items-center justify-between p-4 text-left transition-colors ${
                  goal === g.id ? "border-primary" : ""
                }`}
              >
                <div>
                  <p className="font-display text-xl font-semibold uppercase">
                    {g.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{g.blurb}</p>
                </div>
                <span
                  className={`h-5 w-5 rounded-full border-2 ${
                    goal === g.id ? "border-primary bg-primary" : "border-border"
                  }`}
                />
              </button>
            ))}
          </div>
          <Button className="mt-8" size="lg" onClick={() => setStep(1)}>
            Continue
          </Button>
        </section>
      )}

      {step === 1 && (
        <section>
          <p className="label-caps text-primary">Step 2</p>
          <h1 className="mt-2 text-4xl font-bold uppercase">Your stats</h1>
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              {["male", "female"].map((s) => (
                <Chip key={s} active={sex === s} onClick={() => setSex(s)}>
                  {s}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Age"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <Field
                label="Height"
                suffix="cm"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              <Field
                label="Weight"
                suffix="kg"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <p className="label-caps mb-2">Activity level</p>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                      activity === a.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-elevated"
                    }`}
                  >
                    <span className="font-display text-sm font-semibold uppercase tracking-wide">
                      {a.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(2)}>
              See my targets
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <p className="label-caps text-primary">Step 3</p>
          <h1 className="mt-2 text-4xl font-bold uppercase">Your daily targets</h1>
          <Card className="mt-6">
            <p className="numeric text-6xl text-primary">{targets.calories}</p>
            <p className="label-caps mt-1">kcal per day</p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <Stat value={targets.protein} unit="g" label="Protein" />
              <Stat value={targets.carbs} unit="g" label="Carbs" />
              <Stat value={targets.fat} unit="g" label="Fat" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Water goal {targets.water} ml · fully editable later.
            </p>
          </Card>

          <Card className="mt-4">
            <p className="label-caps text-primary">Next up</p>
            <h2 className="mt-1 text-2xl font-bold uppercase">Style Library</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every training day you pick a style to follow — {ATHLETE_STYLES.length}{" "}
              archetypes from high-volume arm blasts to max-effort strongman work.
              Mix and match freely.
            </p>
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
              {ATHLETE_STYLES.slice(0, 6).map((s) => (
                <span
                  key={s.id}
                  className="label-caps shrink-0 rounded-full border border-border bg-elevated px-3 py-1.5"
                >
                  {s.icon} {s.name.replace(" Style", "")}
                </span>
              ))}
            </div>
          </Card>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" disabled={busy} onClick={finish}>
              {busy ? "Saving…" : "Let's go"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
