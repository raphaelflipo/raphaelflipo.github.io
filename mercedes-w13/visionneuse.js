const panel = document.getElementById('w13-viewer');
const viewer = document.getElementById('w13-model');
const controls = document.getElementById('w13-controls');
const status = document.getElementById('w13-status');
const expand = document.getElementById('w13-expand');
const drs = document.getElementById('w13-drs');
const drsAngle = document.getElementById('w13-drs-angle');
const viewButtons = [...controls.querySelectorAll('[data-view]')];

const views = {
  studio: { target: '1.44m 0.47m 0m', orbit: '-58deg 68deg', distance: 9.3 },
  side: { target: '1.44m 0.48m 0m', orbit: '0deg 82deg', distance: 10.2 },
  front: { target: '-0.18m 0.45m 0m', orbit: '-90deg 80deg', distance: 6.7 },
  top: { target: '1.44m 0.54m 0m', orbit: '0deg 1deg', distance: 9.8 },
  rear: { target: '3.67m 0.76m 0m', orbit: '70deg 71deg', distance: 3.55 },
  under: { target: '1.63m 0.31m 0m', orbit: '24deg 157deg', distance: 9.2 },
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let selectedView = 'studio';

function setView(name) {
  const { target, orbit, distance } = views[name];
  const scale = panel.clientWidth < 620 && name !== 'front' ? 1.3 : 1;
  viewer.cameraTarget = target;
  viewer.cameraOrbit = `${orbit} ${distance * scale}m`;
  viewer.fieldOfView = '28deg';
  selectedView = name;
  viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  if (reducedMotion.matches) viewer.jumpCameraToGoal();
}

function showPoster() {
  panel.classList.remove('is-ready');
  controls.hidden = true;
  expand.hidden = true;
  status.textContent = 'La vue interactive est indisponible. Les rendus Blender restent visibles sur cette page.';
}

for (const button of viewButtons) {
  button.addEventListener('click', () => setView(button.dataset.view));
}

viewer.addEventListener('camera-change', event => {
  if (event.detail.source !== 'user-interaction' || !selectedView) return;
  selectedView = null;
  viewButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
});

drs.addEventListener('input', () => {
  const angle = Number(drs.value);
  viewer.currentTime = viewer.duration * angle / Number(drs.max);
  drsAngle.value = `${angle}°`;
  drs.setAttribute('aria-valuetext', `${angle} degrés`);
});

if (document.fullscreenEnabled && typeof panel.requestFullscreen === 'function') {
  viewer.addEventListener('load', () => { expand.hidden = false; }, { once: true });
  expand.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === panel) await document.exitFullscreen();
      else await panel.requestFullscreen();
    } catch {
      status.textContent = 'Le plein écran est indisponible dans ce navigateur.';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === panel;
    expand.setAttribute('aria-label', active ? 'Quitter le plein écran' : 'Passer en plein écran');
    expand.title = active ? 'Quitter le plein écran' : 'Plein écran';
    if (selectedView) setView(selectedView);
  });
}

try {
  if (!document.createElement('canvas').getContext('webgl2')) throw new Error('WebGL 2 indisponible');
  const { ModelViewerElement } = await import('/aileron-f1/vendor/model-viewer.min.js');
  ModelViewerElement.dracoDecoderLocation = '/mercedes-w13/draco/';
  status.textContent = 'Chargement de la vue 3D…';
  viewer.addEventListener('error', showPoster);
  viewer.addEventListener('load', () => {
    viewer.animationName = 'DRS';
    viewer.pause();
    viewer.currentTime = 0;
    drs.disabled = !viewer.availableAnimations.includes('DRS');
    drs.setAttribute('aria-valuetext', '0 degrés');
    setView('studio');
    viewer.jumpCameraToGoal();
    panel.classList.add('is-ready');
    controls.hidden = false;
    status.textContent = 'Fais glisser pour pivoter. Utilise la molette ou pince l’écran pour zoomer.';
  }, { once: true });
  viewer.src = './mercedes-w13.glb';
} catch {
  showPoster();
}
