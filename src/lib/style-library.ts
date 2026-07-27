export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "glutes"
  | "abs"
  | "full body"
  | "conditioning";

export type PlanExercise = {
  name: string;
  muscle: MuscleGroup;
  sets: number;
  reps: string;
  rest: number; // seconds
};

export type PlanDay = {
  label: string;
  focus: string;
  muscles: MuscleGroup[];
  exercises: PlanExercise[];
};

export type AthleteStyle = {
  id: string;
  name: string;
  tag: string;
  vibe: string;
  intensity: string;
  icon: string;
  days: PlanDay[];
};

const ex = (
  name: string,
  muscle: MuscleGroup,
  sets: number,
  reps: string,
  rest: number,
): PlanExercise => ({ name, muscle, sets, reps, rest });

export const ATHLETE_STYLES: AthleteStyle[] = [
  {
    id: "sulek",
    name: "Sulek Style",
    tag: "Volume Freak",
    vibe: "Insane volume, brutal frequency, arms and chest hammered with supersets, drop sets and almost no rest.",
    intensity: "Volume 10 · Rest 30–60s",
    icon: "🔥",
    days: [
      {
        label: "Day 1",
        focus: "Chest & Triceps Blitz",
        muscles: ["chest", "arms"],
        exercises: [
          ex("Incline Barbell Press", "chest", 6, "8-12", 60),
          ex("Flat Dumbbell Press", "chest", 5, "10-15", 45),
          ex("Cable Fly Superset w/ Push-Up", "chest", 5, "15-20", 30),
          ex("Dips (weighted)", "chest", 4, "12-15", 45),
          ex("Overhead Rope Extension", "arms", 5, "15-20", 30),
          ex("Cable Pushdown Drop Set", "arms", 4, "20+", 30),
        ],
      },
      {
        label: "Day 2",
        focus: "Back & Biceps Marathon",
        muscles: ["back", "arms"],
        exercises: [
          ex("Lat Pulldown", "back", 6, "10-15", 45),
          ex("Chest-Supported Row", "back", 5, "10-12", 60),
          ex("Straight-Arm Pulldown", "back", 4, "15-20", 30),
          ex("Barbell Curl", "arms", 6, "10-15", 30),
          ex("Incline DB Curl Superset w/ Hammer", "arms", 5, "15-20", 30),
          ex("Cable Curl Drop Set", "arms", 4, "20+", 30),
        ],
      },
      {
        label: "Day 3",
        focus: "Shoulders & Arms Pump",
        muscles: ["shoulders", "arms"],
        exercises: [
          ex("Seated DB Press", "shoulders", 5, "10-12", 60),
          ex("Lateral Raise (myo-reps)", "shoulders", 6, "15-25", 30),
          ex("Rear Delt Fly", "shoulders", 5, "15-20", 30),
          ex("EZ Bar Curl", "arms", 5, "12-15", 30),
          ex("Skullcrusher Superset w/ Close Grip", "arms", 5, "12-15", 30),
        ],
      },
      {
        label: "Day 4",
        focus: "Legs (still high volume)",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Hack Squat", "legs", 5, "10-15", 90),
          ex("Leg Press Drop Set", "legs", 4, "20+", 60),
          ex("Romanian Deadlift", "legs", 4, "10-12", 90),
          ex("Leg Extension Superset w/ Curl", "legs", 5, "15-20", 45),
          ex("Standing Calf Raise", "legs", 5, "15-20", 30),
        ],
      },
      {
        label: "Day 5",
        focus: "Arms & Chest Round Two",
        muscles: ["arms", "chest"],
        exercises: [
          ex("Machine Chest Press", "chest", 5, "12-15", 45),
          ex("Pec Deck Drop Set", "chest", 4, "20+", 30),
          ex("Preacher Curl", "arms", 5, "12-15", 30),
          ex("Dip Machine", "arms", 5, "15-20", 30),
          ex("Cable Curl / Pushdown Giant Set", "arms", 4, "20+", 30),
        ],
      },
    ],
  },
  {
    id: "david-laid",
    name: "David Laid Style",
    tag: "Aesthetic V-Taper",
    vibe: "Lean aesthetic bodybuilding. Shoulder width, back taper, controlled tempo, physique-model precision.",
    intensity: "Volume 8 · Tempo controlled · Rest 90s",
    icon: "🗿",
    days: [
      {
        label: "Day 1",
        focus: "Push — Chest / Shoulders / Triceps",
        muscles: ["chest", "shoulders", "arms"],
        exercises: [
          ex("Incline DB Press", "chest", 4, "8-10", 120),
          ex("Flat Barbell Press", "chest", 4, "6-8", 120),
          ex("Seated DB Shoulder Press", "shoulders", 4, "10-12", 90),
          ex("Cable Lateral Raise", "shoulders", 4, "12-15", 60),
          ex("Cable Fly", "chest", 3, "12-15", 60),
          ex("Overhead Cable Extension", "arms", 3, "12-15", 60),
        ],
      },
      {
        label: "Day 2",
        focus: "Pull — Back Width & Thickness / Biceps",
        muscles: ["back", "arms"],
        exercises: [
          ex("Weighted Pull-Up", "back", 4, "6-10", 120),
          ex("Barbell Row", "back", 4, "8-10", 120),
          ex("Wide-Grip Lat Pulldown", "back", 3, "12-15", 90),
          ex("Chest-Supported Row", "back", 3, "10-12", 90),
          ex("Incline DB Curl", "arms", 3, "10-12", 60),
          ex("Hammer Curl", "arms", 3, "12-15", 60),
        ],
      },
      {
        label: "Day 3",
        focus: "Legs — Quad / Hamstring Balance",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Back Squat", "legs", 4, "6-8", 150),
          ex("Romanian Deadlift", "legs", 4, "8-10", 120),
          ex("Bulgarian Split Squat", "legs", 3, "10-12", 90),
          ex("Leg Curl", "legs", 3, "12-15", 60),
          ex("Leg Extension", "legs", 3, "12-15", 60),
          ex("Seated Calf Raise", "legs", 4, "12-15", 45),
        ],
      },
      {
        label: "Day 4",
        focus: "Upper Accessory — Delts & Arm Detail",
        muscles: ["shoulders", "arms", "abs"],
        exercises: [
          ex("Lateral Raise (drop set finish)", "shoulders", 5, "12-20", 60),
          ex("Reverse Pec Deck", "shoulders", 4, "15-20", 60),
          ex("Face Pull", "shoulders", 3, "15-20", 60),
          ex("Cable Curl", "arms", 3, "12-15", 60),
          ex("Rope Pushdown", "arms", 3, "12-15", 60),
          ex("Hanging Leg Raise", "abs", 3, "12-15", 60),
        ],
      },
      {
        label: "Day 5",
        focus: "Active Recovery / Conditioning",
        muscles: ["conditioning", "abs"],
        exercises: [
          ex("Incline Treadmill Walk", "conditioning", 1, "30 min", 0),
          ex("Cable Crunch", "abs", 4, "15-20", 45),
          ex("Mobility Circuit", "conditioning", 3, "8 min", 30),
        ],
      },
    ],
  },
  {
    id: "classic-olympia",
    name: "Classic Mr. Olympia Style",
    tag: "Golden Era Bro Split",
    vibe: "One muscle group per day, old-school high volume, chase the pump and the peak.",
    intensity: "Volume 9 · Rest 75s",
    icon: "🏆",
    days: [
      {
        label: "Day 1",
        focus: "Chest",
        muscles: ["chest"],
        exercises: [
          ex("Barbell Bench Press", "chest", 5, "8-10", 90),
          ex("Incline Barbell Press", "chest", 4, "8-10", 90),
          ex("Dumbbell Fly", "chest", 4, "10-12", 60),
          ex("Cable Crossover", "chest", 4, "12-15", 60),
          ex("Dips", "chest", 3, "to failure", 90),
        ],
      },
      {
        label: "Day 2",
        focus: "Back",
        muscles: ["back"],
        exercises: [
          ex("Deadlift", "back", 4, "6-8", 180),
          ex("Wide-Grip Pulldown", "back", 4, "10-12", 90),
          ex("T-Bar Row", "back", 4, "8-10", 90),
          ex("Seated Cable Row", "back", 4, "10-12", 75),
          ex("Dumbbell Pullover", "back", 3, "12-15", 60),
        ],
      },
      {
        label: "Day 3",
        focus: "Shoulders",
        muscles: ["shoulders"],
        exercises: [
          ex("Standing Overhead Press", "shoulders", 5, "8-10", 90),
          ex("Behind-Neck Press (light)", "shoulders", 3, "10-12", 75),
          ex("Lateral Raise", "shoulders", 5, "12-15", 60),
          ex("Bent-Over Rear Delt Raise", "shoulders", 4, "12-15", 60),
          ex("Barbell Shrug", "shoulders", 4, "12-15", 60),
        ],
      },
      {
        label: "Day 4",
        focus: "Arms",
        muscles: ["arms"],
        exercises: [
          ex("Barbell Curl", "arms", 5, "8-12", 75),
          ex("Preacher Curl", "arms", 4, "10-12", 60),
          ex("Concentration Curl", "arms", 3, "12-15", 60),
          ex("Close-Grip Bench", "arms", 4, "8-10", 90),
          ex("Skullcrusher", "arms", 4, "10-12", 75),
          ex("Rope Pushdown", "arms", 3, "15-20", 60),
        ],
      },
      {
        label: "Day 5",
        focus: "Legs",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Back Squat", "legs", 5, "8-10", 150),
          ex("Leg Press", "legs", 4, "12-15", 120),
          ex("Hack Squat", "legs", 4, "10-12", 90),
          ex("Lying Leg Curl", "legs", 4, "12-15", 60),
          ex("Standing Calf Raise", "legs", 5, "15-20", 45),
        ],
      },
      {
        label: "Day 6",
        focus: "Abs & Conditioning",
        muscles: ["abs", "conditioning"],
        exercises: [
          ex("Hanging Leg Raise", "abs", 4, "15-20", 45),
          ex("Cable Crunch", "abs", 4, "15-20", 45),
          ex("Steady-State Cardio", "conditioning", 1, "25 min", 0),
        ],
      },
    ],
  },
  {
    id: "powerbuilder",
    name: "Powerbuilder Style",
    tag: "Strength + Size",
    vibe: "Heavy compounds first, hypertrophy accessories after. Low reps, big plates, real numbers.",
    intensity: "Intensity 10 · Rest 3 min on mains",
    icon: "🏋️",
    days: [
      {
        label: "Day 1",
        focus: "Squat Focus",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Back Squat", "legs", 5, "3-5", 180),
          ex("Pause Squat", "legs", 3, "5", 150),
          ex("Leg Press", "legs", 3, "8-10", 120),
          ex("Romanian Deadlift", "legs", 3, "8", 120),
          ex("Weighted Plank", "abs", 3, "45s", 60),
        ],
      },
      {
        label: "Day 2",
        focus: "Bench Focus",
        muscles: ["chest", "arms", "shoulders"],
        exercises: [
          ex("Barbell Bench Press", "chest", 5, "3-5", 180),
          ex("Close-Grip Bench", "arms", 4, "6-8", 150),
          ex("Incline DB Press", "chest", 3, "8-10", 90),
          ex("Overhead Press", "shoulders", 3, "6-8", 120),
          ex("Cable Pushdown", "arms", 3, "12-15", 60),
        ],
      },
      {
        label: "Day 3",
        focus: "Deadlift Focus",
        muscles: ["back", "legs"],
        exercises: [
          ex("Deadlift", "back", 5, "2-4", 240),
          ex("Deficit Deadlift", "back", 3, "5", 180),
          ex("Barbell Row", "back", 4, "6-8", 120),
          ex("Weighted Pull-Up", "back", 3, "6-8", 120),
          ex("Barbell Curl", "arms", 3, "8-10", 75),
        ],
      },
      {
        label: "Day 4",
        focus: "Overhead & Accessory",
        muscles: ["shoulders", "arms", "back"],
        exercises: [
          ex("Standing Overhead Press", "shoulders", 5, "3-5", 180),
          ex("Push Press", "shoulders", 3, "5", 150),
          ex("Chest-Supported Row", "back", 4, "8-10", 90),
          ex("Lateral Raise", "shoulders", 3, "12-15", 60),
          ex("Hammer Curl", "arms", 3, "10-12", 60),
        ],
      },
    ],
  },
  {
    id: "glute-specialist",
    name: "Glute Specialist Style",
    tag: "Posterior Priority",
    vibe: "Lower body three times a week. Heavy hip thrusts, deep hinges, relentless glute isolation.",
    intensity: "Volume 9 · Glute focus",
    icon: "🍑",
    days: [
      {
        label: "Day 1",
        focus: "Heavy Glute Day",
        muscles: ["glutes", "legs"],
        exercises: [
          ex("Barbell Hip Thrust", "glutes", 5, "6-8", 150),
          ex("Sumo Deadlift", "glutes", 4, "6-8", 150),
          ex("Bulgarian Split Squat", "glutes", 3, "10-12", 90),
          ex("Cable Kickback", "glutes", 3, "15-20", 45),
          ex("Back Extension (glute bias)", "glutes", 3, "15", 60),
        ],
      },
      {
        label: "Day 2",
        focus: "Quad & Glute Pump",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Hack Squat", "legs", 4, "10-12", 120),
          ex("Walking Lunge", "glutes", 3, "12 / leg", 90),
          ex("Leg Extension", "legs", 3, "15-20", 60),
          ex("Abduction Machine", "glutes", 4, "20-25", 45),
          ex("Frog Pump Finisher", "glutes", 3, "30", 45),
        ],
      },
      {
        label: "Day 3",
        focus: "Hinge & Hamstrings",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Romanian Deadlift", "legs", 4, "8-10", 120),
          ex("Single-Leg Hip Thrust", "glutes", 3, "12 / leg", 75),
          ex("Seated Leg Curl", "legs", 4, "12-15", 60),
          ex("Cable Pull-Through", "glutes", 3, "15-20", 60),
          ex("Hanging Leg Raise", "abs", 3, "12-15", 60),
        ],
      },
      {
        label: "Day 4",
        focus: "Upper Body Maintenance",
        muscles: ["back", "shoulders", "arms"],
        exercises: [
          ex("Lat Pulldown", "back", 4, "10-12", 90),
          ex("DB Shoulder Press", "shoulders", 3, "10-12", 90),
          ex("Seated Row", "back", 3, "12-15", 75),
          ex("Lateral Raise", "shoulders", 3, "15-20", 45),
          ex("Cable Curl", "arms", 3, "12-15", 45),
        ],
      },
    ],
  },
  {
    id: "arnold",
    name: "Arnold Style",
    tag: "Double Split",
    vibe: "Chest+Back, Shoulders+Arms, Legs — twice a week. Antagonist supersets, pure golden-era grind.",
    intensity: "Volume 10 · Frequency 2x",
    icon: "💪",
    days: [
      {
        label: "Day 1 & 4",
        focus: "Chest + Back",
        muscles: ["chest", "back"],
        exercises: [
          ex("Bench Press superset Bent Row", "chest", 5, "8-12", 75),
          ex("Incline DB Press superset Pulldown", "chest", 4, "10-12", 75),
          ex("Dumbbell Fly superset T-Bar Row", "chest", 4, "12-15", 60),
          ex("Dips superset Pull-Ups", "chest", 4, "to failure", 90),
          ex("Dumbbell Pullover", "back", 3, "15", 60),
        ],
      },
      {
        label: "Day 2 & 5",
        focus: "Shoulders + Arms",
        muscles: ["shoulders", "arms"],
        exercises: [
          ex("Arnold Press", "shoulders", 5, "8-12", 90),
          ex("Lateral Raise superset Rear Delt", "shoulders", 4, "12-15", 60),
          ex("Barbell Curl superset Skullcrusher", "arms", 5, "10-12", 60),
          ex("Concentration Curl superset Pushdown", "arms", 4, "12-15", 60),
          ex("Wrist Curl", "arms", 3, "20", 45),
        ],
      },
      {
        label: "Day 3 & 6",
        focus: "Legs + Abs",
        muscles: ["legs", "abs"],
        exercises: [
          ex("Back Squat", "legs", 5, "8-12", 150),
          ex("Leg Curl", "legs", 4, "12-15", 60),
          ex("Leg Extension", "legs", 4, "12-15", 60),
          ex("Standing Calf Raise", "legs", 5, "15-20", 45),
          ex("Roman Chair Sit-Up", "abs", 4, "25", 45),
        ],
      },
    ],
  },
  {
    id: "shredded-physique",
    name: "Shredded Physique Style",
    tag: "Conditioning Bodybuilding",
    vibe: "High reps, short rest, constant tension. Built for grainy conditioning and a flat waist.",
    intensity: "Reps 15-25 · Rest 30-45s",
    icon: "⚡",
    days: [
      {
        label: "Day 1",
        focus: "Upper Push Circuit",
        muscles: ["chest", "shoulders", "arms"],
        exercises: [
          ex("Incline Machine Press", "chest", 4, "15-20", 40),
          ex("Cable Fly", "chest", 4, "20", 30),
          ex("DB Shoulder Press", "shoulders", 4, "15", 40),
          ex("Lateral Raise", "shoulders", 4, "20-25", 30),
          ex("Rope Pushdown", "arms", 4, "20", 30),
        ],
      },
      {
        label: "Day 2",
        focus: "Lower Burn",
        muscles: ["legs", "glutes"],
        exercises: [
          ex("Goblet Squat", "legs", 4, "20", 45),
          ex("Walking Lunge", "glutes", 3, "20 / leg", 45),
          ex("Leg Extension", "legs", 4, "20-25", 30),
          ex("Leg Curl", "legs", 4, "20", 30),
          ex("Calf Raise", "legs", 5, "25", 30),
        ],
      },
      {
        label: "Day 3",
        focus: "Upper Pull Circuit",
        muscles: ["back", "arms"],
        exercises: [
          ex("Lat Pulldown", "back", 4, "15-20", 40),
          ex("Seated Cable Row", "back", 4, "15-20", 40),
          ex("Straight-Arm Pulldown", "back", 3, "20", 30),
          ex("Cable Curl", "arms", 4, "20", 30),
          ex("Face Pull", "shoulders", 3, "25", 30),
        ],
      },
      {
        label: "Day 4",
        focus: "Conditioning & Core",
        muscles: ["conditioning", "abs"],
        exercises: [
          ex("Rowing Intervals", "conditioning", 8, "250m", 45),
          ex("Cable Crunch", "abs", 4, "20-25", 30),
          ex("Hanging Knee Raise", "abs", 4, "20", 30),
          ex("Incline Walk", "conditioning", 1, "20 min", 0),
        ],
      },
    ],
  },
  {
    id: "strongman",
    name: "Strongman Style",
    tag: "Max Effort",
    vibe: "Max heavy compounds, carries and presses. Low volume, long rest, absolute output.",
    intensity: "Intensity 10 · Rest 4-5 min",
    icon: "🪨",
    days: [
      {
        label: "Day 1",
        focus: "Max Effort Lower",
        muscles: ["legs", "back"],
        exercises: [
          ex("Deadlift (work to heavy triple)", "back", 5, "1-3", 300),
          ex("Front Squat", "legs", 4, "3-5", 240),
          ex("Farmer's Carry", "full body", 4, "40m", 180),
          ex("Back Extension", "back", 3, "10", 90),
        ],
      },
      {
        label: "Day 2",
        focus: "Overhead Power",
        muscles: ["shoulders", "arms"],
        exercises: [
          ex("Log / Axle Press", "shoulders", 5, "1-3", 300),
          ex("Push Press", "shoulders", 4, "3", 240),
          ex("Close-Grip Incline", "arms", 3, "6-8", 150),
          ex("Heavy Tricep Extension", "arms", 3, "8-10", 120),
        ],
      },
      {
        label: "Day 3",
        focus: "Events & Carries",
        muscles: ["full body", "conditioning"],
        exercises: [
          ex("Yoke Walk", "full body", 4, "20m", 240),
          ex("Sled Push", "full body", 5, "25m", 180),
          ex("Atlas Stone / Sandbag Load", "full body", 5, "3", 180),
          ex("Suitcase Carry", "abs", 3, "30m", 120),
        ],
      },
      {
        label: "Day 4",
        focus: "Heavy Pull Accessory",
        muscles: ["back", "arms"],
        exercises: [
          ex("Barbell Row", "back", 4, "5-6", 180),
          ex("Weighted Chin-Up", "back", 4, "5", 180),
          ex("Shrug", "shoulders", 4, "8-10", 120),
          ex("Thick-Bar Curl", "arms", 3, "8-10", 90),
        ],
      },
    ],
  },
  {
    id: "calisthenics",
    name: "Calisthenics Athlete Style",
    tag: "Bodyweight Skill",
    vibe: "Bodyweight mastery. Skill work first, straight-arm strength, relative strength over mass.",
    intensity: "Skill + strength · Rest 2-3 min",
    icon: "🤸",
    days: [
      {
        label: "Day 1",
        focus: "Push Skill",
        muscles: ["chest", "shoulders", "arms"],
        exercises: [
          ex("Handstand Hold", "shoulders", 5, "30-45s", 120),
          ex("Ring Dips", "chest", 5, "6-10", 120),
          ex("Pseudo Planche Push-Up", "chest", 4, "8-12", 90),
          ex("Pike Push-Up", "shoulders", 4, "8-12", 90),
          ex("Ring Tricep Extension", "arms", 3, "10-12", 75),
        ],
      },
      {
        label: "Day 2",
        focus: "Pull Skill",
        muscles: ["back", "arms"],
        exercises: [
          ex("Front Lever Progression", "back", 5, "10-20s", 150),
          ex("Weighted Pull-Up", "back", 5, "5-8", 150),
          ex("Ring Row", "back", 4, "10-12", 90),
          ex("Ice Cream Maker", "back", 3, "5-8", 90),
          ex("Ring Curl", "arms", 3, "10-12", 75),
        ],
      },
      {
        label: "Day 3",
        focus: "Legs & Core",
        muscles: ["legs", "abs"],
        exercises: [
          ex("Pistol Squat", "legs", 4, "6-10 / leg", 120),
          ex("Nordic Curl", "legs", 4, "5-8", 120),
          ex("Shrimp Squat", "legs", 3, "6-8 / leg", 90),
          ex("Dragon Flag", "abs", 4, "5-8", 90),
          ex("Hollow Body Hold", "abs", 4, "45s", 60),
        ],
      },
      {
        label: "Day 4",
        focus: "Full Body Flow",
        muscles: ["full body", "conditioning"],
        exercises: [
          ex("Muscle-Up Practice", "full body", 6, "2-4", 150),
          ex("Explosive Pull-Up", "back", 4, "5", 120),
          ex("Burpee Pull-Up Circuit", "conditioning", 5, "10", 60),
          ex("L-Sit", "abs", 4, "20-30s", 60),
        ],
      },
    ],
  },
];

export const getStyle = (id: string | null | undefined) =>
  ATHLETE_STYLES.find((s) => s.id === id);

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "abs",
  "full body",
  "conditioning",
];

export const EXERCISE_LIBRARY: { name: string; muscle: MuscleGroup }[] = (() => {
  const map = new Map<string, MuscleGroup>();
  for (const style of ATHLETE_STYLES) {
    for (const day of style.days) {
      for (const e of day.exercises) {
        if (!map.has(e.name)) map.set(e.name, e.muscle);
      }
    }
  }
  return [...map.entries()]
    .map(([name, muscle]) => ({ name, muscle }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();
