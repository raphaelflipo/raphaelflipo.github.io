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

async function loadModel(page, viewer, button, requests) {
  assert.equal(await viewer.getAttribute('src'), null, 'La scène ne doit pas charger sans action');
  assert(!requests.some(path => /(?:\.glb|\/model-viewer\.min\.js)$/.test(path)),
    'La visionneuse et le GLB ne doivent pas être demandés avant le clic');
  const start = performance.now();
  await button.click();
  await page.waitForFunction(() => document.querySelector('model-viewer')?.loaded === true, null, { timeout: 90000 });
  assert(requests.some(path => path.endsWith('.glb')), 'Le clic doit déclencher le chargement du modèle');
  return Math.round(performance.now() - start);
}

async function checkDrivers(page, viewer, requests) {
  const driver = page.locator('#car-driver');
  await driver.selectOption('63');
  const poster = page.locator('.w13-poster');
  assert.match(await poster.getAttribute('src'), /studio-63\.webp$/);
  assert(await poster.evaluate(async image => {
    await image.decode();
    return image.naturalWidth > 0 && image.alt.includes('George Russell');
  }));
  assert.equal(await viewer.getAttribute('src'), null);
  assert(!requests.some(path => path.endsWith('mercedes-w15-63.glb')), 'Le choix du pilote ne doit pas charger de GLB');
  await driver.selectOption('44');
}

