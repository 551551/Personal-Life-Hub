import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, type ReactNode } from 'react'
import { settingsRepository } from './settingsRepository'
export function AppPreferences({ children }: { children: ReactNode }) { const density = useLiveQuery(() => settingsRepository.get('density'), []) ?? 'comfortable'; useEffect(() => { document.documentElement.dataset.density = density === 'compact' ? 'compact' : 'comfortable' }, [density]); return children }
