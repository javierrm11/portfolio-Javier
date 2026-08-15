import { chromium } from "playwright";
const browser = await chromium.launch();
for (const [w, h, tag] of [[393, 852, "movil"], [820, 1180, "tablet"]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true })).newPage();
  await page.goto("http://localhost:4321/", { waitUntil: "networkidle" });
  await page.waitForSelector("#page-loader.is-done", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `hero-${tag}.png` });
  await page.close();
}
await browser.close();
