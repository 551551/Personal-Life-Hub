import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { DietRepository } from './dietRepository'
import { summarizeNutrition } from './nutritionSummary'

let database: AppDatabase
let repository: DietRepository

beforeEach(async () => { database = await createTestDb(); repository = new DietRepository(database) })
afterEach(async () => destroyTestDb(database))

describe('diet records', () => {
  it('sums daily nutrition across meal groups', async () => {
    await repository.create({ date: '2026-09-03', mealType: 'breakfast', foodName: '燕麦', amount: 50, unit: '克', calories: 190, protein: 6, carbs: 34, fat: 3 })
    await repository.create({ date: '2026-09-03', mealType: 'lunch', foodName: '鸡胸肉', amount: 150, unit: '克', calories: 250, protein: 46, carbs: 0, fat: 5 })
    expect(summarizeNutrition(await repository.listByDate('2026-09-03'))).toEqual({ calories: 440, protein: 52, carbs: 34, fat: 8 })
  })

  it('rejects negative nutrient values without persisting', async () => {
    await expect(repository.create({ date: '2026-09-03', mealType: 'snack', foodName: '错误食物', amount: 1, unit: '份', calories: -2, protein: 0, carbs: 0, fat: 0 })).rejects.toThrow()
    await expect(database.dietEntries.count()).resolves.toBe(0)
  })
})
