const { test, expect } = require('@playwright/test');

async function fazerLoginPadrao(page) {
  await page.goto('/');
  await page.locator('input[type="email"]').fill('admin@cnestetica.com');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /entrar no sistema/i }).click();
  await expect(page.getByRole('heading', { name: /clientes cadastrados/i })).toBeVisible();
}

test.describe('CRUDs Completos (Clientes e Procedimentos)', () => {
  test('CRUD Clientes: falha ao salvar vazio e fluxo completo (cadastrar, listar, editar, excluir)', async ({ page }) => {
    await fazerLoginPadrao(page);

    await page.getByRole('button', { name: /\+ novo cliente/i }).click();
    await page.getByRole('button', { name: /^salvar$/i }).click();
    await expect(page.getByRole('heading', { name: /novo cliente/i })).toBeVisible();

    const nomeOriginal = `Cliente E2E ${Date.now()}`;
    const nomeEditado = `${nomeOriginal} Editado`;

    page.once('dialog', async (dialog) => dialog.accept());
    await page.locator('input[type="text"]').first().fill(nomeOriginal);
    await page.getByPlaceholder('(11) 99999-9999').fill('(44) 99999-1111');
    await page.getByRole('button', { name: /^salvar$/i }).click();

    await page.waitForURL('**/clientes');
    const linhaCriada = page.locator('tr', { hasText: nomeOriginal });
    await expect(linhaCriada).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await linhaCriada.getByRole('button', { name: /editar/i }).click();
    await page.locator('input[type="text"]').first().fill(nomeEditado);
    await page.getByRole('button', { name: /^salvar$/i }).click();

    await page.waitForURL('**/clientes');
    const linhaEditada = page.locator('tr', { hasText: nomeEditado });
    await expect(linhaEditada).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await linhaEditada.getByRole('button', { name: /excluir/i }).click();
    await expect(page.locator('tr', { hasText: nomeEditado })).toHaveCount(0);
  });

  test('CRUD Procedimentos: falha ao enviar dados inválidos e fluxo completo (cadastrar, listar, editar, excluir)', async ({ page }) => {
    await fazerLoginPadrao(page);

    await page.goto('/procedimentos');
    await page.getByRole('button', { name: /\+ novo procedimento/i }).click();

    page.once('dialog', async (dialog) => dialog.accept());
    await page.locator('input[type="text"]').fill('Procedimento Inválido');
    await page.locator('input[type="number"]').first().fill('0');
    await page.locator('input[type="number"]').nth(1).fill('0');
    await page.getByRole('button', { name: /^salvar$/i }).click();

    const nomeProc = `Limpeza E2E ${Date.now()}`;
    const nomeProcEditado = `${nomeProc} VIP`;

    page.once('dialog', async (dialog) => dialog.accept());
    await page.locator('input[type="text"]').fill(nomeProc);
    await page.locator('textarea').fill('Avaliação facial completa');
    await page.locator('input[type="number"]').first().fill('150');
    await page.locator('input[type="number"]').nth(1).fill('60');
    await page.getByRole('button', { name: /^salvar$/i }).click();

    await page.waitForURL('**/procedimentos');
    const linhaProc = page.locator('tr', { hasText: nomeProc });
    await expect(linhaProc).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await linhaProc.getByRole('button', { name: /editar/i }).click();
    await page.locator('input[type="text"]').fill(nomeProcEditado);
    await page.locator('input[type="number"]').first().fill('220');
    await page.getByRole('button', { name: /^salvar$/i }).click();

    await page.waitForURL('**/procedimentos');
    const linhaProcEditada = page.locator('tr', { hasText: nomeProcEditado });
    await expect(linhaProcEditada).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await linhaProcEditada.getByRole('button', { name: /excluir/i }).click();
    await expect(page.locator('tr', { hasText: nomeProcEditado })).toHaveCount(0);
  });
});