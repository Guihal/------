import { useAppDependencies } from "./useAppDependencies";

export function useIdGenerator() {
	const deps = useAppDependencies();
	if (deps?.ports.idGenerator) {
		return { generateId: deps.ports.idGenerator.generateId };
	}
	return {
		generateId: () => {
			if (typeof crypto !== "undefined" && crypto.randomUUID) {
				return crypto.randomUUID();
			}
			const c = crypto as Crypto;
			const bytes = new Uint8Array(16);
			c.getRandomValues(bytes);
			bytes[6] = (bytes[6]! & 0x0f) | 0x40;
			bytes[8] = (bytes[8]! & 0x3f) | 0x80;
			const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
			return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
		},
	};
}
