import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
});

await page.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
await page.screenshot({ path: 'debug-m0-orbit.png' });

await page.mouse.move(720, 450);
await page.mouse.wheel(0, 820);
await page.waitForTimeout(1300);
await page.screenshot({ path: 'debug-m1-flight.png' });

await page.mouse.wheel(0, 700);
await page.waitForTimeout(1300);
await page.screenshot({ path: 'debug-m2-panels.png' });

console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
