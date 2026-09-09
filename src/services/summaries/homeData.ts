import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import type { DeadlineItem } from './summaryService'

export async function queryHomeData(database: AppDatabase = db) {
  const [
    projects,
    media,
    fitness,
    leisure,
    projectCount,
    mediaCount,
    fitnessCount,
    dietCount,
    leisureCount,
  ] = await Promise.all([
    database.researchProjects.toArray(),
    database.mediaContents.toArray(),
    database.fitnessPlans.toArray(),
    database.leisureItems.toArray(),
    database.researchProjects.count(),
    database.mediaContents.count(),
    database.fitnessPlans.count(),
    database.dietEntries.count(),
    database.leisureItems.count(),
  ])

  const deadlines: DeadlineItem[] = [
    ...projects
      .filter((item) => item.deadline && item.status !== 'completed')
      .map((item) => ({
        id: item.id,
        title: item.name,
        date: item.deadline!,
        route: `/research/${item.id}`,
        source: '科研项目',
      })),
    ...media
      .filter((item) => item.plannedPublishDate && item.stage !== 'published')
      .map((item) => ({
        id: item.id,
        title: item.title,
        date: item.plannedPublishDate!,
        route: `/media/${item.id}`,
        source: '自媒体',
      })),
    ...fitness
      .filter((item) => item.status !== 'completed')
      .map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        route: `/fitness/${item.date}`,
        source: '健身',
      })),
    ...leisure
      .filter((item) => item.plannedDate && item.status !== 'completed')
      .map((item) => ({
        id: item.id,
        title: item.title,
        date: item.plannedDate!,
        route: '/leisure',
        source: '娱乐',
      })),
  ]

  return {
    deadlines,
    moduleCounts: {
      research: projectCount,
      media: mediaCount,
      fitness: fitnessCount,
      diet: dietCount,
      leisure: leisureCount,
    },
  }
}
