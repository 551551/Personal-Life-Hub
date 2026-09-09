export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveSnapshot {
  state: SaveState
  message?: string
  changedAt?: string
}

let snapshot: SaveSnapshot = { state: 'idle' }
const listeners = new Set<() => void>()

export function getSaveSnapshot() {
  return snapshot
}

export function subscribeToSaveStatus(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function reportSaveStatus(state: SaveState, message?: string) {
  snapshot = {
    state,
    message,
    changedAt: new Date().toISOString(),
  }
  listeners.forEach((listener) => listener())
}

export async function withSaveStatus<T>(operation: () => Promise<T>) {
  reportSaveStatus('saving')
  try {
    const result = await operation()
    reportSaveStatus('saved')
    return result
  } catch (error) {
    reportSaveStatus(
      'error',
      error instanceof Error ? error.message : '保存失败，请重试',
    )
    throw error
  }
}
