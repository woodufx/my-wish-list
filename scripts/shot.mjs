import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:5173/wishlist/demo';
const out = process.argv[3] ?? 'debug-shot.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(url, { waitUntil: 'domcontentloaded' }).catch((e) => errors.push('GOTO: ' + e.message));
await page.waitForTimeout(7000);
await page.screenshot({ path: out });
await page.waitForTimeout(200);

console.log('URL:', url);
console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
