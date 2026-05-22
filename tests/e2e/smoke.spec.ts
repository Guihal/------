import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
	test("page loads without crash", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		const res = await page.goto("/");
		expect(res?.status()).toBeLessThan(500);
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await expect(page.locator('[data-testid="btn-add-task"]')).toBeVisible();
		expect(consoleErrors.filter((e) => !e.includes("bootstrap"))).toHaveLength(0);
	});

	test("app header renders with title and profile link", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await expect(page.locator("h1", { hasText: "Таск Компаньон" })).toBeVisible();
		await expect(page.locator('a[href="/profile"]')).toBeVisible();
	});

	test("task groups render on homepage", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".boot-screen")).not.toBeVisible({ timeout: 10000 });
		await expect(page.locator('[data-testid="group-просроченные"]')).toBeVisible();
		await expect(page.locator('[data-testid="group-предстоящие"]')).toBeVisible();
		await expect(page.locator('[data-testid="group-без-дедлайна"]')).toBeVisible();
		await expect(page.locator('[data-testid="group-выполненные"]')).toBeVisible();
	});
});
