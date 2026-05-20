import type { Profile } from "../../../core/domain/profile/types";
import type { ProfileRepositoryPort } from "../../../core/ports/profile-repository.port";

export class MemoryProfileRepository implements ProfileRepositoryPort {
	private profiles = new Map<string, Profile>();

	async findById(id: string): Promise<Profile | null> {
		return this.profiles.get(id) ?? null;
	}

	async save(profile: Profile): Promise<void> {
		this.profiles.set(profile.id, profile);
	}

	snapshot(): Map<string, Profile> {
		return structuredClone(this.profiles);
	}

	restore(snapshot: Map<string, Profile>): void {
		this.profiles = snapshot;
	}
}
