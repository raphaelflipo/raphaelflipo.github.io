const panel = document.querySelector('[data-model]');
const viewer = panel.querySelector('model-viewer');
const controls = panel.querySelector('#car-controls');
const loadButton = panel.querySelector('#car-load');
const expand = panel.querySelector('#car-expand');
const status = panel.querySelector('[role="status"]');
const views = [...controls.querySelectorAll('[data-view]')];
const slider = controls.querySelector('input[type="range"]');
const lightControls = controls.querySelector('.car-light');
const opening = controls.querySelector('output');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let activeView = null;

function selectView(button) {
  const [azimuth, elevation, radius] = button.dataset.orbit.split(' ');
  const distance = parseFloat(radius) * (panel.clientWidth < 620 && button.dataset.view !== 'front' ? 1.25 : 1);
  viewer.cameraTarget = button.dataset.target;
  viewer.cameraOrbit = `${azimuth} ${elevation} ${distance}m`;
  viewer.fieldOfView = '28deg';
  activeView = button;
  for (const view of views) view.setAttribute('aria-pressed', String(view === button));
  if (reduceMotion.matches) viewer.jumpCameraToGoal();
}

for (const button of views) button.addEventListener('click', () => selectView(button));

viewer.addEventListener('camera-change', event => {
  if (event.detail.source !== 'user-interaction' || !activeView) return;
  activeView = null;
  for (const button of views) button.setAttribute('aria-pressed', 'false');
});

function updateDrs() {
  const angle = Number(slider.value);
  // La fin exacte du clip boucle sur sa première image dans le moteur 3D.
  const fraction = Math.min(angle / Number(slider.max), 1 - 1e-6);
  viewer.currentTime = viewer.duration * fraction;
  opening.value = `${angle}°`;
  slider.setAttribute('aria-valuetext', `${angle} degrés`);
}

slider.addEventListener('input', updateDrs);

lightControls?.addEventListener('change', event => {
  const light = event.target.value === 'light';
  panel.dataset.light = light ? 'light' : 'dark';
  viewer.exposure = light ? 1.5 : 1.12;
  viewer.shadowIntensity = light ? 0.42 : 0.65;
});

function updateExpandState() {
  const expanded = document.fullscreenElement === panel || panel.classList.contains('is-expanded');
  const label = expanded ? 'Quitter le plein écran' : 'Passer en plein écran';
  expand.setAttribute('aria-label', label);
  expand.title = label;
  expand.setAttribute('aria-pressed', String(expanded));
  if (activeView) selectView(activeView);
}

function setExpandedFallback(active) {
  panel.classList.toggle('is-expanded', active);
  for (const element of document.querySelectorAll('.rf-header, .car-navigation, .w13-detail, .rf-footer, .rf-skip')) {
    element.inert = active;
  }
  updateExpandState();
}

expand.addEventListener('click', async () => {
  if (document.fullscreenElement === panel) {
    await document.exitFullscreen();
  } else if (panel.classList.contains('is-expanded')) {
    setExpandedFallback(false);
  } else if (document.fullscreenEnabled && panel.requestFullscreen) {
    try { await panel.requestFullscreen(); }
    catch { setExpandedFallback(true); }
  } else {
    setExpandedFallback(true);
  }
});
document.addEventListener('fullscreenchange', updateExpandState);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && panel.classList.contains('is-expanded')) {
    setExpandedFallback(false);
    expand.focus();
  }
});

function showError() {
  panel.classList.remove('is-ready');
  if (panel.classList.contains('is-expanded')) setExpandedFallback(false);
  controls.hidden = true;
  expand.hidden = true;
  loadButton.hidden = false;
  loadButton.disabled = false;
  loadButton.textContent = 'Réessayer';
  status.textContent = 'La vue 3D est indisponible. Les rendus restent accessibles sur cette page.';
}

viewer.addEventListener('error', showError);
viewer.addEventListener('load', () => {
  panel.classList.add('is-ready');
  controls.hidden = false;
  expand.hidden = false;
  loadButton.hidden = true;
  if (viewer.availableAnimations.includes('DRS')) {
    viewer.animationName = 'DRS';
    viewer.pause();
    slider.value = '0';
    updateDrs();
    slider.closest('.w13-drs').hidden = false;
  }
  selectView(views[0]);
  viewer.jumpCameraToGoal();
  status.textContent = 'Glisse ou utilise les flèches pour pivoter. Pince l’écran ou utilise la molette pour zoomer.';
  views[0].focus({ preventScroll: true });
});

loadButton.hidden = false;
loadButton.addEventListener('click', async () => {
  loadButton.disabled = true;
  status.textContent = 'Chargement de la W14…';
  try {
    const { ModelViewerElement } = await import('/aileron-f1/vendor/model-viewer.min.js');
    ModelViewerElement.dracoDecoderLocation = '/mercedes-w13/draco/';
    if (viewer.hasAttribute('src')) {
      viewer.removeAttribute('src');
      await viewer.updateComplete;
    }
    viewer.src = panel.dataset.model;
  } catch {
    showError();
  }
});
