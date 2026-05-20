import type { Profile } from "../domain/profile/types";

export interface ProfileRepositoryPort {
	findById(id: string): Promise<Profile | null>;
	save(profile: Profile): Promise<void>;
}
