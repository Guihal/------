import { useAppDependencies } from "./useAppDependencies";

export function useIdGenerator() {
	const deps = useAppDependencies();
	if (!deps?.ports.idGenerator) {
		throw new Error("IdGeneratorPort not available");
	}
	return { generateId: deps.ports.idGenerator.generateId };
}
