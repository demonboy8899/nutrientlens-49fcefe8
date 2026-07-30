import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, ClipboardList, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Chip, SectionTitle } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { ATHLETE_STYLES } from "@/lib/style-library";
import { currentUserId, useInvalidate, useProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/styles/")({
  head: () => ({
    meta: [
      { title: "Athlete Style Library — NutrientLens" },
      {
        name: "description",
        content:
          "Browse nine lifter training archetypes — Sulek, David Laid, Arnold, powerbuilding, strongman, glute specialist and more — and follow any one on any day.",
      },
      { property: "og:title", content: "Athlete Style Library — NutrientLens" },
      {
        property: "og:description",
        content: "Nine training archetypes with full day-by-day breakdowns.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StylesPage,
});

function StylesPage() {
  const { data: profile } = useProfile();
  const invalidate = useInvalidate();
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const favorites = profile?.favorite_styles ?? [];

  async function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    const userId = await currentUserId();
    const { error } = await supabase
      .from("profiles")
      .update({ favorite_styles: next })
      .eq("id", userId);
    if (error) return toast.error(error.message);
    invalidate(["profile"]);
  }

  const list =
    filter === "favorites"
      ? ATHLETE_STYLES.filter((s) => favorites.includes(s.id))
      : ATHLETE_STYLES;

  return (
    <AppShell title="Style Library" subtitle="Follow any lifter, any day">
      <div className="flex gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All styles
        </Chip>
        <Chip
          active={filter === "favorites"}
          onClick={() => setFilter("favorites")}
        >
          ★ My favorites
        </Chip>
      </div>

      <Card className="mt-4">
        <Link to="/plans" className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-elevated text-accent">
            <ClipboardList className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="label-caps block text-accent">Your own</span>
            <span className="block truncate text-xl font-bold uppercase">
              My Plans
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Build editable workouts and reuse them any day
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
      </Card>

      <SectionTitle>{list.length} archetypes</SectionTitle>


      <ul className="space-y-3">
        {list.map((s) => {
          const fav = favorites.includes(s.id);
          return (
            <li key={s.id}>
              <Card className="relative">
                <button
                  aria-label={fav ? "Unfavorite" : "Favorite"}
                  onClick={() => toggleFavorite(s.id)}
                  className="absolute top-4 right-4 z-10"
                >
                  <Star
                    className={`h-5 w-5 ${
                      fav ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
                <Link
                  to="/styles/$styleId"
                  params={{ styleId: s.id }}
                  className="block"
                >
                  <div className="flex items-start gap-3 pr-8">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-elevated text-2xl">
                      {s.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="label-caps text-primary">{s.tag}</p>
                      <h3 className="truncate text-xl font-bold uppercase">
                        {s.name}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{s.vibe}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="label-caps">{s.intensity}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                      {s.days.length} days <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Card>
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No favorites yet — tap the star on any style.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
