import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'

export type MobileBackAction = 'history' | 'minimize'

export function getMobileBackAction(pathname: string): MobileBackAction {
  return pathname === '/' ? 'minimize' : 'history'
}

export function useMobileBackNavigation(pathname: string) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = CapacitorApp.addListener('backButton', () => {
      if (getMobileBackAction(pathname) === 'minimize') {
        void CapacitorApp.minimizeApp()
        return
      }

      if (window.history.length > 1) window.history.back()
      else window.location.hash = '#/'
    })

    return () => { void listener.then((handle) => handle.remove()) }
  }, [pathname])
}
