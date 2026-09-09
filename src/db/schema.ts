import { z } from 'zod'

export const businessDateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}, '请输入有效日期')

const idSchema = z.string().uuid()
const timestampSchema = z.string().datetime()
const titleSchema = z.string().trim().min(1, '标题不能为空').max(200)
const noteSchema = z.string().max(20_000).optional()
const progressSchema = z.number().min(0).max(100)
const nonNegativeNumberSchema = z.number().finite().min(0)

export const baseRecordSchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const memoSchema = baseRecordSchema.extend({
  content: z.string().trim().min(1, '备忘内容不能为空').max(2_000),
})

export const temporaryTaskSchema = baseRecordSchema.extend({
  title: titleSchema,
  date: businessDateSchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'completed']),
  note: noteSchema,
})

export const mediaContentSchema = baseRecordSchema.extend({
  title: titleSchema,
  contentType: z.string().trim().min(1).max(60),
  platforms: z.array(z.string().trim().min(1).max(60)).max(20),
  stage: z.enum(['idea', 'preparing', 'producing', 'scheduled', 'published']),
  plannedPublishDate: businessDateSchema.optional(),
  actualPublishDate: businessDateSchema.optional(),
  materialNotes: noteSchema,
  metrics: z.object({
    views: nonNegativeNumberSchema.int(),
    likes: nonNegativeNumberSchema.int(),
    comments: nonNegativeNumberSchema.int(),
    other: nonNegativeNumberSchema.int().optional(),
  }),
  retrospective: noteSchema,
})

export const researchProjectSchema = baseRecordSchema.extend({
  name: titleSchema,
  description: noteSchema,
  stage: z.string().trim().max(100).optional(),
  startDate: businessDateSchema,
  deadline: businessDateSchema.optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']),
  progress: progressSchema,
})

export const researchMilestoneSchema = baseRecordSchema.extend({
  projectId: idSchema,
  title: titleSchema,
  date: businessDateSchema,
  status: z.enum(['pending', 'completed']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export const literatureItemSchema = baseRecordSchema.extend({
  projectId: idSchema,
  title: titleSchema,
  authors: z.string().max(1_000).optional(),
  year: z.number().int().min(1000).max(9999).optional(),
  status: z.enum(['to-read', 'reading', 'read']),
  plannedDate: businessDateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: noteSchema,
})

export const experimentSchema = baseRecordSchema.extend({
  projectId: idSchema,
  title: titleSchema,
  plannedDate: businessDateSchema.optional(),
  status: z.enum(['planned', 'running', 'completed']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  plan: noteSchema,
  process: noteSchema,
  result: noteSchema,
  nextSteps: noteSchema,
})

export const paperSchema = baseRecordSchema.extend({
  projectId: idSchema,
  title: titleSchema,
  status: z.enum(['drafting', 'revising', 'completed']),
  deadline: businessDateSchema.optional(),
  progress: progressSchema,
})

export const paperSectionSchema = baseRecordSchema.extend({
  paperId: idSchema,
  title: titleSchema,
  kind: z.enum(['section', 'revision']),
  status: z.enum(['pending', 'writing', 'completed']),
  deadline: businessDateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  progress: progressSchema,
  notes: noteSchema,
})

export const fitnessPlanSchema = baseRecordSchema.extend({
  title: titleSchema,
  date: businessDateSchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  status: z.enum(['pending', 'completed']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export const fitnessExerciseSchema = baseRecordSchema.extend({
  planId: idSchema,
  name: titleSchema,
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(10_000).optional(),
  durationMinutes: nonNegativeNumberSchema.optional(),
  weightKg: nonNegativeNumberSchema.optional(),
  order: z.number().int().min(0),
  note: noteSchema,
})

export const dietEntrySchema = baseRecordSchema.extend({
  date: businessDateSchema,
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodName: titleSchema,
  amount: nonNegativeNumberSchema.positive(),
  unit: z.string().trim().min(1).max(20),
  calories: nonNegativeNumberSchema,
  protein: nonNegativeNumberSchema,
  carbs: nonNegativeNumberSchema,
  fat: nonNegativeNumberSchema,
  note: noteSchema,
})

export const leisureItemSchema = baseRecordSchema.extend({
  title: titleSchema,
  category: z.string().trim().min(1).max(60),
  status: z.enum(['wishlist', 'in-progress', 'completed']),
  plannedDate: businessDateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).default('low'),
  progress: progressSchema,
  note: noteSchema,
})

export const guitarTrackSchema = baseRecordSchema.extend({
  title: titleSchema,
  status: z.enum(['wishlist', 'learning', 'mastered']),
  progress: progressSchema,
  note: noteSchema,
})

export const guitarPracticePlanSchema = baseRecordSchema.extend({
  trackId: idSchema.optional(),
  title: titleSchema,
  date: businessDateSchema,
  durationMinutes: nonNegativeNumberSchema.positive(),
  focus: z.string().max(2_000).optional(),
  status: z.enum(['pending', 'completed']),
  priority: z.enum(['low', 'medium', 'high']).default('low'),
})

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

export const appMetaSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})
