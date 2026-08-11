import { chromium } from '@playwright/test';
const browser = await chromium.launch();
// name, w, h  — includes the 1:1 case the user flagged
const VPS = [
  ['sq-1080', 1080, 1080],
  ['sq-900', 900, 900],
  ['ratio-4x3', 1024, 768],
  ['tablet', 768, 1024],
  ['wide-16x9', 1920, 1080],
  ['laptop', 1366, 768],
];
for (const [name, w, h] of VPS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('wishlist.view-mode', 'orbit'); } catch {} });
  await page.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const info = await page.evaluate((W) => {
    const overflowX = document.documentElement.scrollWidth > W + 2;
    const h1 = document.querySelector('h1');
    const clip = [];
    // find any element wider than the viewport or extending past right/left edge
    document.querySelectorAll('h1,h2,h3,[class*="hero"],[class*="s2"],[class*="detail"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > W + 1 || r.left < -1)) clip.push({ c: el.className.toString().slice(0, 24), l: Math.round(r.left), r: Math.round(r.right) });
    });
    return { overflowX, docScrollW: document.documentElement.scrollWidth, heroFont: h1 ? getComputedStyle(h1).fontSize : null, clip: clip.slice(0, 8) };
  }, w);
  console.log(name, JSON.stringify(info));
  await page.screenshot({ path: `scripts/sweep-${name}-orbit.png` });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `scripts/sweep-${name}-list.png` });
  await ctx.close();
}
await browser.close();
