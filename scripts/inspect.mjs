import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);

const info = await page.evaluate(() => {
  const arts = [...document.querySelectorAll('article')];
  const stage = arts[0]?.parentElement?.parentElement ?? null;
  const rr = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    articleCount: arts.length,
    stage: stage ? { rect: rr(stage), childCount: stage.children.length } : null,
    slots: arts.slice(0, 8).map((a) => {
      const slot = a.parentElement;
      return { transform: slot.style.transform, opacity: slot.style.opacity, rect: rr(slot) };
    }),
    docHeight: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(info, null, 2));

await page.screenshot({ path: 'debug-full.png', fullPage: true });
await browser.close();
