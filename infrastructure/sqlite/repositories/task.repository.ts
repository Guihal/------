import type { Task } from "../../../core/domain/task/types";
import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port";
import { toDomain, toRow } from "../mappers/task.mapper.ts";
import type { SqliteConnection } from "../migration-runner.ts";

export class SqliteTaskRepository implements TaskRepositoryPort {
	constructor(private readonly db: SqliteConnection) {}

	async findById(profileId: string, id: string): Promise<Task | null> {
		const { values } = await this.db.query(
			"SELECT * FROM tasks WHERE profile_id = ? AND id = ?",
			[profileId, id],
		);
		if (values.length === 0) return null;
		return toDomain(values[0]);
	}

	async findAll(profileId: string): Promise<readonly Task[]> {
		const { values } = await this.db.query(
			"SELECT * FROM tasks WHERE profile_id = ?",
			[profileId],
		);
		return values.map(toDomain);
	}

	async save(task: Task): Promise<void> {
		const r = toRow(task);
		await this.db.run(
			`INSERT OR REPLACE INTO tasks (
        id, profile_id, title, description, status, priority,
        complexity, complexity_source, due_at, created_at, updated_at,
        completed_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				r.id,
				r.profile_id,
				r.title,
				r.description,
				r.status,
				r.priority,
				r.complexity,
				r.complexity_source,
				r.due_at,
				r.created_at,
				r.updated_at,
				r.completed_at,
				r.archived_at,
			],
		);
	}

	async delete(profileId: string, id: string): Promise<void> {
		await this.db.run("DELETE FROM tasks WHERE profile_id = ? AND id = ?", [
			profileId,
			id,
		]);
	}
}
