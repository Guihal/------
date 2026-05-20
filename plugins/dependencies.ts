import { defineNuxtPlugin } from "nuxt/app";
import type { AppDependencies } from "../infrastructure/di/app-dependencies";
import { bootstrapDependencies } from "../infrastructure/di/bootstrap-app";
import {
	getAppDependencies,
	provideAppDependencies,
} from "../infrastructure/di/provide-app-dependencies";

export default defineNuxtPlugin({
	name: "dependencies",
	enforce: "pre",
	async setup() {
		if (typeof process !== "undefined" && process.server) {
			return {
				provide: {
					appDependencies: null as AppDependencies | null,
				},
			};
		}

		const existing = getAppDependencies();
		if (existing) {
			return { provide: { appDependencies: existing } };
		}

		const deps = await bootstrapDependencies();
		provideAppDependencies(deps);
		return {
			provide: {
				appDependencies: deps,
			},
		};
	},
});
