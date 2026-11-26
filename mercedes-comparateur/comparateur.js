import { monoplaces } from '/assets/donnees-mercedes.js?v=2';
import { annotations } from '/assets/annotations-mercedes.js?v=2';
import { comparisonParams, restoreSettings } from './configuration.js';

const english = document.documentElement.lang === 'en';
const englishAnnotations = english ? await import('/assets/annotations-mercedes-en.js').catch(() => null) : null;
const copyFor = (fr, en) => english ? en : fr;
const helpText = copyFor(
  'Glisse pour pivoter, pince pour zoomer. Au clavier, utilise les flèches et les touches + ou − dans la vue 3D.',
  'Drag to rotate and pinch to zoom. With the 3D view focused, use the arrow keys and + or −.'
);

const byId = id => document.getElementById('cmp-' + id);
const panel = byId('panel');
const stage = byId('stage');
const canvas = byId('canvas');
const loading = byId('load');
const fullScreen = byId('full');
const controls = byId('controls');
const material = byId('material');
const neutral = byId('neutral');
const status = byId('state');
const sync = byId('sync');
const part = byId('part');
const picks = [byId('left'), byId('right')];
const swap = byId('swap');
const labels = [byId('label-a'), byId('label-b')];
const posters = [byId('poster-a'), byId('poster-b')];
const notes = byId('notes');
const modeInputs = [...document.querySelectorAll('[name="cmp-mode"]')];
const views = [...document.querySelectorAll('[data-view]')];
const ruler = byId('ruler');
const share = byId('share');
const shareLink = byId('share-link');
const shareStatus = byId('share-state');
const exportButton = byId('export');
const params = new URLSearchParams(location.search);
const initial = restoreSettings(params, byId, modeInputs, views);
const [requestedLeft, requestedRight] = ['gauche', 'droite'].map(key => {
  const id = params.get(key);
  return Object.hasOwn(monoplaces, id) ? id : null;
});
let ids = [requestedLeft ?? 'w15', requestedRight ?? 'w16'];
if (ids[0] === ids[1]) {
  const side = requestedRight && !requestedLeft ? 0 : 1;
  ids[side] = ids[side] === 'w16' ? 'w15' : 'w16';
}
let loadedIds = [];
let renderer;
let loadAttempt = 0;
let pendingFrame = null;
let busy = false;
let exporting = false;
let ready = false;
let stageVisible = true;
let isSynced = initial.sync;
let view = initial.view;
let retainedCamera = { orbits: initial.orbits, active: initial.active };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const travel = () => reducedMotion.matches || byId('quality').value === 'eco' ? 0 : 280;
const format = new Intl.NumberFormat(copyFor('fr-FR', 'en-GB'));
const formatPercent = new Intl.NumberFormat(copyFor('fr-FR', 'en-GB'), { style: 'percent' });
const displayedMode = () => modeInputs.find(input => input.checked)?.value ?? 'split';

function permalink(target = location.href) {
  const url = new URL(target, location.href);
  url.search = comparisonParams({
    ids, byId, mode: displayedMode(), view, sync: isSynced,
    camera: renderer?.cameraState() ?? retainedCamera
  });
  url.hash = '';
  return url;
}

function renderLayout() {
  stage.dataset.layout = stage.clientWidth < 620 ? 'stack' : 'columns';
  requestDraw();
}

function requestDraw() {
  if (pendingFrame !== null || !ready || !stageVisible || document.hidden) return;
  pendingFrame = requestAnimationFrame(time => {
    pendingFrame = null;
    if (!ready || !stageVisible || document.hidden) return;
    try {
      const pixels = renderer.render(time);
      if (!pixels) return;
      canvas.dataset.rendered = 'true';
      ruler.hidden = false;
      const increment = pixels > 110 ? .5 : pixels < 24 ? 2 : 1;
      ruler.querySelector('i').style.width = (increment * pixels) + 'px';
      ruler.querySelector('span').textContent = format.format(increment) + ' m';
      // Le nombre décrit l'échelle de la comparaison synchronisée, ou
      // celle de la dernière vue manipulée si les vues sont indépendantes.
      ruler.setAttribute('aria-label', copyFor('Échelle de la vue active', 'Scale of the active view'));
      if (renderer.transitioning) requestDraw();
    } catch {
      fail(copyFor('Le moteur 3D a rencontré une erreur. Les rendus restent disponibles.', 'The 3D viewer encountered an error. The renders are still available.'));
    }
  });
}