async function checkDriverSwitches(page, viewer) {
  const driver = page.locator('#car-driver');
  const slider = page.getByRole('slider', { name: 'Ouverture du DRS' });
  for (const number of ['63', '44', '63', '44']) {
    const path = number === '63' ? '/mercedes-w15/mercedes-w15-63.glb' : '/mercedes-w15/mercedes-w15.glb';
    await driver.selectOption(number);
    await page.waitForFunction(expected => {
      const panel = document.querySelector('#car-viewer');
      const viewer = panel.querySelector('model-viewer');
      return panel.classList.contains('is-ready') && viewer.loaded && new URL(viewer.src).pathname === expected;
    }, path, { timeout: 90000 });
    assert.equal(await slider.inputValue(), '0');
    assert.equal(await viewer.evaluate(model => model.currentTime), 0);
    await slider.focus();
    await slider.press('End');
    assert.equal(await slider.inputValue(), '22');
    assert(await viewer.evaluate(model => model.currentTime >= .99 * model.duration && model.duration > 0));
  }
  await slider.press('Home');
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
    const generations = ['w15', 'w14', 'w13'];
    await page.locator('#collection-mercedes a[href="/mercedes-w15/"]').click();
    for (const [i, car] of generations.entries()) {
      const route = '/mercedes-' + car + '/';
      assert.equal(new URL(page.url()).pathname, route);
      assert.equal(await page.locator('.car-switch [aria-current="page"]').getAttribute('href'), route);
      assert.equal(await page.locator('h1').innerText(), 'Mercedes-AMG ' + car.toUpperCase());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const viewer = page.locator('model-viewer');
      const poster = page.locator('.w13-poster');
      assert(await poster.evaluate(async el => { await el.decode(); return el.naturalWidth > 0; }));
      const loadButton = page.locator('.car-load');
      if (car === 'w15') await checkDrivers(page, viewer, requests);
      const loadMs = await loadModel(page, viewer, loadButton, requests);
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
      if (car !== 'w13') {
        const inspection = page.locator('#car-inspection');
        await inspection.locator('summary').click();
        const parts = car === 'w15'
          ? ['sidepod', 'suspension', 'rear-suspension', 'front-wing', 'cockpit']
          : ['sidepod', 'suspension', 'cockpit'];
        for (const name of parts) {
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
      if (car === 'w15' && width === 390) await checkDriverSwitches(page, viewer);
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
        const image = await photo.evaluate(async el => {
          await el.decode();
          return { width: el.naturalWidth, height: el.naturalHeight, alt: el.alt };
        });
        assert(image.width && image.height && image.alt);
        if (car === 'w15') assert.deepEqual([image.width, image.height], [1440, 810]);
      }
      await page.screenshot({ path: 'screenshots/' + car + '-page-' + width + '.png', fullPage: true });
      const other = generations[i + 1] ?? generations[0];
      requests.length = 0;
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

async function checkComparator(page, requests, width) {
  const errors = [];
  const onError = error => errors.push(error.message);
  const onResponse = response => {
    if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
  };
  page.on('pageerror', onError);
  page.on('response', onResponse);
  try {
    requests.length = 0;
    await page.goto(origin + '/mercedes-comparateur/?gauche=w14&droite=w15');
    const first = page.locator('#cmp-left');
    const second = page.locator('#cmp-right');
    const load = page.locator('#cmp-load');
    const canvas = page.locator('#cmp-canvas');
    await load.waitFor();
    assert.equal(await first.inputValue(), 'w14');
    assert.equal(await second.inputValue(), 'w15');
    assert(!requests.some(path => /\.glb$|\/three\.module\.min\.js$/.test(path)), 'Le comparateur doit charger sa 3D à la demande');
    await page.locator('#cmp-part').selectOption('inlets');
    assert.match(await page.locator('#cmp-notes').innerText(), /triangulaire/i);
    assert.equal(await page.locator('#cmp-notes a[href^="https://"]').count(), 2);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const start = performance.now();
    await load.click();
    await page.locator('#cmp-canvas[data-rendered="true"]').waitFor({ timeout: 90000 });
    const loadMs = Math.round(performance.now() - start);
    assert(await canvas.isVisible());
    assert(requests.some(path => path.endsWith('mercedes-w14.glb')));
    assert(requests.some(path => path.endsWith('mercedes-w15.glb')));
    const stage = page.locator('#cmp-stage');
    async function chooseMode(mode) {
      const radio = page.locator('input[name="cmp-mode"][value="' + mode + '"]');
      await page.locator('label').filter({ has: radio }).click();
      assert(await radio.isChecked());
      assert.equal(await stage.getAttribute('data-mode'), mode);
    }
    await chooseMode('overlay');
    await page.locator('#cmp-align').selectOption('rear');
    const part = page.locator('#cmp-opacity');
    await part.focus();
    await part.press('End');
    assert.equal(await part.inputValue(), '100');
    assert.match(await page.locator('#cmp-percentage').innerText(), /100/);
    await page.locator('#cmp-composite').selectOption('wipe');
    await part.press('Home');
    assert.equal(await part.inputValue(), '0');
    await chooseMode('silhouette');
    await chooseMode('split');
    await page.locator('#cmp-sync').uncheck();
    await page.locator('#cmp-material').selectOption('wire');
    await page.locator('#cmp-material').selectOption('clay');
    await page.locator('#cmp-light').selectOption('studio');
    await page.locator('[data-view="top"]').click();
    assert.equal(await page.locator('[data-view="top"]').getAttribute('aria-pressed'), 'true');
    await page.locator('#cmp-swap').click();
    assert.equal(await first.inputValue(), 'w15');
    assert.equal(await second.inputValue(), 'w14');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: 'screenshots/comparateur-' + width + '.png', fullPage: true, animations: 'disabled', timeout: 90000 });
    assert.deepEqual(errors, []);
    console.log('MESURE_3D ' + JSON.stringify({ model: 'comparateur', width, loadMs }));
  } finally {
    page.off('pageerror', onError);
    page.off('response', onResponse);
  }
}

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
mkdirSync('screenshots', { recursive: true });
try {
  await ready();
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const requests = [];
    page.on('request', request => requests.push(new URL(request.url()).pathname));
    const routes = [
      ['accueil', '/'],
      ['f1', '/aileron-f1/'],
      ['jarvis', '/jarvis/'],
      ['cv', '/cv/'],
      ['cv-en', '/cv/en/']
    ];
    for (const [name, route] of routes) {
      requests.length = 0;
      const response = await page.goto(origin + route, { waitUntil: 'load' });
      assert.equal(response.status(), 200, name + ' : page HTTP');
      assert.equal(await page.locator('main').count(), 1, name + ' : un élément main attendu');
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        width: document.documentElement.scrollWidth
      }));
      assert(dimensions.width <= dimensions.viewport + 2, name + ' à ' + width + 'px : débordement ' + dimensions.width);
      if (name === 'f1') {
        const viewer = page.locator('#wing-model');
        const loadMs = await loadModel(page, viewer, page.locator('#wing-load'), requests);
        const glb = await page.request.get(origin + '/aileron-f1/aileron-F1-2019.glb');
        assert.equal(glb.status(), 200, 'Le modèle GLB doit être disponible localement');
        assert.equal((await glb.body()).byteLength, 1754320, 'La taille du modèle doit être conservée');
        await page.locator('#wing-viewport.rf-wing-viewer--ready').waitFor();
        console.log('MESURE_3D ' + JSON.stringify({ model: 'aileron', width, loadMs }));
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
    await checkComparator(page, requests, width);
    await page.close();
  }
  console.log('Tests visuels terminés : trois monoplaces, DRS, comparateur et débordements vérifiés.');
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
