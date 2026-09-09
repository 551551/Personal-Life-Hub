import type Dexie from 'dexie'

export const CURRENT_DATABASE_VERSION = 1

const versionOneStores = {
  memos: 'id, createdAt, updatedAt',
  temporaryTasks: 'id, date, status, priority, updatedAt',
  mediaContents: 'id, stage, plannedPublishDate, actualPublishDate, updatedAt',
  researchProjects: 'id, status, deadline, updatedAt',
  researchMilestones: 'id, projectId, date, status, priority',
  literatureItems: 'id, projectId, status, plannedDate, priority',
  experiments: 'id, projectId, status, plannedDate, priority',
  papers: 'id, projectId, status, deadline',
  paperSections: 'id, paperId, status, deadline, priority',
  fitnessPlans: 'id, date, status, priority',
  fitnessExercises: 'id, planId, order',
  dietEntries: 'id, date, mealType',
  leisureItems: 'id, category, status, plannedDate, priority',
  guitarTracks: 'id, status, progress',
  guitarPracticePlans: 'id, trackId, date, status, priority',
  settings: 'key',
  appMeta: 'key',
}

export function applyMigrations(database: Dexie) {
  database.version(CURRENT_DATABASE_VERSION).stores(versionOneStores)
}
