import { useNuxtApp } from "nuxt/app";
import type { AppDependencies } from "../../infrastructure/di/app-dependencies";
import { getAppDependencies } from "../../infrastructure/di/provide-app-dependencies";

export function useAppDependencies(): AppDependencies | undefined {
	try {
		const nuxtApp = useNuxtApp();
		const fromNuxt = nuxtApp.$appDependencies as AppDependencies | undefined;
		if (fromNuxt) return fromNuxt;
	} catch {
		// nuxt app unavailable in test environment
	}
	return getAppDependencies();
}
