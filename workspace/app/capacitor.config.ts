import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.diploma.app',
  appName: 'Diploma App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
