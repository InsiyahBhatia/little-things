import subprocess, os, time

# Test entering shop and capturing interior
script_js = """
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  // Walk up to door
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/screenshots/shop_interior_gameplay.png' });
  await browser.close();
})();
"""
