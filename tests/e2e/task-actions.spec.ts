import { expect, test } from "@playwright/test";

test.describe("task actions", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await page.addStyleTag({ content: "vite-plugin-checker-error-overlay { display: none !important; }" });
	});

	test("complete task moves it to completed section", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await page.locator('[data-testid="input-title"]').fill("Задача на выполнение");
		await page.locator('[data-testid="btn-submit"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();

		const activeCard = page.locator('[data-testid="group-без-дедлайна"] [data-testid="task-card"]', { hasText: "Задача на выполнение" });
		await expect(activeCard).toBeVisible();
		await activeCard.locator('[data-testid="btn-complete"]').click();
		await expect(activeCard).not.toBeVisible();

		const completedGroup = page.locator('[data-testid="group-выполненные"]');
		await expect(completedGroup.locator('[data-testid="task-card"]', { hasText: "Задача на выполнение" })).toBeVisible();
	});

	test("archive task removes it from active", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await page.locator('[data-testid="input-title"]').fill("Задача в архив");
		await page.locator('[data-testid="btn-submit"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();

		const activeCard = page.locator('[data-testid="group-без-дедлайна"] [data-testid="task-card"]', { hasText: "Задача в архив" });
		await expect(activeCard).toBeVisible();
		await activeCard.locator('[data-testid="btn-archive"]').click();
		await expect(activeCard).not.toBeVisible();
	});

	test("completed task appears in completed group", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await page.locator('[data-testid="input-title"]').fill("Завершённая");
		await page.locator('[data-testid="btn-submit"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();

		const activeCard = page.locator('[data-testid="group-без-дедлайна"] [data-testid="task-card"]', { hasText: "Завершённая" });
		await expect(activeCard).toBeVisible();
		await activeCard.locator('[data-testid="btn-complete"]').click();
		await expect(activeCard).not.toBeVisible();

		const completedGroup = page.locator('[data-testid="group-выполненные"]');
		await expect(completedGroup.locator('[data-testid="task-card"]', { hasText: "Завершённая" })).toBeVisible();
	});
});
