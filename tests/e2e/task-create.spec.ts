import { expect, test } from "@playwright/test";

test.describe("task creation", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await page.addStyleTag({ content: "vite-plugin-checker-error-overlay { display: none !important; }" });
	});

	test("open and close create form", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).toBeVisible();
		await page.locator('[data-testid="btn-cancel"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();
	});

	test("create task with title only", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await page.locator('[data-testid="input-title"]').fill("Тестовая задача");
		await page.locator('[data-testid="btn-submit"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();
		await page.waitForSelector('[data-testid="task-card"]', { timeout: 5000 });
		await expect(page.locator('[data-testid="task-card"]', { hasText: "Тестовая задача" })).toBeVisible();
	});

	test("create task with all fields", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await page.locator('[data-testid="input-title"]').fill("Полная задача");
		await page.locator('[data-testid="input-description"]').fill("Описание задачи");
		await page.locator('[data-testid="input-priority"]').selectOption("high");
		await page.locator('[data-testid="input-complexity"]').selectOption("medium");
		await page.locator('[data-testid="btn-submit"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();
		const card = page.locator('[data-testid="task-card"]', { hasText: "Полная задача" });
		await expect(card).toBeVisible();
		await expect(card.locator("text=Высокий")).toBeVisible();
	});

	test("validation rejects empty title", async ({ page }) => {
		await page.locator('[data-testid="btn-add-task"]').click();
		await page.locator('[data-testid="btn-submit"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).toBeVisible();
		await expect(page.locator('[role="alert"]')).toBeVisible();
	});

	test("create multiple tasks", async ({ page }) => {
		for (let i = 1; i <= 3; i++) {
			await page.locator('[data-testid="btn-add-task"]').click();
			await page.locator('[data-testid="input-title"]').fill(`Задача ${i}`);
			await page.locator('[data-testid="btn-submit"]').click();
			await expect(page.locator('[data-testid="create-task-form"]')).not.toBeVisible();
		}
		await expect(page.locator('[data-testid="task-card"]')).toHaveCount(3);
	});
});
