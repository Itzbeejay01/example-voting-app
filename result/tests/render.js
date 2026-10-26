const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.argv[2], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.textContent.includes('vote'), null, { timeout: 15000 });
  console.log(await page.content());
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
