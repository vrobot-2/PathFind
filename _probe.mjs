import { chromium } from "playwright";
const B = "http://localhost:5173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto(B + "/?demo=1", { waitUntil: "domcontentloaded" });

let clean = false;
for (let i = 0; i < 60; i++) {
  await p.waitForTimeout(500);
  clean = await p.evaluate(
    () => document.querySelector("main")?.dataset.cleanMap === "true",
  );
  if (clean) break;
}
console.log("clean map reached:", clean);
await p.waitForTimeout(3000);

const chrome = await p.evaluate(() => ({
  zoom: document.querySelectorAll(".leaflet-control-zoom").length,
  pill: !!document.querySelector('[data-testid="profile-menu-pill"]'),
  trails: document.body.innerText.includes("Trails for you"),
  hud: document.body.innerText.includes("On the move"),
}));
console.log("chrome:", JSON.stringify(chrome));

const samples = [];
for (let i = 0; i < 4; i++) {
  await p.waitForTimeout(2500);
  samples.push(
    await p.evaluate(() => {
      const mapEl = document.querySelector(".leaflet-container");
      const marker = [...document.querySelectorAll(".leaflet-marker-icon")].find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 10 && r.width <= 30;
      });
      if (!mapEl || !marker) return null;
      const mb = mapEl.getBoundingClientRect();
      const r = marker.getBoundingClientRect();
      return {
        frac: +((r.top + r.height / 2 - mb.top) / mb.height).toFixed(3),
        hud: document.body.innerText.includes("On the move"),
      };
    }),
  );
}
console.log("walker samples:", JSON.stringify(samples));
await p.screenshot({ path: "qa-clean-map.png" });
console.log("errors:", errs.slice(0, 3));
await browser.close();
