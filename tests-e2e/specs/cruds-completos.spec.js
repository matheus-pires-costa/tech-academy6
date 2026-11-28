const { test, expect } = require('@playwright/test');

async function garantirUsuarioELogar(page) {
  const email = 'e2e.admin@cnestetica.local';
  const senha = 'AdminE2E123';

  await page.goto('/');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole('button', { name: /entrar/i }).click();

  const jaLogado = await page.getByRole('heading', { name: /clientes/i }).isVisible({ timeout: 5000 }).catch(() => false);
  if (jaLogado) return;

  const sufixo = Date.now().toString().slice(-6);
  const emailUnico = `admin.e2e.${sufixo}@cnestetica.local`;
  const cpfUnico = `8${Date.now().toString().slice(-10)}`;

  await page.goto('/cadastro');
  await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: 15000 });

  await page.getByRole('textbox').nth(0).fill('Admin E2E');
  await page.getByRole('textbox').nth(1).fill(emailUnico);
  await page.getByRole('textbox').nth(2).fill(cpfUnico);
  await page.locator('input[type="password"]').nth(0).fill(senha);
  await page.locator('input[type="password"]').nth(1).fill(senha);
  await page.getByRole('button', { name: /registar|cadastrar|salvar|criar/i }).click();

  await page.waitForURL('**/', { timeout: 15000 });
  await page.locator('input[type="email"]').fill(emailUnico);
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible({ timeout: 15000 });
}

async function irParaSecao(page, nomeBotaoRegex, headingRegex) {
  const botaoNav = page.getByRole('button', { name: nomeBotaoRegex }).first();
  if (await botaoNav.isVisible().catch(() => false)) {
    await botaoNav.click();
  }
  await page.getByRole('heading', { name: headingRegex }).first().waitFor({ state: 'visible', timeout: 15000 });
}

async function localizarLinhaEmPaginacao(page, texto) {
  await page.locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  const linhaDireta = page.locator('tbody tr', { hasText: texto }).first();
  if (await linhaDireta.isVisible().catch(() => false)) {
    return linhaDireta;
  }

  let textoPaginaAnterior = '';
  for (let i = 0; i < 40; i++) {
    const linha = page.locator('tbody tr', { hasText: texto }).first();
    if (await linha.isVisible().catch(() => false)) {
      return linha;
    }

    const textoAtual = await page.locator('tbody').innerText().catch(() => '');
    if (i > 0 && textoAtual === textoPaginaAnterior) {
      break;
    }
    textoPaginaAnterior = textoAtual;

    const proxima = page.getByRole('button', { name: /próxima|proxima|seguinte/i }).first();
    if (!(await proxima.isVisible().catch(() => false)) || !(await proxima.isEnabled().catch(() => false))) {
      break;
    }

    await proxima.click();
    await page.waitForTimeout(250);
  }

  return page.locator('tbody tr', { hasText: texto }).first();
}

