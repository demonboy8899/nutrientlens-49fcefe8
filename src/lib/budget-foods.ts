export type BudgetFood = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tag: "protein" | "carbs" | "fat" | "balanced";
  note: string;
};

/** Cheap, widely available staples only — no exotic or pricey ingredients. */
export const BUDGET_FOODS: BudgetFood[] = [
  { name: "Whole Eggs", serving: "3 large", calories: 234, protein: 19, carbs: 1, fat: 16, tag: "protein", note: "Cheapest complete protein" },
  { name: "Chicken Thighs", serving: "150 g", calories: 260, protein: 36, carbs: 0, fat: 12, tag: "protein", note: "Cheaper than breast" },
  { name: "Chicken Breast", serving: "150 g", calories: 248, protein: 47, carbs: 0, fat: 5, tag: "protein", note: "Lean bulk protein" },
  { name: "Canned Tuna", serving: "1 can", calories: 128, protein: 29, carbs: 0, fat: 1, tag: "protein", note: "Shelf-stable, no cooking" },
  { name: "Red Lentils (cooked)", serving: "250 g", calories: 290, protein: 20, carbs: 50, fat: 1, tag: "balanced", note: "Protein + carbs in one pot" },
  { name: "Chickpeas (canned)", serving: "240 g", calories: 290, protein: 15, carbs: 44, fat: 5, tag: "balanced", note: "Filling and very cheap" },
  { name: "Greek Yogurt (plain)", serving: "200 g", calories: 118, protein: 20, carbs: 8, fat: 0, tag: "protein", note: "Easy late-day protein" },
  { name: "Cottage Cheese", serving: "200 g", calories: 196, protein: 24, carbs: 8, fat: 8, tag: "protein", note: "Slow-digesting, cheap" },
  { name: "Milk", serving: "400 ml", calories: 260, protein: 14, carbs: 19, fat: 14, tag: "balanced", note: "Easy calories" },
  { name: "White Rice (cooked)", serving: "200 g", calories: 260, protein: 5, carbs: 57, fat: 1, tag: "carbs", note: "Pennies per serving" },
  { name: "Oats (dry)", serving: "80 g", calories: 303, protein: 11, carbs: 54, fat: 6, tag: "carbs", note: "Bulk bag staple" },
  { name: "Potatoes", serving: "300 g", calories: 232, protein: 6, carbs: 53, fat: 0, tag: "carbs", note: "Most filling carb per calorie" },
  { name: "Pasta (cooked)", serving: "200 g", calories: 262, protein: 10, carbs: 52, fat: 2, tag: "carbs", note: "Fast pre-training carbs" },
  { name: "Wholemeal Bread", serving: "2 slices", calories: 180, protein: 8, carbs: 30, fat: 3, tag: "carbs", note: "Zero prep" },
  { name: "Banana", serving: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0, tag: "carbs", note: "Cheapest quick carb" },
  { name: "Peanut Butter", serving: "30 g", calories: 188, protein: 8, carbs: 6, fat: 16, tag: "fat", note: "Dense cheap fats" },
  { name: "Sunflower Oil / Butter", serving: "1 tbsp", calories: 120, protein: 0, carbs: 0, fat: 14, tag: "fat", note: "Cook with it to add fats" },
  { name: "Frozen Mixed Veg", serving: "200 g", calories: 90, protein: 5, carbs: 14, fat: 1, tag: "balanced", note: "Cheap micros and volume" },
  { name: "Soya Mince (dry)", serving: "50 g", calories: 170, protein: 25, carbs: 12, fat: 1, tag: "protein", note: "Very cheap protein" },
  { name: "Baked Beans", serving: "200 g", calories: 162, protein: 10, carbs: 26, fat: 1, tag: "balanced", note: "Store-cupboard fallback" },
];

export type Remaining = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Rank budget staples by how much of the day's remaining macros they close,
 * penalising anything that pushes a macro well past target.
 */
export function suggestBudgetFoods(remaining: Remaining, limit = 4): BudgetFood[] {
  const need = {
    protein: Math.max(0, remaining.protein),
    carbs: Math.max(0, remaining.carbs),
    fat: Math.max(0, remaining.fat),
  };
  const totalNeed = need.protein + need.carbs + need.fat;
  if (totalNeed <= 0) return [];

  const weights = {
    protein: (need.protein / totalNeed) * 1.4,
    carbs: need.carbs / totalNeed,
    fat: need.fat / totalNeed,
  };

  return [...BUDGET_FOODS]
    .map((food) => {
      const fill =
        Math.min(food.protein, need.protein) * weights.protein +
        Math.min(food.carbs, need.carbs) * weights.carbs +
        Math.min(food.fat, need.fat) * weights.fat;
      const overshoot =
        Math.max(0, food.protein - need.protein) * 0.4 +
        Math.max(0, food.carbs - need.carbs) * 0.4 +
        Math.max(0, food.fat - need.fat) * 0.6 +
        Math.max(0, food.calories - Math.max(0, remaining.calories)) * 0.05;
      return { food, score: fill - overshoot };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.food);
}
