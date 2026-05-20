import { useAppDependencies } from "./useAppDependencies";

export function useClock() {
	const deps = useAppDependencies();
	if (deps?.ports.clock) {
		return { nowIso: deps.ports.clock.nowIso };
	}
	return { nowIso: () => new Date().toISOString() };
}
