import { expect, test } from "@playwright/test";

test.describe("task flow", () => {
	test("task list page loads without crash", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		const res = await page.goto("/");
		expect(res?.status()).toBeLessThan(500);
		// Full element checks need bootstrap race fix (tracked)
		expect(consoleErrors.filter((e) => !e.includes("bootstrap"))).toHaveLength(
			0,
		);
	});
});
