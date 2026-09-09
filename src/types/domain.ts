import { z } from 'zod'
import {
  appMetaSchema,
  dietEntrySchema,
  experimentSchema,
  fitnessExerciseSchema,
  fitnessPlanSchema,
  guitarPracticePlanSchema,
  guitarTrackSchema,
  leisureItemSchema,
  literatureItemSchema,
  mediaContentSchema,
  memoSchema,
  paperSchema,
  paperSectionSchema,
  researchMilestoneSchema,
  researchProjectSchema,
  settingSchema,
  temporaryTaskSchema,
} from '../db/schema'

export type Memo = z.infer<typeof memoSchema>
export type TemporaryTask = z.infer<typeof temporaryTaskSchema>
export type MediaContent = z.infer<typeof mediaContentSchema>
export type ResearchProject = z.infer<typeof researchProjectSchema>
export type ResearchMilestone = z.infer<typeof researchMilestoneSchema>
export type LiteratureItem = z.infer<typeof literatureItemSchema>
export type Experiment = z.infer<typeof experimentSchema>
export type Paper = z.infer<typeof paperSchema>
export type PaperSection = z.infer<typeof paperSectionSchema>
export type FitnessPlan = z.infer<typeof fitnessPlanSchema>
export type FitnessExercise = z.infer<typeof fitnessExerciseSchema>
export type DietEntry = z.infer<typeof dietEntrySchema>
export type LeisureItem = z.infer<typeof leisureItemSchema>
export type GuitarTrack = z.infer<typeof guitarTrackSchema>
export type GuitarPracticePlan = z.infer<typeof guitarPracticePlanSchema>
export type Setting = z.infer<typeof settingSchema>
export type AppMeta = z.infer<typeof appMetaSchema>

export type Priority = 'low' | 'medium' | 'high'
export type CompletionStatus = 'pending' | 'completed'
