import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isoOffset, todayISO } from "@/lib/nutrition";

export type Profile = {
  id: string;
  display_name: string | null;
  goal: string;
  sex: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  water_target_ml: number;
  favorite_styles: string[];
  onboarded: boolean;
};

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => {
      const id = await currentUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export type FoodLog = {
  id: string;
  name: string;
  meal: string;
  quantity: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  log_date: string;
};

export function useFoodLogs(date: string) {
  return useQuery({
    queryKey: ["food", date],
    queryFn: async (): Promise<FoodLog[]> => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("log_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FoodLog[];
    },
  });
}

export function useWater(date: string) {
  return useQuery({
    queryKey: ["water", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("log_date", date);
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    },
  });
}

export function useWeeklyIntake() {
  const from = isoOffset(-6);
  return useQuery({
    queryKey: ["weekly-intake", from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("log_date, calories")
        .gte("log_date", from)
        .lte("log_date", todayISO());
      if (error) throw error;
      const map = new Map<string, number>();
      for (let i = -6; i <= 0; i++) map.set(isoOffset(i), 0);
      for (const row of data ?? []) {
        map.set(row.log_date, (map.get(row.log_date) ?? 0) + Number(row.calories));
      }
      return [...map.entries()].map(([date, calories]) => ({ date, calories }));
    },
  });
}

export function useWeightLogs() {
  return useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_logs")
        .select("id, log_date, weight_kg")
        .order("log_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMeasurements() {
  return useQuery({
    queryKey: ["measurements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measurements")
        .select("*")
        .order("log_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ExerciseSet = {
  reps: number | string;
  weight: number | string;
  done: boolean;
};

export type ExerciseLog = {
  id: string;
  session_id: string;
  exercise_name: string;
  muscle_group: string;
  position: number;
  target_sets: number;
  target_reps: string | null;
  rest_seconds: number;
  sets: ExerciseSet[];
};

export type WorkoutSession = {
  id: string;
  session_date: string;
  style_id: string | null;
  style_name: string | null;
  day_label: string | null;
  muscle_groups: string[];
  notes: string | null;
};

export function useSession(date: string) {
  return useQuery({
    queryKey: ["session", date],
    queryFn: async () => {
      const { data: session, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("session_date", date)
        .maybeSingle();
      if (error) throw error;
      if (!session) return { session: null, exercises: [] as ExerciseLog[] };
      const { data: exercises, error: exErr } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("session_id", session.id)
        .order("position", { ascending: true });
      if (exErr) throw exErr;
      return {
        session: session as WorkoutSession,
        exercises: (exercises ?? []) as unknown as ExerciseLog[],
      };
    },
  });
}

export function useSessionHistory(days = 42) {
  const from = isoOffset(-days);
  return useQuery({
    queryKey: ["session-history", from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id, session_date, style_id, style_name, day_label, muscle_groups")
        .gte("session_date", from)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WorkoutSession[];
    },
  });
}

export function useAllExerciseLogs() {
  return useQuery({
    queryKey: ["all-exercise-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_logs")
        .select(
          "id, exercise_name, muscle_group, sets, session_id, workout_sessions(session_date)",
        )
        .order("created_at", { ascending: false })
        .limit(600);
      if (error) throw error;
      return (data ?? []) as unknown as (ExerciseLog & {
        workout_sessions: { session_date: string } | null;
      })[];
    },
  });
}

export type PlanExerciseRow = {
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: number;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  notes: string | null;
  exercises: PlanExerciseRow[];
  updated_at: string;
};

export function useWorkoutPlans() {
  return useQuery({
    queryKey: ["workout-plans"],
    queryFn: async (): Promise<WorkoutPlan[]> => {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("id, name, notes, exercises, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WorkoutPlan[];
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (keys: string[]) =>
    keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
