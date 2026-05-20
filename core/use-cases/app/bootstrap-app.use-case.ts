import type { Profile } from "../../core/domain/profile/types";
import type { Progression } from "../../core/domain/progression/types";
import type { Task } from "../../core/domain/task/types";
import type { AppDependencies } from "../../infrastructure/di/app-dependencies";
import { bootstrapDependencies } from "../../../infrastructure/di/bootstrap-app";

export type BootstrapState = {
	readonly profile: Profile;
	readonly progression: Progression;
	readonly tasks: readonly Task[];
};

export type BootstrapResult =
	| { readonly ok: true; readonly state: BootstrapState }
	| { readonly ok: false; readonly error: string };

const DEFAULT_PROFILE_ID = "default";

export async function bootstrapApp(
	depsFactory: () => Promise<AppDependencies> = bootstrapDependencies,
): Promise<BootstrapResult> {
	let deps: AppDependencies;
	try {
		deps = await depsFactory();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return {
			ok: false,
			error: `[bootstrap] dependency bootstrap failed: ${msg}`,
		};
	}

	const profile = await ensureProfile(deps);
	const progression = await ensureProgression(deps, profile.id);
	const tasks = await deps.ports.taskRepository.findAll(profile.id);

	return {
		ok: true,
		state: {
			profile,
			progression,
			tasks,
		},
	};
}

async function ensureProfile(deps: AppDependencies): Promise<Profile> {
	const existing =
		await deps.ports.profileRepository.findById(DEFAULT_PROFILE_ID);
	if (existing) {
		return existing;
	}

	const now = deps.ports.clock.nowIso();
	const profile: Profile = {
		id: DEFAULT_PROFILE_ID,
		name: "User",
		createdAt: now,
		updatedAt: now,
	};
	await deps.ports.profileRepository.save(profile);
	return profile;
}

async function ensureProgression(
	deps: AppDependencies,
	profileId: string,
): Promise<Progression> {
	const existing = await deps.ports.progressionRepository.findById(profileId);
	if (existing) {
		return existing;
	}

	const now = deps.ports.clock.nowIso();
	const progression: Progression = {
		profileId,
		totalXp: 0,
		updatedAt: now,
	};
	await deps.ports.progressionRepository.save(progression);
	return progression;
}
