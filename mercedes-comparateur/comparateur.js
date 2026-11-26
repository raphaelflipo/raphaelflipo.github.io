import { monoplaces } from '/assets/donnees-mercedes.js';
import { annotations } from '/assets/annotations-mercedes.js';

const byId = id => document.getElementById('cmp-' + id);
const panel = byId('panel');
const stage = byId('stage');
const canvas = byId('canvas');
const loading = byId('load');
const fullScreen = byId('full');
const controls = byId('controls');
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
const params = new URLSearchParams(location.search);
const initialLeft = Object.hasOwn(monoplaces, params.get('gauche')) ? params.get('gauche') : 'w14';
const initialRight = Object.hasOwn(monoplaces, params.get('droite')) ? params.get('droite') : 'w15';
let ids = [initialLeft, initialRight === initialLeft
  ? Object.keys(monoplaces).find(id => id !== initialLeft) : initialRight];
let loadedIds = [];
let renderer;
let pendingFrame = null;
let busy = false;
let ready = false;
let isSynced = true;

function renderLayout() {
  stage.dataset.layout = stage.clientWidth < 620 ? 'stack' : 'columns';
  requestDraw();
}

function requestDraw() {
  if (pendingFrame !== null || !ready || document.hidden) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    try {
      const pixels = renderer.render();
      if (!pixels) return;
      canvas.dataset.rendered = 'true';
      ruler.hidden = false;
      const increment = pixels > 110 ? .5 : pixels < 24 ? 2 : 1;
      ruler.querySelector('i').style.width = (increment * pixels) + 'px';
      ruler.querySelector('span').textContent = new Intl.NumberFormat('fr-FR').format(increment) + ' m';
      // Le nombre décrit l'échelle de la comparaison synchronisée, ou
      // celle de la dernière vue manipulée si les vues sont indépendantes.
      ruler.setAttribute('aria-label', 'Échelle de la vue active');
    } catch {
      fail('Le moteur 3D a rencontré une erreur. Les rendus restent disponibles.');
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
    title.textContent = `${car.name} · ${car.year}`;
    copy.textContent = entry?.text ?? `Configuration représentée à ${car.circuit}.`;
    link.textContent = entry?.credit ?? `Voir la fiche ${car.name}`;
    link.href = entry?.source ?? car.page;
    box.append(title, copy, link);
    notes.append(box);
  }
}

function setBusy(amount) {
  busy = amount;
  for (const element of [...picks, swap, loading]) element.disabled = busy;
  panel.setAttribute('aria-busy', String(busy));
}

function fail(message, reset = true) {
  if (reset) {
    renderer?.dispose();
    renderer = null;
  }
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
  loading.textContent = 'Réessayer la 3D';
  status.textContent = message;
  setBusy(false);
}

async function showPair(giveFocus = false) {
  if (busy) return;
  setBusy(true);
  status.textContent = 'Chargement des deux monoplaces…';
  try {
    if (!renderer) {
      const { Comparateur } = await import('./moteur.js');
      renderer = new Comparateur(canvas);
    }
    await renderer.load(ids);
    loadedIds = [...ids];
    stage.querySelector('.cmp-posters').hidden = true;
    loading.hidden = true;
    controls.hidden = false;
    canvas.hidden = false;
    fullScreen.hidden = false;
    ready = true;
    updateMode(renderer.mode);
    renderer.choosePart(part.value);
    displayView(part.value === 'none' ? 'studio' : '');
    status.textContent = `${monoplaces[ids[0]].name} et ${monoplaces[ids[1]].name} · projection orthographique en mètres.`;
    requestDraw();
    if (giveFocus) canvas.focus({ preventScroll: true });
  } catch {
    if (loadedIds.length) {
      ids = [...loadedIds];
      updatePicks();
    }
    fail('La 3D est indisponible. Réessaie le chargement ou ouvre les galeries des monoplaces.');
  } finally {
    setBusy(false);
  }
}

function displayView(view) {
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
  const text = byId('help');
  text.textContent = mode === 'silhouette'
    ? 'Le turquoise montre la zone propre à A, l’ocre celle propre à B. Le gris indique la surface projetée commune.'
    : 'Glisse pour pivoter, pince pour zoomer. Au clavier, utilise les flèches et les touches + ou − dans la vue 3D.';
  renderLayout();
}

function listenSelect(name, action) {
  byId(name).addEventListener('change', event => {
    if (renderer) action(event.target.value);
    requestDraw();
  });
}

fillPicks();
updatePicks();
renderLayout();
loading.hidden = false;
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
listenSelect('material', value => { renderer.material = value; });
listenSelect('composite', value => {
  renderer.blend = value;
  byId('slider-label').textContent = value === 'wipe' ? 'Position du balayage' : 'Part de la monoplace B';
});
byId('opacity').addEventListener('input', event => {
  if (renderer) renderer.opacity = Number(event.target.value) / 100;
  byId('percentage').value = `${event.target.value} %`;
  requestDraw();
});
part.addEventListener('change', () => {
  if (renderer) renderer.choosePart(part.value);
  displayView(part.value === 'none' ? 'studio' : '');
  updateNotes();
  requestDraw();
});
for (const button of views) button.addEventListener('click', () => {
  if (!renderer) return;
  part.value = 'none';
  renderer.chooseView(button.dataset.view);
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
byId('in').addEventListener('click', () => bouger(renderer.active, 0, 0, 1.18));
byId('out').addEventListener('click', () => bouger(renderer.active, 0, 0, 1 / 1.18));

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
  fullScreen.textContent = open ? 'Quitter le plein écran' : 'Plein écran';
}
function enlarged(value) {
  panel.classList.toggle('cmp-expanded', value);
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
document.addEventListener('visibilitychange', requestDraw);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  fail('Le navigateur a interrompu la 3D. Réessaie pour restaurer les deux modèles.');
});
