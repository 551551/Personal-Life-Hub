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
} from '../../db/schema'

export const backupTablesSchema = z.strictObject({
  appMeta: z.array(appMetaSchema),
  settings: z.array(settingSchema),
  memos: z.array(memoSchema),
  temporaryTasks: z.array(temporaryTaskSchema),
  mediaContents: z.array(mediaContentSchema),
  researchProjects: z.array(researchProjectSchema),
  researchMilestones: z.array(researchMilestoneSchema),
  literatureItems: z.array(literatureItemSchema),
  experiments: z.array(experimentSchema),
  papers: z.array(paperSchema),
  paperSections: z.array(paperSectionSchema),
  fitnessPlans: z.array(fitnessPlanSchema),
  fitnessExercises: z.array(fitnessExerciseSchema),
  dietEntries: z.array(dietEntrySchema),
  leisureItems: z.array(leisureItemSchema),
  guitarTracks: z.array(guitarTrackSchema),
  guitarPracticePlans: z.array(guitarPracticePlanSchema),
})

export const backupEnvelopeSchema = z.strictObject({
  appId: z.literal('personal-life-hub'),
  schemaVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  tables: backupTablesSchema,
})

export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>
export type BackupTableName = keyof BackupEnvelope['tables']
export const backupTableNames = Object.keys(backupTablesSchema.shape) as BackupTableName[]
