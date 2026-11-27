const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');

const roots = ['/tmp/portfolio-avant', '.', '/tmp/boussole-avant', '/tmp/boussole-apres'];
const routes = {
  accueil: '/', 'menu-mobile': '/', catalogue: '/projets/', studio: '/studio-3d/',
  w16: '/mercedes-w16/', composants: '/mercedes-w16/composants/',
  comparateur: '/mercedes-comparateur/?gauche=w15&droite=w16',
  jarvis: '/jarvis/', 'la-boussole': '/', cv: '/cv/',
};
(async () => {
  const servers = roots.map((root, index) => spawn('python3', ['-m', 'http.server', String(8785 + index), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' }));
  let browser;
  try {
    browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
    await Promise.all(roots.map(async (_, index) => {
      for (let attempt = 0; attempt < 30; attempt++) {
        try { if ((await fetch('http://127.0.0.1:' + (8785 + index))).ok) return; } catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Serveur indisponible');
    }));
    for (const [width, height] of [[390, 720], [1440, 900]]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light', reducedMotion: 'reduce' });
      for (const [name, route] of Object.entries(routes)) {
        if (name === 'menu-mobile' && width > 390) continue;
        const dir = path.join('work/captures', String(width), name);
        await mkdir(dir, { recursive: true });
        for (const [index, version] of ['avant', 'apres'].entries()) {
          const port = 8785 + index + (name === 'la-boussole' ? 2 : 0);
          const response = await page.goto('http://127.0.0.1:' + port + route, { waitUntil: 'load' });
          assert.equal(response.status(), 200);
          if (name === 'menu-mobile') {
            await page.locator('details.rf-menu summary').click();
            assert.equal(await page.locator('details.rf-menu[open]').count(), 1);
          }
          await page.screenshot({ path: path.join(dir, version + '.png'), animations: 'disabled' });
        }
      }
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    for (const server of servers) server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
