const { test, expect } = require('@playwright/test');

test.describe('Autenticação e Criação de Usuário', () => {
  test('Login: caso de falha com credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('naoexiste@cnestetica.local');
    await page.locator('input[type="password"]').fill('SenhaInvalida1');
    await page.getByRole('button', { name: /entrar no sistema/i }).click();

    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('Criação de usuário: caso de falha quando senhas não coincidem', async ({ page }) => {
    await page.goto('/cadastro');
    await page.getByPlaceholder('Nome Completo').fill('Teste Falha');
    await page.getByPlaceholder('E-mail').fill('falha@cnestetica.local');
    await page.getByPlaceholder('CPF (Apenas números)').fill('12345678901');
    await page.getByPlaceholder(/palavra-passe \(mín\. 8/i).fill('Teste1234');
    await page.getByPlaceholder('Confirmar Palavra-passe').fill('Diferente1234');
    await page.getByRole('button', { name: /registar/i }).click();

    await expect(page.locator('.alert-danger')).toContainText(/não coincidem/i);
  });

  test('Criação de usuário: caso de sucesso e Login: caso de sucesso', async ({ page }) => {
    const sufixo = Date.now().toString().slice(-6);
    const emailNovo = `usuario${sufixo}@cnestetica.local`;
    const cpfNovo = `9${Date.now().toString().slice(-10)}`;
    const senhaValida = 'Estetica123';

    await page.goto('/cadastro');
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/conta criada com sucesso/i);
      await dialog.accept();
    });

    await page.getByPlaceholder('Nome Completo').fill(`Usuário E2E ${sufixo}`);
    await page.getByPlaceholder('E-mail').fill(emailNovo);
    await page.getByPlaceholder('CPF (Apenas números)').fill(cpfNovo);
    await page.getByPlaceholder(/palavra-passe \(mín\. 8/i).fill(senhaValida);
    await page.getByPlaceholder('Confirmar Palavra-passe').fill(senhaValida);
    await page.getByRole('button', { name: /registar/i }).click();

    await page.waitForURL('**/');
    await page.locator('input[type="email"]').fill(emailNovo);
    await page.locator('input[type="password"]').fill(senhaValida);
    await page.getByRole('button', { name: /entrar no sistema/i }).click();

    await expect(page.getByRole('heading', { name: /clientes cadastrados/i })).toBeVisible();
  });
});