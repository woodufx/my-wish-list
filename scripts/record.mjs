import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: 'debug-video', size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
await page.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
await page.mouse.move(720, 450);
// scroll down through orbit -> flight -> panels -> list
for (let i = 0; i < 48; i++) { await page.mouse.wheel(0, 42); await page.waitForTimeout(55); }
await page.waitForTimeout(700);
// scroll back up (reverse collects cards)
for (let i = 0; i < 48; i++) { await page.mouse.wheel(0, -42); await page.waitForTimeout(55); }
await page.waitForTimeout(600);
const video = page.video();
await ctx.close();
console.log('video:', video ? await video.path() : 'none');
await browser.close();
