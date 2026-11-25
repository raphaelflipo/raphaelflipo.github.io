import { loadModel } from './charger-modele-3d.js';

const panel = document.querySelector('[data-model]');
const viewer = panel.querySelector('model-viewer');
const controls = panel.querySelector('.w13-controls');
const loadButton = panel.querySelector('.car-load');
const expand = panel.querySelector('.w13-expand');
const status = panel.querySelector('[role="status"]');
const views = [...controls.querySelectorAll('[data-view]')];
const drs = controls.querySelector('.w13-drs');
const slider = drs.querySelector('input');
const opening = drs.querySelector('output');
const [initialView] = views;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactStage = matchMedia('(max-width: 665px)');
const inertOutsidePanel = [];
let activeView;
let loading = false;

function selectView(button) {
  const [azimuth, elevation, radius] = button.dataset.orbit.split(' ');
  const scale = panel.clientWidth < 620 && button.dataset.view !== 'front' ? Number(panel.dataset.cameraScale) : 1;
  viewer.cameraTarget = button.dataset.target;
  viewer.cameraOrbit = `${azimuth} ${elevation} ${parseFloat(radius) * scale}m`;
  viewer.fieldOfView = '28deg';
  activeView = button;
  for (const view of views) view.setAttribute('aria-pressed', String(view === button));
  if (reduceMotion.matches) viewer.jumpCameraToGoal();
}

for (const button of views) button.addEventListener('click', () => selectView(button));
compactStage.addEventListener('change', () => {
  if (activeView) selectView(activeView);
});

viewer.addEventListener('camera-change', event => {
  if (event.detail.source !== 'user-interaction' || !activeView) return;
  activeView = null;
  for (const button of views) button.setAttribute('aria-pressed', 'false');
});

function updateDrs() {
  const angle = Number(slider.value);
  // La dernière image du clip boucle sur la première dans le moteur 3D.
  const fraction = Math.min(angle / Number(slider.max), 1 - 1e-6);
  viewer.currentTime = viewer.duration * fraction;
  opening.value = `${angle}°`;
  slider.setAttribute('aria-valuetext', `${angle} degrés`);
}

slider.addEventListener('input', updateDrs);

controls.querySelector('.car-light')?.addEventListener('change', event => {
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
  if (active) {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', `Visionneuse 3D de la ${panel.dataset.car}`);
    for (let element = panel; element !== document.body; element = element.parentElement) {
      for (const sibling of element.parentElement.children) {
        if (sibling === element || sibling.inert) continue;
        sibling.inert = true;
        inertOutsidePanel.push(sibling);
      }
    }
  } else {
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    panel.removeAttribute('aria-label');
    for (const element of inertOutsidePanel.splice(0)) element.inert = false;
  }
  updateExpandState();
}

expand.addEventListener('click', async () => {
  if (document.fullscreenElement === panel) {
    await document.exitFullscreen();
  } else if (panel.classList.contains('is-expanded')) {
    setExpandedFallback(false);
  } else if (document.fullscreenEnabled && panel.requestFullscreen) {
    try {
      await panel.requestFullscreen();
    } catch {
      setExpandedFallback(true);
    }
  } else {
    setExpandedFallback(true);
  }
});
document.addEventListener('fullscreenchange', updateExpandState);

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !panel.classList.contains('is-expanded')) return;
  setExpandedFallback(false);
  expand.focus();
});

function finishLoading() {
  loading = false;
  loadButton.removeAttribute('aria-disabled');
}

function showError() {
  const focusWasInViewer = panel.contains(document.activeElement);
  finishLoading();
  panel.classList.remove('is-ready');
  if (panel.classList.contains('is-expanded')) setExpandedFallback(false);
  if (document.fullscreenElement === panel) document.exitFullscreen().catch(() => {});
  controls.hidden = true;
  expand.hidden = true;
  loadButton.hidden = false;
  loadButton.textContent = 'Réessayer';
  status.textContent = 'La vue 3D est indisponible. Les rendus restent accessibles sur cette page.';
  if (focusWasInViewer) loadButton.focus({ preventScroll: true });
}

viewer.addEventListener('error', showError);
viewer.addEventListener('load', () => {
  const focusWasOnLoad = document.activeElement === loadButton;
  finishLoading();
  panel.classList.add('is-ready');
  controls.hidden = false;
  expand.hidden = false;
  loadButton.hidden = true;
  drs.hidden = !viewer.availableAnimations.includes('DRS');
  if (!drs.hidden) {
    viewer.animationName = 'DRS';
    viewer.pause();
    slider.value = '0';
    updateDrs();
  }
  selectView(initialView);
  viewer.jumpCameraToGoal();
  status.textContent = 'Fais glisser pour pivoter ou utilise les flèches du clavier. Utilise la molette ou pince l’écran pour zoomer.';
  if (focusWasOnLoad) initialView.focus({ preventScroll: true });
});

loadButton.hidden = false;
loadButton.addEventListener('click', async () => {
  if (loading) return;
  loading = true;
  loadButton.setAttribute('aria-disabled', 'true');
  status.textContent = `Chargement de la ${panel.dataset.car}…`;
  try {
    await loadModel(viewer, panel.dataset.model, '/mercedes-w13/draco/');
  } catch {
    showError();
  }
});
