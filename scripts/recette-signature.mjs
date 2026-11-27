import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, devices } from 'playwright';

const routes = {
  accueil: '/', projets: '/projets/', studio: '/studio-3d/', w13: '/mercedes-w13/', w14: '/mercedes-w14/', w15: '/mercedes-w15/', w16: '/mercedes-w16/',
  inspection: '/mercedes-w16/composants/', comparateur: '/mercedes-comparateur/', ingenierie: '/ingenierie/', 'cv-anglais': '/cv/en/',
  boussole: '/', 'boussole-demo': '/demo.html', jarvis: '/jarvis/', 'jarvis-web': '/jarvis/app/', cv: '/cv/',
};
const browser = await chromium.launch();
await mkdir('signature-receipt', { recursive: true });
try {
  for (const [size, layout] of Object.entries({ mobile: devices['iPhone 13'], desktop: { viewport: { width: 1440, height: 900 } } })) {
    for (const colorScheme of ['light', 'dark']) {
      const page = await browser.newPage({ ...layout, colorScheme, reducedMotion: 'reduce' });
      for (const [version, port] of [['v41', 8793], ['v5', 8794]]) {
        for (const [name, route] of Object.entries(routes)) {
          const targetPort = name.startsWith('boussole') ? port + 2 : port;
          const response = await page.goto('http://127.0.0.1:' + targetPort + route, { waitUntil: 'load' });
          assert.equal(response.status(), 200, route);
          await page.screenshot({ path: `signature-receipt/${size}-${colorScheme}-${name}-${version}.png` });
          if (name === 'accueil') {
            await page.locator('#parcours').screenshot({ path: `signature-receipt/${size}-${colorScheme}-parcours-${version}.png` });
            const menu = page.locator('.rf-menu');
            await menu.locator('summary').click();
            assert.equal(await menu.getAttribute('open'), '');
            await page.screenshot({ path: `signature-receipt/${size}-${colorScheme}-menu-${version}.png` });
            await page.keyboard.press('Escape');
            assert.equal(await menu.getAttribute('open'), null);
          }
        }
      }
      await page.close();
    }
  }

  const context = await browser.newContext({
    ...devices['iPhone 13'],
    recordVideo: { dir: 'signature-receipt', size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  const origin = 'http://127.0.0.1:8794';
  await page.goto(origin);
  await page.locator('.rf-menu summary').tap();
  await page.locator('.rf-menu').getByRole('link', { name: 'Rechercher', exact: true }).tap();
  const search = page.getByRole('dialog');
  await search.getByRole('searchbox').fill('diffuseur');
  const glossary = search.locator('a[href="/ingenierie/glossaire/#diffuser"]');
  assert.equal(await glossary.count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await search.isVisible(), false);
  await page.locator('.rf-menu summary').tap();
  await page.locator('.rf-menu').getByRole('link', { name: 'Studio 3D', exact: true }).tap();
  await page.waitForURL('**/studio-3d/');
  await page.locator('.signature-car-selector').getByRole('button', { name: 'W15' }).tap();
  assert.equal(await page.locator('#garage-car').inputValue(), 'w15');
  assert.equal(await page.locator('.signature-car-selector').getByRole('button', { name: 'W15' }).getAttribute('aria-pressed'), 'true');
  await page.locator('.signature-camera-selector').getByRole('button', { name: 'Profil', exact: true }).tap();
  assert.equal(await page.locator('#garage-view').inputValue(), 'side');
  await page.locator('#garage-load').tap();
  await page.locator('.garage-stage.is-live').waitFor({ timeout: 45000 });
  await page.locator('.signature-car-selector').getByRole('button', { name: 'W16' }).tap();
  await page.waitForFunction(() => {
    const viewer = document.querySelector('.garage-stage model-viewer');
    return viewer.loaded && viewer.alt.includes('W16');
  });
  await page.locator('a[href="/mercedes-w16/composants/"]').first().tap();
  await page.waitForURL('**/mercedes-w16/composants/');
  await page.goto(origin + '/en/studio-3d/');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.locator('.signature-car-selector').getByRole('button', { name: 'W13' }).tap();
  assert.equal(await page.locator('#garage-car').inputValue(), 'w13');
  await context.close();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'signature-receipt', size: { width: 1440, height: 900 } } });
  const wide = await desktop.newPage();
  await wide.goto(origin + '/en/');
  await wide.keyboard.press('Control+k');
  const englishSearch = wide.getByRole('dialog');
  await englishSearch.getByRole('searchbox').fill('diffuser');
  await englishSearch.locator('a[href="/en/ingenierie/glossaire/#diffuser"]').click();
  await wide.waitForURL('**/en/ingenierie/glossaire/#diffuser');
  await desktop.close();
} finally {
  await browser.close();
}
