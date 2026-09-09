import Dexie, { type Table } from 'dexie'
import type {
  AppMeta,
  DietEntry,
  Experiment,
  FitnessExercise,
  FitnessPlan,
  GuitarPracticePlan,
  GuitarTrack,
  LeisureItem,
  LiteratureItem,
  MediaContent,
  Memo,
  Paper,
  PaperSection,
  ResearchMilestone,
  ResearchProject,
  Setting,
  TemporaryTask,
} from '../types/domain'
import { applyMigrations } from './migrations'

export class AppDatabase extends Dexie {
  memos!: Table<Memo, string>
  temporaryTasks!: Table<TemporaryTask, string>
  mediaContents!: Table<MediaContent, string>
  researchProjects!: Table<ResearchProject, string>
  researchMilestones!: Table<ResearchMilestone, string>
  literatureItems!: Table<LiteratureItem, string>
  experiments!: Table<Experiment, string>
  papers!: Table<Paper, string>
  paperSections!: Table<PaperSection, string>
  fitnessPlans!: Table<FitnessPlan, string>
  fitnessExercises!: Table<FitnessExercise, string>
  dietEntries!: Table<DietEntry, string>
  leisureItems!: Table<LeisureItem, string>
  guitarTracks!: Table<GuitarTrack, string>
  guitarPracticePlans!: Table<GuitarPracticePlan, string>
  settings!: Table<Setting, string>
  appMeta!: Table<AppMeta, string>

  constructor(name = 'personal-life-hub') {
    super(name)
    applyMigrations(this)
  }
}

export const db = new AppDatabase()
