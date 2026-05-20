import { defineNuxtPlugin } from "nuxt/app";
import type { AppDependencies } from "../infrastructure/di/app-dependencies";
import { bootstrapDependenciesSync } from "../infrastructure/di/bootstrap-app";
import {
	getAppDependencies,
	provideAppDependencies,
} from "../infrastructure/di/provide-app-dependencies";

export default defineNuxtPlugin({
	name: "dependencies",
	enforce: "pre",
	setup() {
		const existing = getAppDependencies();
		if (existing) {
			return { provide: { appDependencies: existing } };
		}

		const deps = bootstrapDependenciesSync();
		provideAppDependencies(deps);
		return {
			provide: {
				appDependencies: deps,
			},
		};
	},
});
