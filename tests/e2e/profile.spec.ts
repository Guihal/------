import { expect, test } from "@playwright/test";

test.describe("profile page", () => {
	test("loads and shows ProfileLevel", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto("/profile");
		await expect(page.locator("text=Profile")).toBeVisible();
		await expect(page.locator('[data-testid="profile-level"]')).toBeVisible();
		await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
		await expect(
			page.locator('[data-testid="profile-level-badge"]'),
		).toBeVisible();
		await expect(page.locator('[data-testid="xp-bar-fill"]')).toBeAttached();

		expect(consoleErrors).toHaveLength(0);
	});
});
