import { chromium } from '@playwright/test';

const url = process.argv[2] || 'http://localhost:3000';
const outDir = process.argv[3] || 'docs/polish-cycles/cycle-20260520-090427';

const viewports = [
  { w: 320, h: 568 },
  { w: 375, h: 667 },
  { w: 768, h: 1024 },
  { w: 1280, h: 800 },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${outDir}/screenshot-${vp.w}x${vp.h}.png`, fullPage: true });
  console.log(`screenshot ${vp.w}x${vp.h} done`);
}

await browser.close();
