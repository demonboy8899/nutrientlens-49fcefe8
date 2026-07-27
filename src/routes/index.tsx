import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Flame, ScanLine, Dumbbell, LineChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutrientLens — Scan Food, Track Lifts, Train Like Them" },
      {
        name: "description",
        content:
          "NutrientLens turns a photo into macros, logs every set with progressive overload tracking, and lets you follow any elite lifter's training style, any day.",
      },
      {
        property: "og:title",
        content: "NutrientLens — Scan Food, Track Lifts, Train Like Them",
      },
      {
        property: "og:description",
        content:
          "NutrientLens turns a photo into macros, logs every set with progressive overload tracking, and lets you follow any elite lifter's training style, any day.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: ScanLine, title: "Scan any meal", copy: "Photo in, macros out." },
  { icon: Dumbbell, title: "Log every set", copy: "Volume + PR tracking." },
  { icon: Flame, title: "Athlete styles", copy: "Train like the greats." },
  { icon: LineChart, title: "See progress", copy: "Weight, photos, tape." },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-between overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]"
      />

      <div className="relative">
        <p className="label-caps text-primary">Nutrient · Lens</p>
        <h1 className="mt-4 text-6xl leading-[0.9] font-bold uppercase">
          Fuel it.
          <br />
          <span className="text-primary">Lift it.</span>
          <br />
          Track it.
        </h1>
        <p className="mt-5 max-w-sm text-base text-muted-foreground">
          The macro scanner and training log built for people who actually go hard.
          Follow any lifter's style, any day of the week.
        </p>
      </div>

      <ul className="relative my-10 grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, title, copy }) => (
          <li key={title} className="surface p-4">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-display text-sm font-semibold uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
          </li>
        ))}
      </ul>

      <div className="relative space-y-3">
        <Link to="/auth">
          <Button size="lg">Start tracking</Button>
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Free to start · Your data stays yours
        </p>
      </div>
    </div>
  );
}
