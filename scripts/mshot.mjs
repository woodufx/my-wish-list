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
    heroScrollW: h1 ? h1.scrollWidth : null,
    heroClipped: h1 ? h1.scrollWidth + h1.getBoundingClientRect().left > 390 : null,
    oswaldLoaded: document.fonts.check('700 62px Oswald'),
    canvases: document.querySelectorAll('canvas').length,
  };
});
console.log('ORBIT', JSON.stringify(info));
await page.screenshot({ path: 'scripts/mobile-orbit.png' });

// mid-scroll: the 3D should be parked near the cards, not shoved off-right
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(1600);
await page.screenshot({ path: 'scripts/mobile-mid.png' });

await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(3000);
const list = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const b = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) };
  };
  const fill = q('[class*="s2Fill"]');
  const label = q('[class*="s2Label"]');
  const rule = q('[class*="s2Rule"]');
  return {
    fill: b(fill),
    fillFont: fill ? getComputedStyle(fill).fontSize : null,
    label: b(label),
    labelText: label ? label.textContent : null,
    labelFont: label ? getComputedStyle(label).fontSize : null,
    rule: b(rule),
    ruleHeight: rule ? getComputedStyle(rule).height : null,
  };
});
console.log('LIST', JSON.stringify(list));
await page.screenshot({ path: 'scripts/mobile-list.png' });
if (list.fill) {
  const top = Math.max(0, list.fill.t - 20);
  await page.screenshot({
    path: 'scripts/mobile-heading.png',
    clip: { x: 0, y: top, width: 390, height: Math.min(300, 844 - top) },
  });
}

await browser.close();