function fillPicks() {
  for (const select of picks) {
    for (const [id, car] of Object.entries(monoplaces)) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${car.name} · ${car.year}`;
      select.append(option);
    }
  }
}

function updatePicks() {
  picks.forEach((select, index) => {
    const car = monoplaces[ids[index]];
    select.value = ids[index];
    for (const option of select.options) option.disabled = option.value === ids[1 - index];
    labels[index].textContent = `${car.name} · ${car.year}`;
    posters[index].alt = car.name + ' · ' + car.year;
    if (posters[index].getAttribute('src') !== car.poster) posters[index].src = car.poster;
  });
  updateNotes();
}

function updateNotes() {
  notes.replaceChildren();
  for (const id of ids) {
    const car = monoplaces[id];
    const entry = annotations[id]?.[part.value];
    const box = document.createElement('article');
    const title = document.createElement('h3');
    const copy = document.createElement('p');
    const link = document.createElement('a');
    const dossier = document.createElement('a');
    title.textContent = `${car.name} · ${car.year}`;
    if (entry) {
      copy.textContent = englishAnnotations?.annotationText[id]?.[part.value] ?? entry.text;
      link.textContent = englishAnnotations?.annotationCredits[entry.credit] ?? entry.credit;
      link.href = entry.source;
    } else {
      const circuit = car.circuit === 'Bahreïn' ? 'Bahrain' : car.circuit;
      copy.textContent = copyFor(`Configuration représentée à ${car.circuit}.`, `Modelled in its ${circuit} specification.`);
      link.textContent = copyFor(`Voir la fiche ${car.name}`, `Explore the ${car.name}`);
      link.href = copyFor(car.page, '/en' + car.page);
    }
    dossier.textContent = copyFor('Dossier d’ingénierie ' + car.name, car.name + ' engineering dossier');
    dossier.href = copyFor('/ingenierie/', '/en/ingenierie/') + id + '/' + (part.value === 'none' ? '' : '#' + part.value);
    const links = document.createElement('div');
    links.className = 'cmp-note-links';
    links.append(link, dossier);
    box.append(title, copy, links);
    notes.append(box);
  }
}

function setBusy(amount) {
  busy = amount;
  for (const element of [...picks, swap, loading]) element.disabled = busy;
  exportButton.disabled = busy || exporting || !ready;
  panel.setAttribute('aria-busy', String(busy));
}

function fail(message) {
  loadAttempt++;
  if (ready) retainedCamera = renderer?.cameraState() ?? retainedCamera;
  renderer?.dispose();
  renderer = null;
  ready = false;
  if (panel.classList.contains('cmp-expanded')) enlarged(false);
  if (document.fullscreenElement === panel) document.exitFullscreen().catch(() => {});
  controls.hidden = true;
  fullScreen.hidden = true;
  ruler.hidden = true;
  canvas.hidden = true;
  delete canvas.dataset.rendered;
  stage.dataset.mode = 'split';
  stage.querySelector('.cmp-posters').hidden = false;
  loading.hidden = false;
  loading.textContent = copyFor('Réessayer la 3D', 'Retry 3D view');
  status.textContent = message;
  setBusy(false);
}

async function showPair(giveFocus = false) {
  if (busy) return;
  const attempt = ++loadAttempt;
  setBusy(true);
  status.textContent = copyFor('Chargement des deux monoplaces…', 'Loading both cars…');
  try {
    if (!renderer) {
      const { Comparateur } = await import('./moteur.js?v=4');
      if (attempt !== loadAttempt) return;
      renderer = new Comparateur(canvas);
      if (part.value !== 'none') renderer.choosePart(part.value);
      else renderer.chooseView(view || 'studio');
      renderer.restoreCamera(retainedCamera);
    }
    await renderer.load(ids);
    if (attempt !== loadAttempt) return;
    loadedIds = [...ids];
    stage.querySelector('.cmp-posters').hidden = true;
    loading.hidden = true;
    controls.hidden = false;
    canvas.hidden = false;
    fullScreen.hidden = false;
    ready = true;
    syncSettings();
    updateMode(displayedMode());
    const [left, right] = ids.map(id => monoplaces[id].name);
    status.textContent = copyFor(
      `${left} et ${right} · projection orthographique en mètres.`,
      `${left} and ${right} · orthographic projection in metres.`
    );
    requestDraw();
    if (giveFocus) canvas.focus({ preventScroll: true });
  } catch {
    if (attempt !== loadAttempt) return;
    if (loadedIds.length) {
      ids = [...loadedIds];
      updatePicks();
    }
    fail(copyFor(
      'La 3D est indisponible. Réessaie le chargement ou ouvre les galeries des monoplaces.',
      'The 3D view is unavailable. Try again or open the cars’ render galleries.'
    ));
  } finally {
    if (attempt === loadAttempt) setBusy(false);
  }
}

function displayView(nextView) {
  view = nextView;
  for (const button of views) button.setAttribute('aria-pressed', String(view === button.dataset.view));
}

function updateMode(mode) {
  if (!renderer) return;
  renderer.mode = mode;
  stage.dataset.mode = mode;
  modeInputs.forEach(input => { input.checked = input.value === mode; });
  sync.checked = isSynced || mode !== 'split';
  sync.disabled = mode !== 'split';
  renderer.sync = sync.checked;
  if (renderer.sync) renderer.link();
  byId('overlay-tools').hidden = mode !== 'overlay';
  byId('depth-tools').hidden = mode !== 'depth';
  material.disabled = mode === 'depth' || mode === 'silhouette';
  neutral.disabled = material.disabled;
  const text = byId('help');
  const help = {
    silhouette: copyFor(
      'Le turquoise montre la zone propre à A, l’ocre celle propre à B. Le gris indique la surface projetée commune.',
      'Turquoise shows the area unique to A, ochre the area unique to B, and grey the shared projected surface.'
    ),
    depth: copyFor(
      'Tourne les deux modèles ensemble pour observer les écarts sous plusieurs angles.',
      'Rotate both models together to see how the differences change with the viewing angle.'
    )
  };
  text.textContent = help[mode] ?? helpText;
  renderLayout();
}

function listenSelect(name, action) {
  byId(name).addEventListener('change', event => {
    if (renderer) action(event.target.value);
    requestDraw();
  });
}

function updateMaterial() {
  if (renderer) renderer.material = material.value;
  neutral.setAttribute('aria-pressed', String(material.value === 'clay'));
}

function updateComposite() {
  const value = byId('composite').value;
  if (renderer) renderer.blend = value;
  byId('range-a').hidden = value !== 'independent';
  const labels = {
    mix: copyFor('Part de la monoplace B', 'Car B blend'),
    wipe: copyFor('Position du balayage', 'Wipe position'),
    independent: copyFor('Opacité B', 'Car B opacity')
  };
  byId('slider-label').textContent = labels[value];
}

function updateDepth() {
  const threshold = Number(byId('sensitivity').value);
  if (renderer) renderer.threshold = threshold;
  byId('threshold').value = threshold + ' mm';
  byId('depth-minus').textContent = '−' + threshold * 5 + copyFor(' mm · B en retrait', ' mm · B further back');
  byId('depth-plus').textContent = '+' + threshold * 5 + copyFor(' mm · B en avant', ' mm · B further forward');
}

function updateSection() {
  const enabled = byId('section').checked;
  const millimetres = Number(byId('section-x').value);
  byId('section-tools').hidden = !enabled;
  byId('section-position').value = format.format(millimetres / 1000) + ' m';
  byId('section-x').setAttribute('aria-valuetext', byId('section-position').value);
  if (renderer) renderer.section = enabled ? millimetres / 1000 : null;
}

function updateIsolation() {
  const isolate = byId('isolate').checked;
  if (renderer) renderer.isolateDrs = isolate;
}

function updateOpacity() {
  for (const [input, output, key] of [['opacity', 'percentage', 'opacity'], ['opacity-a', 'percentage-a', 'opacityA']]) {
    const value = Number(byId(input).value) / 100;
    byId(output).value = formatPercent.format(value);
    if (renderer) renderer[key] = value;
  }
}

function syncSettings() {
  renderer.align = byId('align').value;
  renderer.alignCars();
  renderer.light = byId('light').value;
  stage.dataset.light = renderer.light;
  renderer.quality = byId('quality').value;
  updateOpacity();
  updateMaterial();
  updateComposite();
  updateDepth();
  updateSection();
  updateIsolation();
}

share.addEventListener('click', async () => {
  const url = permalink().href;
  try {
    await navigator.clipboard.writeText(url);
    shareLink.hidden = true;
    shareStatus.textContent = copyFor('Lien copié.', 'Link copied.');
  } catch {
    shareLink.hidden = false;
    shareLink.value = url;
    shareLink.focus();
    shareLink.select();
    shareStatus.textContent = copyFor('Copie le lien sélectionné.', 'Copy the selected link.');
  }
});
for (const link of document.querySelectorAll('.rf-lang')) {
  link.addEventListener('click', () => { link.href = permalink(link.href).href; });
}

exportButton.addEventListener('click', async () => {
  if (!ready || busy || exportButton.disabled) return;
  exporting = true;
  exportButton.disabled = true;
  shareStatus.textContent = copyFor('Préparation du PNG…', 'Preparing PNG…');
  try {
    const mode = displayedMode();
    const filename = 'mercedes-' + ids.join('-') + '-' + mode + '.png';
    const modeLabel = modeInputs.find(input => input.value === mode).nextElementSibling.textContent;
    const legend = [modeLabel, part.selectedOptions[0].textContent, byId('align').selectedOptions[0].textContent];
    if (byId('section').checked) legend.push(copyFor('Tranche X ', 'Slice X ') + byId('section-position').value);
    if (byId('isolate').checked) legend.push(copyFor('Volet DRS seul', 'DRS flap only'));
    const image = renderer.capture({
      names: labels.map(label => label.textContent),
      legend,
      caption: copyFor('Raphaël Flipo · Reconstitutions Blender', 'Raphaël Flipo · Blender reconstructions')
    });
    const file = await new Promise(resolve => image.toBlob(resolve, 'image/png'));
    if (!file) throw new Error();
    const href = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
    shareStatus.textContent = copyFor('PNG exporté.', 'PNG exported.');
  } catch {
    shareStatus.textContent = copyFor('Impossible d’exporter cette vue.', 'This view could not be exported.');
  } finally {
    exporting = false;
    exportButton.disabled = busy || !ready;
    requestDraw();
  }
});

fillPicks();
updatePicks();
updateMaterial();
updateOpacity();
updateDepth();
updateSection();
displayView(view);
renderLayout();
loading.hidden = false;
share.disabled = false;
loading.addEventListener('click', () => showPair(true));
picks.forEach((select, index) => select.addEventListener('change', () => {
  ids[index] = select.value;
  updatePicks();
  if (ready) showPair();
}));
swap.addEventListener('click', () => {
  ids.reverse();
  updatePicks();
  if (ready) showPair();
});

for (const input of modeInputs) input.addEventListener('change', () => updateMode(input.value));
sync.addEventListener('change', () => {
  if (!renderer) return;
  isSynced = sync.checked;
  renderer.sync = isSynced;
  if (isSynced) renderer.link();
  requestDraw();
});
listenSelect('align', value => {
  renderer.align = value;
  renderer.alignCars();
});
listenSelect('light', value => {
  renderer.light = value;
  stage.dataset.light = value;
});
listenSelect('quality', value => { renderer.quality = value; });
listenSelect('material', updateMaterial);
listenSelect('composite', updateComposite);
neutral.addEventListener('click', () => {
  material.value = material.value === 'clay' ? 'paint' : 'clay';
  updateMaterial();
  requestDraw();
});
for (const name of ['opacity', 'opacity-a']) {
  byId(name).addEventListener('input', () => {
    updateOpacity();
    requestDraw();
  });
}
byId('sensitivity').addEventListener('input', () => {
  updateDepth();
  requestDraw();
});
for (const name of ['section', 'section-x']) {
  byId(name).addEventListener('input', () => {
    updateSection();
    requestDraw();
  });
}
byId('isolate').addEventListener('change', () => {
  if (byId('isolate').checked) {
    part.value = 'rearWing';
    part.dispatchEvent(new Event('change'));
  }
  updateIsolation();
  requestDraw();
});
part.addEventListener('change', () => {
  if (part.value !== 'rearWing') byId('isolate').checked = false;
  updateIsolation();
  if (renderer) renderer.choosePart(part.value, travel());
  else retainedCamera = { orbits: [null, null], active: 0 };
  displayView(part.value === 'none' ? 'studio' : '');
  updateNotes();
  requestDraw();
});
for (const button of views) button.addEventListener('click', () => {
  if (!renderer) return;
  part.value = 'none';
  byId('isolate').checked = false;
  updateIsolation();
  renderer.chooseView(button.dataset.view, travel());
  displayView(button.dataset.view);
  updateNotes();
  requestDraw();
});

function bouger(slot, azimuth, elevation, zoom) {
  if (!ready) return;
  renderer.motion(slot, azimuth, elevation, zoom);
  if (azimuth || elevation) displayView('');
  requestDraw();
}
byId('in').addEventListener('click', () => bouger(renderer?.active ?? 0, 0, 0, 1.18));
byId('out').addEventListener('click', () => bouger(renderer?.active ?? 0, 0, 0, 1 / 1.18));

function activePanel(event) {
  if (renderer.mode !== 'split') return 0;
  const box = canvas.getBoundingClientRect();
  return stage.dataset.layout === 'stack'
    ? Number(event.clientY > box.top + box.height / 2)
    : Number(event.clientX > box.left + box.width / 2);
}
const contacts = new Map();
let dragPanel = 0;
canvas.addEventListener('pointerdown', event => {
  if (!ready || (event.pointerType === 'mouse' && event.button !== 0)) return;
  if (!contacts.size) dragPanel = activePanel(event);
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);
  contacts.set(event.pointerId, [event.clientX, event.clientY]);
});
const distance = ([a, b]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
canvas.addEventListener('pointermove', event => {
  const old = contacts.get(event.pointerId);
  if (!old) return;
  const d0 = contacts.size === 2 ? distance([...contacts.values()]) : 0;
  const pt = [event.clientX, event.clientY];
  contacts.set(event.pointerId, pt);
  if (contacts.size === 1) {
    bouger(dragPanel, (old[0] - pt[0]) * .009, (pt[1] - old[1]) * .008, 1);
  } else if (contacts.size === 2 && d0 > 2) {
    bouger(dragPanel, 0, 0, distance([...contacts.values()]) / d0);
  }
});
for (const event of ['lostpointercapture', 'pointerup', 'pointercancel']) {
  canvas.addEventListener(event, e => contacts.delete(e.pointerId));
}
canvas.addEventListener('wheel', event => {
  if (!ready || (document.activeElement !== canvas && !event.ctrlKey)) return;
  event.preventDefault();
  const pixels = event.deltaY * (event.deltaMode ? 16 : 1);
  bouger(activePanel(event), 0, 0, Math.exp(Math.max(-100, Math.min(100, -pixels)) * .003));
}, { passive: false });

const keyboard = {
  ArrowLeft: [-.13, 0, 1], ArrowRight: [.13, 0, 1],
  ArrowUp: [0, .12, 1], ArrowDown: [0, -.12, 1],
  '+': [0, 0, 1.16], '=': [0, 0, 1.16], '-': [0, 0, 1 / 1.16]
};
canvas.addEventListener('keydown', event => {
  if (!renderer || !Object.hasOwn(keyboard, event.key)) return;
  event.preventDefault();
  bouger(renderer.active, ...keyboard[event.key]);
});

const siblings = [...document.querySelectorAll('.rf-header, .cmp-intro, .cmp-technical, .rf-footer')];
function updateFull() {
  const open = document.fullscreenElement === panel || panel.classList.contains('cmp-expanded');
  fullScreen.setAttribute('aria-pressed', String(open));
  requestDraw();
  fullScreen.textContent = open ? copyFor('Quitter le plein écran', 'Exit full screen') : copyFor('Plein écran', 'Full screen');
}
function enlarged(value) {
  panel.classList.toggle('cmp-expanded', value);
  if (value) {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
  } else {
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
  }
  for (const item of siblings) item.inert = value;
  updateFull();
}
fullScreen.addEventListener('click', async () => {
  if (document.fullscreenElement === panel) await document.exitFullscreen();
  else if (panel.classList.contains('cmp-expanded')) enlarged(false);
  else if (document.fullscreenEnabled && panel.requestFullscreen) {
    try { await panel.requestFullscreen(); } catch { enlarged(true); }
  } else enlarged(true);
});
document.addEventListener('fullscreenchange', updateFull);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !panel.classList.contains('cmp-expanded')) return;
  enlarged(false);
  fullScreen.focus();
});

new ResizeObserver(renderLayout).observe(stage);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    stageVisible = entry.isIntersecting;
    if (stageVisible) requestDraw();
  }).observe(stage);
}
document.addEventListener('visibilitychange', requestDraw);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  fail(copyFor(
    'Le navigateur a interrompu la 3D. Réessaie pour restaurer les deux modèles.',
    'The browser interrupted the 3D view. Try again to restore both models.'
  ));
});
