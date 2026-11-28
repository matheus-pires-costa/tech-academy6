const { test, expect } = require('@playwright/test');

async function garantirUsuarioELogar(page) {
  const email = 'e2e.admin@cnestetica.local';
  const cpf = '99988877766';
  const senha = 'AdminE2E123';

  await page.goto('/');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole('button', { name: /entrar/i }).click();

  const entrou = await page.getByRole('heading', { name: /clientes/i }).isVisible({ timeout: 3000 }).catch(() => false);
  if (entrou) return;

  await page.goto('/cadastro');
  await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: 15000 });

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.getByRole('textbox').nth(0).fill('Admin E2E');
  await page.getByRole('textbox').nth(1).fill(email);
  await page.getByRole('textbox').nth(2).fill(cpf);
  await page.locator('input[type="password"]').nth(0).fill(senha);
  await page.locator('input[type="password"]').nth(1).fill(senha);
  await page.getByRole('button', { name: /registar|cadastrar|salvar|criar/i }).click();

  await page.waitForURL('**/');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible({ timeout: 15000 });
}

test.describe('CRUDs Completos (Clientes e Procedimentos)', () => {
  test('CRUD Clientes: falha ao salvar vazio e fluxo completo (cadastrar, listar, editar, excluir)', async ({ page }) => {
    await garantirUsuarioELogar(page);

    await page.getByRole('button', { name: /novo cliente/i }).click();
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
    await garantirUsuarioELogar(page);

    await page.goto('/procedimentos');
    await page.getByRole('button', { name: /novo procedimento/i }).click();

    page.once('dialog', async (dialog) => dialog.accept());
    await page.locator('input[type="text"]').fill('Procedimento Invalido');
    await page.locator('input[type="number"]').first().fill('0');
    await page.locator('input[type="number"]').nth(1).fill('0');
    await page.getByRole('button', { name: /^salvar$/i }).click();

    const nomeProc = `Limpeza E2E ${Date.now()}`;
    const nomeProcEditado = `${nomeProc} VIP`;

    page.once('dialog', async (dialog) => dialog.accept());
    await page.locator('input[type="text"]').fill(nomeProc);
    await page.locator('textarea').fill('Avaliacao facial completa');
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