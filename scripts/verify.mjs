import { chromium } from '@playwright/test';

const browser = await chromium.launch();

// list mode
const listCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await listCtx.addInitScript(() => localStorage.setItem('wishlist.view-mode', 'list'));
const listPage = await listCtx.newPage();
await listPage.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await listPage.waitForTimeout(2500);
await listPage.screenshot({ path: 'debug-list.png' });
await listCtx.close();

// flight mid-scroll (orbit mode)
const flyCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const flyPage = await flyCtx.newPage();
await flyPage.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await flyPage.waitForTimeout(2500);
await flyPage.mouse.move(720, 450);
await flyPage.mouse.wheel(0, 700);
await flyPage.waitForTimeout(1600);
await flyPage.screenshot({ path: 'debug-flight.png' });

// admin
await flyPage.goto('http://localhost:5173/admin/demo', { waitUntil: 'domcontentloaded' });
await flyPage.waitForTimeout(2500);
await flyPage.screenshot({ path: 'debug-admin.png' });
await flyCtx.close();

await browser.close();
console.log('done');
