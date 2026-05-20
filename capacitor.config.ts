import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.taskcompanion.app",
	appName: "Task Companion",
	webDir: ".output/public",
	android: {
		minSdkVersion: 22,
		targetSdkVersion: 34,
	},
};

export default config;
