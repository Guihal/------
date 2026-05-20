import type { Task } from "../domain/task/types";

export interface TaskRepositoryPort {
	findById(profileId: string, id: string): Promise<Task | null>;
	findAll(profileId: string): Promise<readonly Task[]>;
	save(task: Task): Promise<void>;
	delete(profileId: string, id: string): Promise<void>;
}
