import { temporaryTaskScheduleAdapter } from '../../features/today/temporaryTaskScheduleAdapter'
import { mediaScheduleAdapter } from '../../features/media/mediaScheduleAdapter'
import { researchScheduleAdapters } from '../../features/research/scheduleAdapters'
import { fitnessScheduleAdapter } from '../../features/fitness/fitnessScheduleAdapter'
import { leisureScheduleAdapters } from '../../features/leisure/scheduleAdapters'
import { scheduleRegistry } from './registry'

scheduleRegistry.register(temporaryTaskScheduleAdapter)
scheduleRegistry.register(mediaScheduleAdapter)
researchScheduleAdapters.forEach((adapter) => scheduleRegistry.register(adapter))
scheduleRegistry.register(fitnessScheduleAdapter)
leisureScheduleAdapters.forEach((adapter) => scheduleRegistry.register(adapter))

export { scheduleRegistry as appScheduleRegistry }
