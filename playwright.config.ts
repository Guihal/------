import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 720 },
			},
		},
		{
			name: "mobile",
			use: {
				...devices["iPhone 6/7/8"],
				viewport: { width: 375, height: 667 },
			},
		},
		{
			name: "tablet",
			use: { ...devices["iPad Mini"], viewport: { width: 768, height: 1024 } },
		},
	],

	webServer: {
		command: "bun run dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 120 * 1000,
	},
});
