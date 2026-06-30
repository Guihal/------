import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.diplom.mobile",
  appName: "TaskCompanion",
  // Nuxt `build` (ssr:false) emits the static client bundle here.
  webDir: ".output/public",
  server: {
    androidScheme: "https",
  },
};

export default config;
