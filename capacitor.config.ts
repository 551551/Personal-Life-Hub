import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.personallifehub.app',
  appName: '个人中心',
  webDir: 'dist',
  backgroundColor: '#f3f6f8',
  loggingBehavior: 'none',
  android: {
    allowMixedContent: false,
    backgroundColor: '#f3f6f8',
    webContentsDebuggingEnabled: false,
  },
}

export default config
