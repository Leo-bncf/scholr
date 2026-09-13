import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: 'new' });
const p = await b.newPage();
let bad = 0;
for (const w of [390, 768, 1280, 1440]) {
  await p.setViewport({ width: w, height: 900 });
  for (const r of ['/','/Schedual','/ib-school-management-software','/Pricing','/FAQ','/About','/Contact','/Login']) {
    await p.goto('http://localhost:5199'+r, { waitUntil:'networkidle0', timeout:45000 });
    await new Promise(x=>setTimeout(x,250));
    const res = await p.evaluate(() => ({
      hs: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      wrapped: [...document.querySelectorAll('.pub-btn, nav a, footer a')].filter(a=>a.getClientRects().length>1).map(a=>a.textContent.trim().slice(0,24)),
    }));
    if (res.hs || res.wrapped.length) { bad++; console.log(String(w).padEnd(6), r.padEnd(34), res.hs?'H-SCROLL':'', res.wrapped.join(' | ')); }
  }
}
console.log(bad ? `\n${bad} problem(s)` : 'all widths: no overflow, no wrapped affordances');
await b.close();
