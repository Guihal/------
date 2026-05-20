import { useAppDependencies } from "./useAppDependencies";

export function useClock() {
	const deps = useAppDependencies();
	if (!deps?.ports.clock) {
		throw new Error("ClockPort not available");
	}
	return { nowIso: deps.ports.clock.nowIso };
}
