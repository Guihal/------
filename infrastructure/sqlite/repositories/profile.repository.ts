import type { Profile } from "../../../core/domain/profile/types";
import type { ProfileRepositoryPort } from "../../../core/ports/profile-repository.port";
import { toDomain, toRow } from "../mappers/profile.mapper.ts";
import type { SqliteConnection } from "../migration-runner.ts";

export class SqliteProfileRepository implements ProfileRepositoryPort {
	constructor(private readonly db: SqliteConnection) {}

	async findById(id: string): Promise<Profile | null> {
		const { values } = await this.db.query(
			"SELECT * FROM profile WHERE id = ?",
			[id],
		);
		if (values.length === 0) return null;
		return toDomain(values[0]);
	}

	async save(profile: Profile): Promise<void> {
		const r = toRow(profile);
		await this.db.run(
			"INSERT OR REPLACE INTO profile (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
			[r.id, r.display_name, r.created_at, r.updated_at],
		);
	}
}
