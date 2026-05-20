import type { Progression } from "../../../core/domain/progression/types";
import type { ProgressionRepositoryPort } from "../../../core/ports/progression-repository.port";
import { toDomain, toRow } from "../mappers/progression.mapper.ts";
import type { SqliteConnection } from "../migration-runner.ts";

export class SqliteProgressionRepository implements ProgressionRepositoryPort {
	constructor(private readonly db: SqliteConnection) {}

	async findById(profileId: string): Promise<Progression | null> {
		const { values } = await this.db.query(
			"SELECT * FROM progression WHERE profile_id = ?",
			[profileId],
		);
		if (values.length === 0) return null;
		return toDomain(values[0]);
	}

	async save(progression: Progression): Promise<void> {
		const r = toRow(progression);
		await this.db.run(
			"INSERT OR REPLACE INTO progression (profile_id, level, xp_total, updated_at) VALUES (?, ?, ?, ?)",
			[r.profile_id, r.level, r.xp_total, r.updated_at],
		);
	}
}