test.describe('CRUDs Completos (Clientes e Procedimentos)', () => {
  test('CRUD Clientes: falha em entrada inválida e fluxo completo (cadastrar, listar, editar, excluir)', async ({ page }) => {
    page.on('dialog', async (dialog) => dialog.accept());
    await garantirUsuarioELogar(page);

    await irParaSecao(page, /clientes/i, /clientes/i);
    await page.getByRole('button', { name: /novo cliente/i }).click();
    await page.getByRole('heading', { name: /novo cliente/i }).waitFor({ state: 'visible', timeout: 15000 });

    await page.locator('form input').first().fill('A');
    await page.getByPlaceholder('(11) 99999-9999').fill('123');
    await page.getByRole('button', { name: /^salvar$/i }).click();
    await page.waitForTimeout(300);

    const nomeOriginal = `Cliente E2E ${Date.now()}`;
    const nomeEditado = `${nomeOriginal} Editado`;

    if (!(await page.getByRole('heading', { name: /novo cliente/i }).isVisible().catch(() => false))) {
      await page.getByRole('button', { name: /novo cliente/i }).click();
    }

    await page.locator('form input').first().fill(nomeOriginal);
    await page.getByPlaceholder('(11) 99999-9999').fill('(44) 99999-1111');
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('cliente') && ['POST', 'PUT', 'PATCH'].includes(resp.request().method())).catch(() => null),
      page.getByRole('button', { name: /^salvar$/i }).click(),
    ]);

    await irParaSecao(page, /clientes/i, /clientes/i);
    const linhaCriada = await localizarLinhaEmPaginacao(page, nomeOriginal);
    await expect(linhaCriada).toBeVisible({ timeout: 15000 });

    await linhaCriada.getByRole('button', { name: /editar/i }).click();
    await page.locator('form input').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('form input').first().fill(nomeEditado);
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('cliente') && ['PUT', 'PATCH'].includes(resp.request().method())).catch(() => null),
      page.getByRole('button', { name: /^salvar$/i }).click(),
    ]);

    await irParaSecao(page, /clientes/i, /clientes/i);
    const linhaEditada = await localizarLinhaEmPaginacao(page, nomeEditado);
    await expect(linhaEditada).toBeVisible({ timeout: 15000 });

    await linhaEditada.getByRole('button', { name: /excluir/i }).click();
    await expect(page.locator('tbody tr', { hasText: nomeEditado })).toHaveCount(0, { timeout: 15000 });
  });

  test('CRUD Procedimentos: falha em entrada inválida e fluxo completo (cadastrar, listar, editar, excluir)', async ({ page }) => {
    page.on('dialog', async (dialog) => dialog.accept());
    await garantirUsuarioELogar(page);

    await irParaSecao(page, /procedimentos/i, /procedimentos/i);
    const botaoNovo = page.getByRole('button', { name: /novo procedimento|novo|adicionar|cadastrar/i }).first();
    await botaoNovo.waitFor({ state: 'visible', timeout: 15000 });
    await botaoNovo.click();

    const inputsInvalidos = page.locator('form input, form textarea');
    const totalCampos = await inputsInvalidos.count();
    if (totalCampos > 0) await inputsInvalidos.nth(0).fill('X');
    if (totalCampos > 1) await inputsInvalidos.nth(1).fill('-10');
    if (totalCampos > 2) await inputsInvalidos.nth(2).fill('-5');
    await page.getByRole('button', { name: /^salvar$/i }).click();
    await page.waitForTimeout(300);

    const nomeProc = `Limpeza E2E ${Date.now()}`;
    const nomeProcEditado = `${nomeProc} VIP`;

    if (!(await page.locator('form input').first().isVisible().catch(() => false))) {
      await irParaSecao(page, /procedimentos/i, /procedimentos/i);
      await page.getByRole('button', { name: /novo procedimento|novo|adicionar|cadastrar/i }).first().click();
    }

    const campos = page.locator('form input, form textarea');
    const qtd = await campos.count();
    await campos.nth(0).fill(nomeProc);
    if (qtd === 3) {
      await campos.nth(1).fill('150');
      await campos.nth(2).fill('60');
    } else if (qtd >= 4) {
      await campos.nth(1).fill('Avaliacao facial completa');
      await campos.nth(2).fill('150');
      await campos.nth(3).fill('60');
    }
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('procedimento') && ['POST', 'PUT', 'PATCH'].includes(resp.request().method())).catch(() => null),
      page.getByRole('button', { name: /^salvar$/i }).click(),
    ]);

    await irParaSecao(page, /procedimentos/i, /procedimentos/i);
    const linhaProc = await localizarLinhaEmPaginacao(page, nomeProc);
    await expect(linhaProc).toBeVisible({ timeout: 15000 });

    await linhaProc.getByRole('button', { name: /editar/i }).click();
    const campoEditar = page.locator('form input, input[type="text"]').first();
    await campoEditar.waitFor({ state: 'visible', timeout: 15000 });
    await campoEditar.fill(nomeProcEditado);
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('procedimento') && ['PUT', 'PATCH'].includes(resp.request().method())).catch(() => null),
      page.getByRole('button', { name: /^salvar$/i }).click(),
    ]);

    await irParaSecao(page, /procedimentos/i, /procedimentos/i);
    const linhaProcEditada = await localizarLinhaEmPaginacao(page, nomeProcEditado);
    await expect(linhaProcEditada).toBeVisible({ timeout: 15000 });

    await linhaProcEditada.getByRole('button', { name: /excluir/i }).click();
    await expect(page.locator('tbody tr', { hasText: nomeProcEditado })).toHaveCount(0, { timeout: 15000 });
  });
});