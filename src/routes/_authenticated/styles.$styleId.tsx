import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, SectionTitle } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { getStyle } from "@/lib/style-library";
import { todayISO } from "@/lib/nutrition";
import { currentUserId, useInvalidate, useProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/styles/$styleId")({
  head: ({ params }) => {
    const style = getStyle(params.styleId);
    const title = style ? `${style.name} — NutrientLens` : "Style — NutrientLens";
    const description = style
      ? `${style.vibe} Full day-by-day breakdown with exercises, sets, reps and rest times.`
      : "Training style breakdown.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => {
    const style = getStyle(params.styleId);
    if (!style) throw notFound();
    return { styleId: params.styleId };
  },
  notFoundComponent: () => (
    <AppShell title="Not found" subtitle="Unknown style">
      <p className="text-sm text-muted-foreground">
        That training style doesn't exist.
      </p>
      <Link to="/styles" className="mt-4 block">
        <Button size="lg">Back to library</Button>
      </Link>
    </AppShell>
  ),
  component: StyleDetail,
});

function StyleDetail() {
  const { styleId } = Route.useParams();
  const style = getStyle(styleId)!;
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();
  const favorites = profile?.favorite_styles ?? [];
  const fav = favorites.includes(style.id);

  async function toggleFavorite() {
    const next = fav
      ? favorites.filter((f) => f !== style.id)
      : [...favorites, style.id];
    const userId = await currentUserId();
    const { error } = await supabase
      .from("profiles")
      .update({ favorite_styles: next })
      .eq("id", userId);
    if (error) return toast.error(error.message);
    invalidate(["profile"]);
  }

  async function loadDay(dayIndex: number) {
    const day = style.days[dayIndex];
    try {
      const user_id = await currentUserId();
      const date = todayISO();
      const { data: row, error } = await supabase
        .from("workout_sessions")
        .upsert(
          {
            user_id,
            session_date: date,
            style_id: style.id,
            style_name: style.name,
            day_label: day.focus,
            muscle_groups: day.muscles,
          },
          { onConflict: "user_id,session_date" },
        )
        .select()
        .single();
      if (error) throw error;
      await supabase.from("exercise_logs").delete().eq("session_id", row.id);
      const { error: insErr } = await supabase.from("exercise_logs").insert(
        day.exercises.map((e, i) => ({
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
      invalidate(["session", "session-history", "all-exercise-logs"]);
      toast.success(`${day.focus} loaded for today`);
      navigate({ to: "/workout" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load day");
    }
  }

  return (
    <AppShell
      title={style.name.replace(" Style", "")}
      subtitle={style.tag}
      action={
        <button aria-label="Favorite" onClick={toggleFavorite}>
          <Star
            className={`h-6 w-6 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        </button>
      }
    >
      <Link to="/styles" className="label-caps mb-3 flex items-center gap-1 text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Library
      </Link>

      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-elevated text-3xl">
            {style.icon}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold uppercase">{style.name}</h2>
            <p className="label-caps">{style.intensity}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{style.vibe}</p>
      </Card>

      <SectionTitle>The week</SectionTitle>

      <div className="space-y-3">
        {style.days.map((day, i) => (
          <Card key={day.label}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="label-caps text-primary">{day.label}</p>
                <h3 className="truncate text-lg font-bold uppercase">
                  {day.focus}
                </h3>
              </div>
              <Button size="sm" onClick={() => loadDay(i)}>
                Use today
              </Button>
            </div>
            <ul className="mt-4 space-y-2 border-t border-border pt-3">
              {day.exercises.map((e) => (
                <li key={e.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="label-caps">
                      {e.muscle} · rest {e.rest}s
                    </p>
                  </div>
                  <span className="numeric shrink-0 text-base">
                    {e.sets}
                    <span className="text-muted-foreground"> × </span>
                    {e.reps}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
