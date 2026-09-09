import type { DietEntry } from '../../types/domain'

export function summarizeNutrition(entries: DietEntry[]) {
  return entries.reduce((total, entry) => ({ calories: total.calories + entry.calories, protein: total.protein + entry.protein, carbs: total.carbs + entry.carbs, fat: total.fat + entry.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}
