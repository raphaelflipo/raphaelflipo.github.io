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

async function measureRenderRate(viewer) {
  return viewer.evaluate(async model => {
    let context;
    const proto = WebGL2RenderingContext.prototype;
    const methods = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'];
    const original = new Map(methods.map(key => [key, proto[key]]));
    let submitted = false;
    let drawnFrames = 0;
    for (const key of methods) {
      proto[key] = function (...args) {
        if (args[0] === this.TRIANGLES) {
          submitted = true;
          context = this;
        }
        return original.get(key).apply(this, args);
      };
    }
    try {
      const orbit = model.getCameraOrbit();
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
      const start = await frame();
      let timestamp = start;
      while (timestamp - start < 4000) {
        const angle = orbit.theta + (timestamp - start) * 0.00055;
        model.cameraOrbit = angle + 'rad ' + orbit.phi + 'rad ' + orbit.radius + 'm';
        model.jumpCameraToGoal();
        submitted = false;
        timestamp = await frame();
        if (submitted) drawnFrames++;
      }
      const sampleMs = Math.round(timestamp - start);
      const info = context?.getExtension('WEBGL_debug_renderer_info');
      const renderer = info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : null;
      return { renderer, sampleMs, drawnFrames, drawnFps: +(drawnFrames * 1000 / sampleMs).toFixed(1) };
    } finally {
      for (const [key, value] of original) proto[key] = value;
    }
  });
}

