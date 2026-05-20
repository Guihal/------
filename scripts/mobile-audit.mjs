#!/usr/bin/env node
/**
 * Mobile viewport + accessibility audit script
 * Uses Playwright to screenshot + evaluate WCAG + tap targets
 */
import { chromium } from "playwright";

// Inline tokens from dark.ts so no TS loader needed
const DARK_TOKENS = {
	color: {
		bgBase: "#0d0d12",
		bgElevated: "#181825",
		bgCard: "#1e1e2e",
		bgOverlay: "#11111b",
		borderSubtle: "#313244",
		borderDashed: "#313244",
		textPrimary: "#cdd6f4",
		textSecondary: "#a6adc8",
		textMuted: "#6c7086",
		textInverse: "#1e1e2e",
		accentGreen: "#a6e3a1",
		accentBlue: "#89b4fa",
		accentYellow: "#f9e2af",
		accentRed: "#f38ba8",
		accentOrange: "#fab387",
		priorityLowBg: "#45475a",
		priorityLowText: "#a6adc8",
		priorityNormalBg: "#313244",
		priorityNormalText: "#89b4fa",
		priorityHighBg: "#452434",
		priorityHighText: "#f38ba8",
		statusSuccess: "#a6e3a1",
		statusWarning: "#f9e2af",
		statusError: "#f38ba8",
		statusInfo: "#89b4fa",
	},
};

import fs from "node:fs";
import path from "node:path";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

// Ensure directory exists
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const VIEWPORTS = [
	{ name: "iphone-se", width: 320, height: 568 },
	{ name: "iphone-8", width: 375, height: 667 },
	{ name: "ipad", width: 768, height: 1024 },
];

function hexToRgb(hex) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return [r, g, b];
}

function relativeLuminance([r, g, b]) {
	const toLinear = (c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	const R = toLinear(r);
	const G = toLinear(g);
	const B = toLinear(b);
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1, hex2) {
	const l1 = relativeLuminance(hexToRgb(hex1)) + 0.05;
	const l2 = relativeLuminance(hexToRgb(hex2)) + 0.05;
	return l1 > l2 ? l1 / l2 : l2 / l1;
}

function checkContrast() {
	const c = DARK_TOKENS.color;
	const textColors = {
		textPrimary: c.textPrimary,
		textSecondary: c.textSecondary,
		textMuted: c.textMuted,
		textInverse: c.textInverse,
		priorityLowText: c.priorityLowText,
		priorityNormalText: c.priorityNormalText,
		priorityHighText: c.priorityHighText,
	};
	const bgColors = {
		bgBase: c.bgBase,
		bgElevated: c.bgElevated,
		bgCard: c.bgCard,
		bgOverlay: c.bgOverlay,
		priorityLowBg: c.priorityLowBg,
		priorityNormalBg: c.priorityNormalBg,
		priorityHighBg: c.priorityHighBg,
		accentGreen: c.accentGreen,
		accentBlue: c.accentBlue,
		accentYellow: c.accentYellow,
		accentRed: c.accentRed,
		accentOrange: c.accentOrange,
	};

	const issues = [];
	const notes = [];

	for (const [tName, tHex] of Object.entries(textColors)) {
		for (const [bName, bHex] of Object.entries(bgColors)) {
			const ratio = contrastRatio(tHex, bHex);
			if (ratio < 4.5) {
				issues.push({
					pair: `${tName} on ${bName}`,
					ratio: +ratio.toFixed(2),
					hex: `${tHex} on ${bHex}`,
				});
			} else if (ratio < 7) {
				notes.push({
					pair: `${tName} on ${bName}`,
					ratio: +ratio.toFixed(2),
					note: "AA pass, not AAA",
				});
			}
		}
	}
	return { issues, notes };
}

async function audit() {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		baseURL: "http://localhost:3000",
	});
	const page = await context.newPage();

	const screenshotsTaken = [];
	let responsiveOk = true;
	let tapTargetsOk = true;
	const notes = [];

	// Screenshot each viewport
	for (const vp of VIEWPORTS) {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.goto("/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);
		const fileName = `${vp.name}-${vp.width}x${vp.height}.png`;
		const filePath = path.join(SCREENSHOT_DIR, fileName);
		await page.screenshot({ path: filePath, fullPage: false });
		screenshotsTaken.push(fileName);

		// Check horizontal scroll
		const hasScroll = await page.evaluate(() => {
			return (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			);
		});
		if (hasScroll) {
			responsiveOk = false;
			notes.push(`Horizontal scroll detected at ${vp.name} (${vp.width}px)`);
		}
	}

	// Tap target check at iPhone SE size (worst case)
	await page.setViewportSize({ width: 320, height: 568 });
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForTimeout(500);

	const tapTargets = await page.evaluate(() => {
		const interactive = document.querySelectorAll(
			'button, a, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"])',
		);
		const small = [];
		interactive.forEach((el) => {
			const rect = el.getBoundingClientRect();
			if (rect.width < 44 || rect.height < 44) {
				small.push({
					tag: el.tagName,
					classes: el.className,
					width: Math.round(rect.width),
					height: Math.round(rect.height),
				});
			}
		});
		return small;
	});

	if (tapTargets.length > 0) {
		tapTargetsOk = false;
		notes.push(`${tapTargets.length} tap targets < 44×44px on 320px viewport`);
		tapTargets.slice(0, 10).forEach((t) => {
			notes.push(`  ${t.tag}.${t.classes} → ${t.width}×${t.height}`);
		});
	}

	// Extra screenshot full-page iPhone SE
	const fullPageFile = "iphone-se-320x568-full.png";
	await page.screenshot({
		path: path.join(SCREENSHOT_DIR, fullPageFile),
		fullPage: true,
	});
	screenshotsTaken.push(fullPageFile);

	// Check for alt text on images
	const missingAlt = await page.evaluate(() => {
		const imgs = document.querySelectorAll("img");
		return Array.from(imgs).filter((img) => !img.alt).length;
	});
	if (missingAlt > 0) notes.push(`${missingAlt} images without alt text`);

	// Check for heading structure
	const headings = await page.evaluate(() => {
		return Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(
			(h) => ({
				level: h.tagName,
				text: h.textContent?.slice(0, 40) || "",
			}),
		);
	});
	notes.push(
		`Heading structure: ${headings.map((h) => h.level).join(", ") || "none"}`,
	);

	await browser.close();

	// Contrast
	const { issues, notes: contrastNotes } = checkContrast();
	for (const n of contrastNotes.slice(0, 5)) {
		notes.push(`Contrast note: ${n.pair} = ${n.ratio}:1 (${n.note})`);
	}

	const result = {
		screenshots_taken: screenshotsTaken,
		contrast_issues: issues.map((i) => `${i.pair}: ${i.ratio}:1 (${i.hex})`),
		responsive_ok: responsiveOk,
		tap_targets_ok: tapTargetsOk,
		notes,
	};

	console.log("=== AUDIT RESULT ===");
	console.log(JSON.stringify(result, null, 2));

	// Also write to file
	fs.writeFileSync(
		path.join(SCREENSHOT_DIR, "audit-result.json"),
		JSON.stringify(result, null, 2),
	);

	process.exit(responsiveOk && tapTargetsOk && issues.length === 0 ? 0 : 1);
}

audit().catch((e) => {
	console.error(e);
	process.exit(1);
});
