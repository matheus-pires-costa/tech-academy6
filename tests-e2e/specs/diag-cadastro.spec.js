const { test } = require('@playwright/test');

test('Diagnóstico da rota /cadastro', async ({ page }) => {
  page.on('pageerror', (err) => {
    console.log('PAGEERROR:', err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('CONSOLE_ERROR:', msg.text());
    }
  });

  await page.goto('/cadastro', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('URL FINAL:', page.url());
  console.log('BODY TEXT:', (await page.locator('body').innerText()).slice(0, 600));
});