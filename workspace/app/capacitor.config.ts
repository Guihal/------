import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.taskcompanion.app',
  appName: 'Таск Компаньон',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
  },
}

export default config
