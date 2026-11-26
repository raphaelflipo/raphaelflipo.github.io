import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, firefox, webkit } from 'playwright';

const name = process.env.PORTFOLIO_BROWSER || 'chromium';
const engines = { chromium, chrome: chromium, msedge: chromium, firefox, webkit };
const channel = name === 'chrome' || name === 'msedge' ? name : undefined;
const origin = 'http://127.0.0.1:8773';
const server = spawn('python3', ['-m', 'http.server', '8773', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const routes = [
  '/', '/en/', '/projets/', '/en/projets/',
  '/telechargements/', '/en/telechargements/', '/journal/', '/en/journal/', '/statut/',
  '/ingenierie/', '/en/ingenierie/w16/', '/cv/en/', '/studio-3d/', '/en/jarvis/',
];

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Serveur local indisponible');
}

let browser;
try {
  await waitForServer();
  browser = await engines[name].launch({ headless: true, channel });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
      const status = response.status();
      assert(status === 200 || status === 304, route + ' HTTP ' + status);
      assert.equal(await page.locator('main').count(), 1, route);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2);
      assert(fits, `${route} déborde à ${width}px`);
    }
  }

  await page.goto(origin + '/projets/');
  await page.locator('#projet-recherche').fill('melbourne');
  assert.equal(await page.locator('[data-project]:visible').count(), 1);
  await page.locator('#projet-categorie').selectOption('logiciel');
  assert.equal(await page.locator('[data-project]:visible').count(), 0);
  await page.getByRole('button', { name: 'Effacer', exact: true }).click();
  assert.equal(await page.locator('[data-project]:visible').count(), 10);

  await page.goto(origin + '/en/');
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Find a project or page' });
  await palette.waitFor();
  await palette.getByRole('searchbox').fill('downforce');
  const glossary = palette.getByRole('link', { name: 'Aerodynamics glossary' });
  assert.equal(await glossary.getAttribute('href'), '/en/ingenierie/glossaire/');
  await page.keyboard.press('Escape');
  assert.equal(await palette.isVisible(), false);

  await page.goto(origin + '/statut/');
  await page.getByRole('button', { name: 'Vérifier maintenant' }).click();
  await page.waitForFunction(() => document.getElementById('resume-services').textContent.startsWith('Vérifié'));
  assert.match(await page.locator('[data-status-path="/"]').textContent(), /^HTTP 200/);
  assert.deepEqual(errors, []);
  console.log(name + ' : ' + routes.length * 3 + ' mises en page, filtres, raccourci clavier et vérification HTTP validés.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