async function checkCars(page, width) {
  const errors = [];
  const requests = [];
  const onError = err => errors.push(err.message);
  const onResponse = response => {
    if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
  };
  const onRequest = req => requests.push(new URL(req.url()).pathname);
  page.on('pageerror', onError);
  page.on('response', onResponse);
  page.on('request', onRequest);
  try {
    await page.goto(origin + '/#projets');
    await page.locator('main a[href="/mercedes-w14/"]').first().click();
    for (const car of ['w14', 'w13']) {
      const route = '/mercedes-' + car + '/';
      assert.equal(new URL(page.url()).pathname, route);
      assert.equal(await page.locator('.car-switch [aria-current="page"]').getAttribute('href'), route);
      assert.equal(await page.locator('h1').innerText(), 'Mercedes-AMG ' + car.toUpperCase());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const viewer = page.locator('model-viewer');
      const poster = page.locator('.w13-poster');
      assert(await poster.evaluate(async el => { await el.decode(); return el.naturalWidth > 0; }));
      const start = Date.now();
      if (car === 'w14') {
        assert.equal(await viewer.getAttribute('src'), null, 'Modèle différé');
        assert(!requests.some(path => path.endsWith('.glb')), 'GLB demandé avant le clic');
        await page.locator('#car-load').click();
      }
      await page.waitForFunction(() => document.querySelector('model-viewer')?.loaded === true, null, { timeout: 90000 });
      const loadMs = Date.now() - start;
      const details = await viewer.evaluate(model => ({
        animations: model.availableAnimations,
        materials: model.model.materials.length,
        version: navigator.userAgent
      }));
      assert(details.materials > 1);
      assert(details.animations.includes('DRS'));
      for (const name of ['front', 'side', 'top', 'under', 'rear', 'studio']) {
        const preset = page.locator('[data-view="' + name + '"]');
        await preset.click();
        assert.equal(await preset.getAttribute('aria-pressed'), 'true');
      }
      const drs = page.getByRole('slider', { name: 'Ouverture du DRS' });
      await drs.focus();
      await drs.press('End');
      assert.equal(await drs.inputValue(), '22');
      assert.match(await drs.getAttribute('aria-valuetext'), /22/);
      const opening = await viewer.evaluate(model => ({ current: model.currentTime, duration: model.duration }));
      assert(opening.duration > 0 && opening.current > opening.duration * .99, 'Ouverture de l’animation');
      await drs.press('Home');
      assert.equal(await drs.inputValue(), '0');
      assert.equal(await viewer.evaluate(model => model.currentTime), 0);
      if (car === 'w14') {
        const inspection = page.locator('#car-inspection');
        await inspection.locator('summary').click();
        for (const name of ['sidepod', 'suspension', 'cockpit']) {
          const detail = inspection.locator('[data-view="' + name + '"]');
          await detail.click();
          assert.equal(await detail.getAttribute('aria-pressed'), 'true');
          assert.equal(await viewer.evaluate(model => model.cameraTarget), await detail.getAttribute('data-target'));
        }
        await inspection.getByLabel('Clair', { exact: true }).check();
        assert.equal(await page.locator('#car-viewer').getAttribute('data-light'), 'light');
        assert.equal(await viewer.evaluate(model => model.exposure), 1.5);
        await inspection.getByLabel('Sombre', { exact: true }).check();
        assert.equal(await viewer.evaluate(model => model.exposure), 1.12);
        await inspection.locator('summary').click();
        const expand = page.locator('#car-expand');
        await expand.click();
        await page.waitForFunction(() => document.fullscreenElement || document.querySelector('#car-viewer.is-expanded'));
        await expand.click();
        await page.waitForFunction(() => !document.fullscreenElement && !document.querySelector('#car-viewer.is-expanded'));
      }
      await viewer.scrollIntoViewIfNeeded();
      const metrics = await measureRenderRate(viewer);
      assert(metrics.drawnFrames > 0, 'Aucune image WebGL dessinée pendant l’orbite');
      console.log('MESURE_3D ' + JSON.stringify({ car, width, loadMs, ...details, ...metrics }));
      await page.locator('[data-view="studio"]').click();
      await viewer.evaluate(el => el.jumpCameraToGoal());
      const clip = await page.locator('.w13-stage').evaluate(stage => {
        const { left, top, width, height } = stage.getBoundingClientRect();
        return { x: left + window.scrollX, y: top + window.scrollY, width, height };
      });
      assert(clip.width > 0 && clip.height > 0, 'Cadre du modèle vide');
      await page.screenshot({
        path: 'screenshots/' + car + '-3d-' + width + '.png',
        fullPage: true,
        clip,
        animations: 'disabled',
        timeout: 90000
      });
      for (const photo of await page.locator('.w13-gallery img').all()) {
        await photo.scrollIntoViewIfNeeded();
        assert(await photo.evaluate(async el => { await el.decode(); return Boolean(el.naturalWidth && el.alt); }));
      }
      await page.screenshot({ path: 'screenshots/' + car + '-page-' + width + '.png', fullPage: true });
      const other = car === 'w14' ? 'w13' : 'w14';
      await page.locator('.car-switch a[href="/mercedes-' + other + '/"]').click();
      await page.waitForURL(origin + '/mercedes-' + other + '/');
    }
    assert.deepEqual(errors, []);
  } finally {
    page.off('pageerror', onError);
    page.off('response', onResponse);
    page.off('request', onRequest);
  }
}

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
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
      const projectsLink = menu.getByRole('link', { name: 'Projets', exact: true });
      assert(await projectsLink.isVisible(), 'Lien vers les projets absent');
      await projectsLink.click();
      assert.equal(await menu.getAttribute('open'), null, 'Le menu doit se refermer après sélection');
      assert.equal(new URL(page.url()).hash, '#projets');
      await menu.locator('summary').click();
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('open'), null, 'Échap doit refermer le menu');
      if (width === 390) {
        await page.goto(origin, { waitUntil: 'load' });
        const contact = await page.locator('.rf-hero').getByRole('link', { name: 'M’écrire' }).boundingBox();
        assert(contact && contact.y + contact.height <= 720, 'Le contact doit être visible dès le premier écran mobile');
      }
    } else {
      assert(await page.locator('.rf-nav--desktop').isVisible(), 'Navigation ordinateur absente');
    }
    await checkCars(page, width);
    await page.close();
  }
  console.log('Tests visuels terminés : monoplaces, DRS, rendus, menus et débordements vérifiés.');
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
