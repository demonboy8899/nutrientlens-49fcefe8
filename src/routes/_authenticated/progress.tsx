import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Camera, ImageOff } from "lucide-react";
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
import { todayISO } from "@/lib/nutrition";
import {
  currentUserId,
  useInvalidate,
  useMeasurements,
  useProfile,
  useWeightLogs,
} from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — NutrientLens" },
      {
        name: "description",
        content:
          "Track body weight, tape measurements and private progress photos with side-by-side comparison over time.",
      },
      { property: "og:title", content: "Progress — NutrientLens" },
      {
        property: "og:description",
        content: "Weight graphs, measurements and progress photo comparison.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgressPage,
});

const POSES = ["front", "side", "back"] as const;
const MEASURE_FIELDS = [
  { key: "arms_cm", label: "Arms" },
  { key: "chest_cm", label: "Chest" },
  { key: "waist_cm", label: "Waist" },
  { key: "glutes_cm", label: "Glutes" },
  { key: "thighs_cm", label: "Thighs" },
] as const;

function ProgressPage() {
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();
  const { data: weights } = useWeightLogs();
  const { data: measurements } = useMeasurements();
  const [tab, setTab] = useState<"weight" | "measure" | "photos">("weight");
  const [weight, setWeight] = useState("");
  const [pose, setPose] = useState<(typeof POSES)[number]>("front");
  const [measure, setMeasure] = useState<Record<string, string>>({});
  const [compare, setCompare] = useState(50);
  const fileRef = useRef<HTMLInputElement>(null);

  const photos = useQuery({
    queryKey: ["photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .order("log_date", { ascending: true });
      if (error) throw error;
      const withUrls = await Promise.all(
        (data ?? []).map(async (p) => {
          const { data: signed } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { ...p, url: signed?.signedUrl ?? "" };
        }),
      );
      return withUrls;
    },
  });

  const posePhotos = useMemo(
    () => (photos.data ?? []).filter((p) => p.pose === pose),
    [photos.data, pose],
  );

  const first = posePhotos[0];
  const latest = posePhotos[posePhotos.length - 1];

  const weightData = (weights ?? []).map((w) => ({
    date: w.log_date.slice(5),
    kg: Number(w.weight_kg),
  }));

  const measureData = (measurements ?? []).map((m) => ({
    date: m.log_date.slice(5),
    ...Object.fromEntries(
      MEASURE_FIELDS.map((f) => [f.label, m[f.key] ? Number(m[f.key]) : null]),
    ),
  }));

  const latestWeight = weights?.[weights.length - 1]?.weight_kg;
  const startWeight = weights?.[0]?.weight_kg;
  const change =
    latestWeight != null && startWeight != null
      ? Number(latestWeight) - Number(startWeight)
      : 0;

  async function logWeight() {
    const kg = Number(weight);
    if (!kg) return toast.error("Enter a weight");
    const user_id = await currentUserId();
    const { error } = await supabase
      .from("weight_logs")
      .insert({ user_id, weight_kg: kg, log_date: todayISO() });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ weight_kg: kg }).eq("id", user_id);
    setWeight("");
    invalidate(["weights", "profile"]);
    toast.success("Weight logged");
  }

  async function logMeasurements() {
    const user_id = await currentUserId();
    const payload = {
      user_id,
      log_date: todayISO(),
      arms_cm: Number(measure.arms_cm) || null,
      chest_cm: Number(measure.chest_cm) || null,
      waist_cm: Number(measure.waist_cm) || null,
      glutes_cm: Number(measure.glutes_cm) || null,
      thighs_cm: Number(measure.thighs_cm) || null,
    };
    const { error } = await supabase.from("measurements").insert(payload);
    if (error) return toast.error(error.message);
    setMeasure({});
    invalidate(["measurements"]);
    toast.success("Measurements saved");
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const user_id = await currentUserId();
      const path = `${user_id}/${Date.now()}-${pose}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("progress_photos").insert({
        user_id,
        pose,
        storage_path: path,
        log_date: todayISO(),
      });
      if (error) throw error;
      photos.refetch();
      toast.success("Photo saved privately");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <AppShell title="Progress" subtitle={`Goal: ${profile?.goal ?? "maintain"}`}>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <Chip active={tab === "weight"} onClick={() => setTab("weight")}>
          Body weight
        </Chip>
        <Chip active={tab === "measure"} onClick={() => setTab("measure")}>
          Measurements
        </Chip>
        <Chip active={tab === "photos"} onClick={() => setTab("photos")}>
          Photos
        </Chip>
      </div>

      {tab === "weight" && (
        <>
          <Card className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat
                tone="primary"
                value={latestWeight ? Number(latestWeight).toFixed(1) : "—"}
                unit="kg"
                label="Current"
              />
              <Stat
                value={startWeight ? Number(startWeight).toFixed(1) : "—"}
                unit="kg"
                label="Start"
              />
              <Stat
                tone="accent"
                value={`${change > 0 ? "+" : ""}${change.toFixed(1)}`}
                unit="kg"
                label="Change"
              />
            </div>
            <div className="mt-4 h-44 border-t border-border pt-4">
              {weightData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={["dataMin - 2", "dataMax + 2"]}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="kg"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty>Log twice to see your trend.</Empty>
              )}
            </div>
          </Card>

          <Card className="mt-4">
            <SectionTitle>Log today's weight</SectionTitle>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Field
                  suffix="kg"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <Button onClick={logWeight}>Save</Button>
            </div>
          </Card>
        </>
      )}

      {tab === "measure" && (
        <>
          <Card className="mt-4">
            <SectionTitle>Tape measure (cm)</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {MEASURE_FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  inputMode="decimal"
                  value={measure[f.key] ?? ""}
                  onChange={(e) =>
                    setMeasure({ ...measure, [f.key]: e.target.value })
                  }
                />
              ))}
            </div>
            <Button className="mt-4" size="lg" onClick={logMeasurements}>
              Save measurements
            </Button>
          </Card>

          <Card className="mt-4">
            <SectionTitle>Trend</SectionTitle>
            <div className="h-52">
              {measureData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={measureData}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    {MEASURE_FIELDS.map((f, i) => (
                      <Line
                        key={f.key}
                        type="monotone"
                        dataKey={f.label}
                        stroke={`var(--chart-${(i % 5) + 1})`}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty>Log measurements twice to see trends.</Empty>
              )}
            </div>
          </Card>
        </>
      )}

      {tab === "photos" && (
        <>
          <div className="mt-4 flex gap-2">
            {POSES.map((p) => (
              <Chip key={p} active={pose === p} onClick={() => setPose(p)}>
                {p}
              </Chip>
            ))}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={uploadPhoto}
          />

          <Button
            className="mt-4"
            size="lg"
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="h-4 w-4" /> Add {pose} photo
          </Button>

          <Card className="mt-4">
            <SectionTitle>Compare</SectionTitle>
            {first && latest && first.id !== latest.id ? (
              <>
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-elevated">
                  <img
                    src={first.url}
                    alt={`Earliest ${pose} progress photo`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-y-0 right-0 overflow-hidden"
                    style={{ width: `${100 - compare}%` }}
                  >
                    <img
                      src={latest.url}
                      alt={`Latest ${pose} progress photo`}
                      className="absolute inset-y-0 right-0 h-full object-cover"
                      style={{ width: `${(100 / (100 - compare)) * 100}%` }}
                    />
                  </div>
                  <div
                    className="absolute inset-y-0 w-0.5 bg-primary"
                    style={{ left: `${compare}%` }}
                  />
                  <span className="label-caps absolute bottom-2 left-2 rounded bg-background/70 px-2 py-1">
                    {first.log_date}
                  </span>
                  <span className="label-caps absolute right-2 bottom-2 rounded bg-background/70 px-2 py-1">
                    {latest.log_date}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={compare}
                  aria-label="Comparison slider"
                  onChange={(e) => setCompare(Number(e.target.value))}
                  className="mt-4 w-full accent-[var(--primary)]"
                />
              </>
            ) : (
              <Empty>
                <ImageOff className="mx-auto mb-2 h-5 w-5" />
                Upload at least two {pose} photos to compare.
              </Empty>
            )}
          </Card>

          {posePhotos.length > 0 && (
            <div className="mt-4">
              <SectionTitle>All {pose} photos</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                {posePhotos.map((p) => (
                  <figure key={p.id} className="overflow-hidden rounded-xl">
                    <img
                      src={p.url}
                      alt={`${pose} progress photo ${p.log_date}`}
                      className="aspect-3/4 w-full object-cover"
                    />
                    <figcaption className="label-caps mt-1 text-center">
                      {p.log_date.slice(5)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
