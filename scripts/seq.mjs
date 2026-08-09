import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1536, height: 864 } });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERR: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await p.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
await p.mouse.move(760, 430);
const targets = [0, 350, 650, 950, 1300, 1750, 2400, 3200];
let cur = 0;
for (const t of targets) {
  const d = t - cur; cur = t;
  const steps = Math.max(1, Math.round(Math.abs(d) / 60));
  for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, Math.sign(d) * 60); await p.waitForTimeout(35); }
  await p.waitForTimeout(650);
  await p.screenshot({ path: `debug-seq-${String(t).padStart(4,'0')}.png` });
}
console.log('ERRORS:', errs.length ? '\n' + errs.join('\n') : 'none');
await b.close();
