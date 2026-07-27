import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  MacroBar,
  SectionTitle,
  Stat,
} from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/nutrition";
import { currentUserId, useFoodLogs, useInvalidate, useProfile } from "@/lib/queries";
import { analyzeFoodPhoto } from "@/lib/ai.functions";
import { FOOD_DB } from "@/lib/food-db";

export const Route = createFileRoute("/_authenticated/food")({
  head: () => ({
    meta: [
      { title: "Log Food — NutrientLens" },
      {
        name: "description",
        content:
          "Scan a meal photo for instant AI macro estimates, or search and quick-add foods with full protein, carb and fat breakdowns.",
      },
      { property: "og:title", content: "Log Food — NutrientLens" },
      {
        property: "og:description",
        content: "AI photo scanning and fast manual macro logging.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FoodPage,
});

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

type Draft = {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
};

function FoodPage() {
  const date = todayISO();
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();
  const { data: foods } = useFoodLogs(date);
  const fileRef = useRef<HTMLInputElement>(null);

  const [meal, setMeal] = useState<string>("lunch");
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () =>
      (foods ?? []).reduce(
        (a, f) => ({
          calories: a.calories + Number(f.calories),
          protein: a.protein + Number(f.protein),
          carbs: a.carbs + Number(f.carbs),
          fat: a.fat + Number(f.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [foods],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return FOOD_DB.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const result = await analyzeFoodPhoto({
        data: { imageDataUrl: dataUrl },
      });
      setDraft({ ...result, source: "scan" });
      toast.success(`Scanned: ${result.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const user_id = await currentUserId();
      const { error } = await supabase.from("food_logs").insert({
        user_id,
        log_date: date,
        meal,
        name: draft.name,
        quantity: draft.quantity,
        calories: draft.calories,
        protein: draft.protein,
        carbs: draft.carbs,
        fat: draft.fat,
        source: draft.source,
      });
      if (error) throw error;
      setDraft(null);
      setQuery("");
      invalidate(["food", "weekly-intake"]);
      toast.success("Logged");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate(["food", "weekly-intake"]);
  }

  return (
    <AppShell title="Log Food" subtitle="Today's intake">
      <Card>
        <div className="grid grid-cols-4 gap-3">
          <Stat tone="primary" value={Math.round(totals.calories)} label="kcal" />
          <Stat value={Math.round(totals.protein)} unit="g" label="Protein" />
          <Stat value={Math.round(totals.carbs)} unit="g" label="Carbs" />
          <Stat value={Math.round(totals.fat)} unit="g" label="Fat" />
        </div>
        <div className="mt-4 space-y-2.5 border-t border-border pt-4">
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
      </Card>

      <div className="mt-4">
        <SectionTitle>Meal</SectionTitle>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {MEALS.map((m) => (
            <Chip key={m} active={meal === m} onClick={() => setMeal(m)}>
              {m}
            </Chip>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhoto}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={scanning}
        className="heat mt-4 flex w-full items-center justify-between rounded-2xl px-5 py-5 text-left shadow-[var(--shadow-glow)] disabled:opacity-70"
      >
        <div>
          <p className="font-display text-xl font-bold uppercase tracking-wide">
            {scanning ? "Analysing…" : "AI Food Scanner"}
          </p>
          <p className="text-sm opacity-80">
            {scanning ? "Reading your plate" : "Snap a photo, get macros"}
          </p>
        </div>
        {scanning ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <Camera className="h-7 w-7" />
        )}
      </button>

      <div className="mt-4">
        <SectionTitle>Search & quick add</SectionTitle>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chicken breast, oats, whey…"
            className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-2 space-y-2">
            {results.map((f) => (
              <li key={f.name}>
                <button
                  onClick={() =>
                    setDraft({
                      name: f.name,
                      quantity: f.serving,
                      calories: f.calories,
                      protein: f.protein,
                      carbs: f.carbs,
                      fat: f.fat,
                      source: "search",
                    })
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-elevated px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.serving}</p>
                  </div>
                  <span className="numeric shrink-0 text-lg text-primary">
                    {f.calories}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            setDraft({
              name: query || "Custom food",
              quantity: "1 serving",
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              source: "manual",
            })
          }
        >
          Add custom
        </Button>
      </div>

      <div className="mt-6">
        <SectionTitle>Today's log</SectionTitle>
        {foods && foods.length > 0 ? (
          <ul className="space-y-2">
            {foods.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.meal} · {f.quantity} · P{Math.round(f.protein)} C
                    {Math.round(f.carbs)} F{Math.round(f.fat)}
                  </p>
                </div>
                <span className="numeric shrink-0 text-lg text-primary">
                  {Math.round(f.calories)}
                </span>
                <button
                  aria-label="Delete entry"
                  onClick={() => remove(f.id)}
                  className="shrink-0 text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing logged yet today.</Empty>
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 flex items-end bg-background/80 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-lg rounded-t-3xl border-t border-border bg-card p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold uppercase">Confirm entry</h3>
              <button aria-label="Close" onClick={() => setDraft(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <Field
                label="Food"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <Field
                label="Quantity"
                value={draft.quantity}
                onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
              />
              <div className="grid grid-cols-4 gap-2">
                {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
                  <Field
                    key={k}
                    label={k === "calories" ? "kcal" : k.slice(0, 4)}
                    inputMode="numeric"
                    value={String(draft[k])}
                    onChange={(e) =>
                      setDraft({ ...draft, [k]: Number(e.target.value) || 0 })
                    }
                  />
                ))}
              </div>
              <Button size="lg" disabled={saving} onClick={saveDraft}>
                {saving ? "Saving…" : `Add to ${meal}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
