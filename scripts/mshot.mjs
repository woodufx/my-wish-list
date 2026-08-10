import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem('wishlist.view-mode', 'orbit');
  } catch {}
});
await page.goto('http://localhost:5173/wishlist/demo', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4500);

const info = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const fill = document.querySelector('[class*="s2Fill"]');
  const stage = document.querySelector('[class*="stage"]');
  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    dpr: window.devicePixelRatio,
    stageW: stage ? Math.round(stage.getBoundingClientRect().width) : null,
    stageTransform: stage ? getComputedStyle(stage).transform : null,
    heroRight: h1 ? Math.round(h1.getBoundingClientRect().right) : null,
    heroLeft: h1 ? Math.round(h1.getBoundingClientRect().left) : null,
    heroFontFamily: h1 ? getComputedStyle(h1).fontFamily : null,
    heroFontSize: h1 ? getComputedStyle(h1).fontSize : null,
    s2FillFont: fill ? getComputedStyle(fill).fontSize : null,
    oswaldLoaded: document.fonts.check('700 62px Oswald'),
    canvases: document.querySelectorAll('canvas').length,
  };
});
console.log('ORBIT', JSON.stringify(info));
await page.screenshot({ path: 'scripts/mobile-orbit.png' });

await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(3000);
const list = await page.evaluate(() => {
  const fill = document.querySelector('[class*="s2Fill"]');
  const r = fill ? fill.getBoundingClientRect() : null;
  return {
    s2FillRight: r ? Math.round(r.right) : null,
    s2FillLeft: r ? Math.round(r.left) : null,
    s2FillFont: fill ? getComputedStyle(fill).fontSize : null,
  };
});
console.log('LIST', JSON.stringify(list));
await page.screenshot({ path: 'scripts/mobile-list.png' });

await browser.close();
