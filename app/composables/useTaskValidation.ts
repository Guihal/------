const MAX_TITLE = 100;
const MAX_DESCRIPTION = 2000;

export type TaskValidationResult = { ok: true } | { ok: false; error: string };

export function useTaskValidation() {
	function validateTitle(title: string): TaskValidationResult {
		const t = title.trim();
		if (t.length === 0) return { ok: false, error: "Название обязательно" };
		if (t.length > MAX_TITLE)
			return { ok: false, error: `Название не более ${MAX_TITLE} символов` };
		return { ok: true };
	}

	function validateDescription(
		description: string | null,
	): TaskValidationResult {
		if (description && description.length > MAX_DESCRIPTION) {
			return {
				ok: false,
				error: `Описание не более ${MAX_DESCRIPTION} символов`,
			};
		}
		return { ok: true };
	}

	return { validateTitle, validateDescription, MAX_TITLE, MAX_DESCRIPTION };
}
