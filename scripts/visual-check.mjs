import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const port = 8765;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
const origin = 'http://127.0.0.1:' + port;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ready() {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(origin + '/')).ok) return;
    } catch {}
    await pause(250);
  }
  throw new Error('Serveur local indisponible');
}

const browser = await chromium.launch({ headless: true });
mkdirSync('screenshots', { recursive: true });
try {
  await ready();
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const routes = [
      ['accueil', '/'],
      ['f1', '/aileron-f1/'],
      ['jarvis', '/jarvis/'],
      ['cv', '/cv/'],
      ['cv-en', '/cv/en/']
    ];
    for (const [name, route] of routes) {
      const response = await page.goto(origin + route, { waitUntil: 'load' });
      assert.equal(response.status(), 200, name + ' : page HTTP');
      assert.equal(await page.locator('main').count(), 1, name + ' : un élément main attendu');
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        width: document.documentElement.scrollWidth
      }));
      assert(dimensions.width <= dimensions.viewport + 2, name + ' à ' + width + 'px : débordement ' + dimensions.width);
      if (name === 'f1') {
        assert.equal(await page.locator('#wing-model').getAttribute('src'), './aileron-F1-2019.glb');
        const glb = await page.request.get(origin + '/aileron-f1/aileron-F1-2019.glb');
        assert.equal(glb.status(), 200, 'Le modèle GLB doit être disponible localement');
        assert.equal((await glb.body()).byteLength, 1754320, 'La taille du modèle doit être conservée');
        await page.waitForFunction(() => Boolean(customElements.get('model-viewer')), null, { timeout: 20000 });
        const canRender = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));
        if (canRender) {
          await page.waitForFunction(() => document.getElementById('wing-model')?.loaded === true, null, { timeout: 20000 });
          assert(await page.locator('#wing-viewport').evaluate(el => el.classList.contains('rf-wing-viewer--ready')), 'Le modèle F1 ne s’affiche pas');
        }
      }
      await page.screenshot({ path: 'screenshots/' + name + '-' + width + '.png', fullPage: true });
    }
    await page.goto(origin, { waitUntil: 'load' });
    if (width <= 840) {
      const menu = page.locator('.rf-menu');
      assert(await menu.isVisible(), 'Menu mobile absent à ' + width + 'px');
      await menu.locator('summary').click();
      assert.equal(await menu.getAttribute('open'), '', 'Menu mobile non ouvert à ' + width + 'px');
      assert(await menu.locator('nav a').first().isVisible(), 'Liens mobiles non visibles');
    } else {
      assert(await page.locator('.rf-nav--desktop').isVisible(), 'Navigation ordinateur absente');
    }
    await page.close();
  }
  console.log('Tests visuels terminés : 15 captures, menus et débordements vérifiés.');
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
