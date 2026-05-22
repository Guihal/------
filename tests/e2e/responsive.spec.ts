import { expect, test } from "@playwright/test";

test.describe("responsive", () => {
	test("mobile viewport renders without horizontal scroll", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		const viewportWidth = await page.evaluate(() => window.innerWidth);
		expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
	});

	test("tablet viewport renders task list", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await expect(page.locator('[data-testid="btn-add-task"]')).toBeVisible();
		await expect(page.locator('[data-testid="group-предстоящие"]')).toBeVisible();
	});

	test("mobile create form fits viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await page.locator('[data-testid="btn-add-task"]').click();
		await expect(page.locator('[data-testid="create-task-form"]')).toBeVisible();
		const formBox = await page.locator('[data-testid="create-task-form"]').boundingBox();
		expect(formBox?.width).toBeLessThanOrEqual(375);
	});
});
