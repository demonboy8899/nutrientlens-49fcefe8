export type Goal = "cut" | "bulk" | "maintain";

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", factor: 1.2, hint: "Desk job, little training" },
  { id: "light", label: "Light", factor: 1.375, hint: "1-2 sessions / week" },
  { id: "moderate", label: "Moderate", factor: 1.55, hint: "3-5 sessions / week" },
  { id: "high", label: "High", factor: 1.725, hint: "6-7 sessions / week" },
  { id: "athlete", label: "Athlete", factor: 1.9, hint: "2-a-days, physical job" },
] as const;

export const GOALS: { id: Goal; label: string; blurb: string }[] = [
  { id: "cut", label: "Cut", blurb: "Strip fat, hold muscle" },
  { id: "maintain", label: "Maintain", blurb: "Recomp and perform" },
  { id: "bulk", label: "Bulk", blurb: "Build size, add strength" },
];

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
};

export function calculateTargets(input: {
  sex: string;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: string;
  goal: Goal;
}): MacroTargets {
  const { sex, age, heightCm, weightKg, activity, goal } = input;
  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "female" ? -161 : 5);
  const factor =
    ACTIVITY_LEVELS.find((a) => a.id === activity)?.factor ?? 1.55;
  const tdee = bmr * factor;
  const adjusted =
    goal === "cut" ? tdee * 0.8 : goal === "bulk" ? tdee * 1.12 : tdee;

  const calories = Math.round(adjusted / 10) * 10;
  const proteinPerKg = goal === "cut" ? 2.4 : goal === "bulk" ? 2.0 : 2.2;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * (goal === "cut" ? 0.25 : 0.27)) / 9);
  const carbs = Math.max(
    0,
    Math.round((calories - protein * 4 - fat * 9) / 4),
  );
  const water = Math.round((weightKg * 40) / 100) * 100;

  return { calories, protein, carbs, fat, water };
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isoOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const shortDay = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
