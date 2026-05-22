import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
	test("navigate from home to profile", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await page.locator('a[href="/profile"]').click();
		await expect(page.locator('h1:has-text("Профиль")')).toBeVisible();
	});

	test("navigate from profile to home via back", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await page.locator('a[href="/profile"]').click();
		await expect(page.locator('h1:has-text("Профиль")')).toBeVisible();
		await page.goBack();
		await expect(page.locator('[data-testid="btn-add-task"]')).toBeVisible();
	});

	test("profile page shows level and xp", async ({ page }) => {
		await page.goto("/profile");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await expect(page.locator('[data-testid="profile-level"]')).toBeVisible();
		await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
		await expect(page.locator('[data-testid="profile-level-badge"]')).toBeVisible();
		await expect(page.locator('[data-testid="xp-bar-fill"]')).toBeAttached();
	});

	test("profile page shows avatar", async ({ page }) => {
		await page.goto("/profile");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await expect(page.locator('[data-testid="profile-avatar"]')).toBeVisible();
	});
});
