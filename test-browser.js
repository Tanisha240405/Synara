import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3002/login?callbackUrl=%2Fimport', { waitUntil: 'networkidle' });
  
  await page.fill('input[type="email"]', 'demo@xenoreach.ai');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:3002/import', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  console.log('Clicking Generate Mock Data...');
  await page.click('button:has-text("Generate Mock Data")');
  await page.waitForTimeout(2000);
  
  console.log('Clicking View Shoppers...');
  await page.click('button:has-text("View Shoppers")');
  await page.waitForTimeout(2000);
  
  await browser.close();
})().catch(console.error);
