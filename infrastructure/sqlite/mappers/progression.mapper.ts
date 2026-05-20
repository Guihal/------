import { computeLevel } from "../../../core/domain/progression/compute";
import type { Progression } from "../../../core/domain/progression/types";

export type ProgressionRow = {
	profile_id: string;
	level: number;
	xp_total: number;
	updated_at: string;
};

function assertString(value: unknown, field: string): string {
	if (typeof value !== "string") {
		throw new TypeError(`Expected ${field} to be string, got ${typeof value}`);
	}
	return value;
}

function assertNumber(value: unknown, field: string): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		throw new TypeError(`Expected ${field} to be number, got ${typeof value}`);
	}
	return value;
}

export function toDomain(row: unknown): Progression {
	if (row === null || typeof row !== "object") {
		throw new TypeError(`Expected row to be an object, got ${typeof row}`);
	}
	const r = row as Record<string, unknown>;

	return {
		profileId: assertString(r.profile_id, "profile_id"),
		totalXp: assertNumber(r.xp_total, "xp_total"),
		updatedAt: assertString(r.updated_at, "updated_at"),
	};
}

export function toRow(progression: Progression): ProgressionRow {
	return {
		profile_id: progression.profileId,
		level: computeLevel(progression.totalXp) + 1,
		xp_total: progression.totalXp,
		updated_at: progression.updatedAt,
	};
}
