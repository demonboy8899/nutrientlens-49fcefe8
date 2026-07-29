import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LogOut, X } from "lucide-react";
import { Button, Field } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useInvalidate, useProfile } from "@/lib/queries";

const ACCENTS = [
  { id: "cyan", label: "Cyan", value: "oklch(0.72 0.16 233)" },
  { id: "gold", label: "Gold", value: "oklch(0.79 0.15 65)" },
  { id: "violet", label: "Violet", value: "oklch(0.66 0.19 300)" },
  { id: "lime", label: "Lime", value: "oklch(0.79 0.19 130)" },
] as const;

const ACCENT_KEY = "nl-accent";

export function applyStoredAccent() {
  if (typeof window === "undefined") return;
  const id = window.localStorage.getItem(ACCENT_KEY);
  const found = ACCENTS.find((a) => a.id === id);
  if (found) document.documentElement.style.setProperty("--primary", found.value);
}

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();

  const [form, setForm] = useState({
    display_name: "",
    calorie_target: "",
    protein_target: "",
    carb_target: "",
    fat_target: "",
    water_target_ml: "",
  });
  const [accent, setAccent] = useState<string>("cyan");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      calorie_target: String(profile.calorie_target ?? ""),
      protein_target: String(profile.protein_target ?? ""),
      carb_target: String(profile.carb_target ?? ""),
      fat_target: String(profile.fat_target ?? ""),
      water_target_ml: String(profile.water_target_ml ?? ""),
    });
  }, [profile]);

  useEffect(() => {
    const stored = window.localStorage.getItem(ACCENT_KEY);
    if (stored && ACCENTS.some((a) => a.id === stored)) setAccent(stored);
  }, []);

  function pickAccent(id: string) {
    const found = ACCENTS.find((a) => a.id === id);
    if (!found) return;
    setAccent(id);
    window.localStorage.setItem(ACCENT_KEY, id);
    document.documentElement.style.setProperty("--primary", found.value);
  }

  async function save() {
    setSaving(true);
    try {
      const id = await currentUserId();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name.trim() || null,
          calorie_target: Number(form.calorie_target) || 0,
          protein_target: Number(form.protein_target) || 0,
          carb_target: Number(form.carb_target) || 0,
          fat_target: Number(form.fat_target) || 0,
          water_target_ml: Number(form.water_target_ml) || 0,
        })
        .eq("id", id);
      if (error) throw error;
      invalidate(["profile"]);
      toast.success("Profile updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold uppercase">Profile &amp; settings</h3>
          <button aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <Field
            label="Display name"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="Your name"
          />
          <Field
            label="Calorie target"
            type="number"
            inputMode="numeric"
            suffix="kcal"
            value={form.calorie_target}
            onChange={(e) => setForm({ ...form, calorie_target: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <Field
              label="Protein"
              type="number"
              inputMode="numeric"
              suffix="g"
              value={form.protein_target}
              onChange={(e) => setForm({ ...form, protein_target: e.target.value })}
            />
            <Field
              label="Carbs"
              type="number"
              inputMode="numeric"
              suffix="g"
              value={form.carb_target}
              onChange={(e) => setForm({ ...form, carb_target: e.target.value })}
            />
            <Field
              label="Fat"
              type="number"
              inputMode="numeric"
              suffix="g"
              value={form.fat_target}
              onChange={(e) => setForm({ ...form, fat_target: e.target.value })}
            />
          </div>
          <Field
            label="Water target"
            type="number"
            inputMode="numeric"
            suffix="ml"
            value={form.water_target_ml}
            onChange={(e) => setForm({ ...form, water_target_ml: e.target.value })}
          />
          <Button size="lg" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="mt-6 rounded-xl border border-border p-4">
          <p className="label-caps mb-3">Accent colour</p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                aria-label={a.label}
                aria-pressed={accent === a.id}
                onClick={() => pickAccent(a.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  accent === a.id
                    ? "border-primary text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: a.value }}
                />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
