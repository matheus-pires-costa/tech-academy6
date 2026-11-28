const { test, expect } = require('@playwright/test');

test.describe('Autenticação e Criação de Usuário', () => {
  test('Login: caso de falha com credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('naoexiste@cnestetica.local');
    await page.locator('input[type="password"]').fill('SenhaInvalida1');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('Criação de usuário: caso de falha quando senhas não coincidem', async ({ page }) => {
    await page.goto('/cadastro');
    await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: 15000 });

    await page.getByRole('textbox').nth(0).fill('Teste Falha');
    await page.getByRole('textbox').nth(1).fill('falha@cnestetica.local');
    await page.getByRole('textbox').nth(2).fill('12345678901');
    await page.locator('input[type="password"]').nth(0).fill('Teste1234');
    await page.locator('input[type="password"]').nth(1).fill('Diferente1234');
    await page.getByRole('button', { name: /registar|cadastrar|salvar|criar/i }).click();

    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('Criação de usuário: caso de sucesso e Login: caso de sucesso', async ({ page }) => {
    const sufixo = Date.now().toString().slice(-6);
    const emailNovo = `usuario${sufixo}@cnestetica.local`;
    const cpfNovo = `9${Date.now().toString().slice(-10)}`;
    const senhaValida = 'Estetica123';

    await page.goto('/cadastro');
    await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: 15000 });

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole('textbox').nth(0).fill(`Usuario E2E ${sufixo}`);
    await page.getByRole('textbox').nth(1).fill(emailNovo);
    await page.getByRole('textbox').nth(2).fill(cpfNovo);
    await page.locator('input[type="password"]').nth(0).fill(senhaValida);
    await page.locator('input[type="password"]').nth(1).fill(senhaValida);
    await page.getByRole('button', { name: /registar|cadastrar|salvar|criar/i }).click();

    await page.waitForURL('**/');
    await page.locator('input[type="email"]').fill(emailNovo);
    await page.locator('input[type="password"]').fill(senhaValida);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible({ timeout: 15000 });
  });
});