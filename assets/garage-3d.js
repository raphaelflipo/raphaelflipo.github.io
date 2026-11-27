import { loadModel } from './charger-modele-3d.js?v=2';
import { monoplaces } from './donnees-mercedes.js';
import { exportPhoto, restoreCamera, saveCamera, shareView } from './vues-3d.js';

const garage = document.getElementById('garage');
const stage = garage.querySelector('.garage-stage');
const viewer = garage.querySelector('model-viewer');
const poster = garage.querySelector('.garage-poster');
const model = garage.querySelector('#garage-car');
const view = garage.querySelector('#garage-view');
const lighting = garage.querySelector('#garage-light');
const backdrop = garage.querySelector('#garage-backdrop');
const load = garage.querySelector('#garage-load');
const fullscreen = garage.querySelector('#garage-fullscreen');
const photo = garage.querySelector('#garage-photo');
const share = garage.querySelector('#garage-share');
const tourButton = garage.querySelector('#garage-tour');
const ar = garage.querySelector('#garage-ar');
const output = garage.querySelector('#garage-url');
const status = garage.querySelector('#garage-status');
const dossier = garage.querySelector('#garage-dossier');
const modelPage = garage.querySelector('#garage-model-page');
const english = document.documentElement.lang === 'en';
const prefix = english ? '/en' : '';
const defaults = new URL(location.href).searchParams;
const state = { requested: false, pending: false };
const tour = { index: -1, timer: 0 };
const tourCars = ['w13', 'w14', 'w15', 'w16'];

const messages = english ? {
  loading: 'Loading the model…', loaded: 'Drag or use the arrow keys to rotate. Scroll or pinch to zoom.',
  failed: 'The 3D scene is unavailable. The Blender render and technical pages remain accessible.',
  retry: 'Retry the 3D scene', unsupportedFullscreen: 'Fullscreen is unavailable in this browser.',
  copied: 'Link copied.', copyManually: 'Copy the selected link.',
  captured: 'PNG image exported.', captureFailed: 'The PNG export is unavailable in this browser.',
  render: 'Blender render', actual: 'Interactive 3D model',
  tour: 'Guided tour', stopTour: 'Stop the tour', arUnavailable: 'The AR session could not start.'
} : {
  loading: 'Chargement du modèle…', loaded: 'Faites glisser ou utilisez les flèches pour pivoter. Faites défiler ou pincez pour zoomer.',
  failed: 'La scène 3D est indisponible. Le rendu Blender et les fiches restent accessibles.',
  retry: 'Réessayer la scène 3D', unsupportedFullscreen: 'Le plein écran est indisponible dans ce navigateur.',
  copied: 'Lien copié.', copyManually: 'Copiez le lien sélectionné.',
  captured: 'Image PNG exportée.', captureFailed: 'L’export PNG est indisponible dans ce navigateur.',
  render: 'Rendu Blender', actual: 'Modèle 3D interactif',
  tour: 'Visite guidée', stopTour: 'Arrêter la visite', arUnavailable: 'La session de réalité augmentée n’a pas pu démarrer.'
};

const cameras = {
  studio: ['-48deg', '67deg', 9.2],
  front: ['-90deg', '84deg', 7.8],
  side: ['0deg', '84deg', 10.3],
  top: ['0deg', '2deg', 10.6],
  rear: ['90deg', '83deg', 8.5]
};

function useConfiguration() {
  const x = model.value === 'w13' ? 1.44 : -.15;
  const [azimuth, elevation, radius] = cameras[view.value];
  viewer.cameraTarget = `${x}m .47m 0m`;
  viewer.cameraOrbit = `${azimuth} ${elevation} ${stage.clientWidth < 580 ? radius * 1.28 : radius}m`;
  viewer.fieldOfView = '28deg';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) viewer.jumpCameraToGoal?.();
}

function setAppearance() {
  viewer.exposure = lighting.value === 'soft' ? 1.42 : 1.13;
  viewer.shadowIntensity = lighting.value === 'soft' ? .4 : .68;
  stage.dataset.backdrop = backdrop.value;
}

function useCar() {
  const car = monoplaces[model.value];
  useConfiguration();
  setAppearance();
  poster.src = model.value === 'w13' ? '/mercedes-w13/mercedes-w13-800.webp' : car.poster;
  poster.alt = `${messages.render} · Mercedes-AMG ${car.name}`;
  viewer.alt = `${messages.actual} · Mercedes-AMG ${car.name}`;
  dossier.href = `${prefix}/ingenierie/${model.value}/`;
  modelPage.href = prefix + car.page;
}

function setLoading(pending) {
  state.pending = pending;
  load.setAttribute('aria-disabled', String(pending));
  model.disabled = pending;
  photo.disabled = pending || !viewer.loaded;
  fullscreen.disabled = pending || !viewer.loaded;
  ar.disabled = pending || !viewer.loaded;
}

function stopTour() {
  clearTimeout(tour.timer);
  tour.index = -1;
  tourButton.setAttribute('aria-pressed', 'false');
  tourButton.textContent = messages.tour;
}

function scheduleTour() {
  if (tour.index < 0) return;
  tour.timer = setTimeout(() => {
    if (tour.index === tourCars.length - 1) stopTour();
    else visitCar(++tour.index);
  }, 8000);
}

function visitCar(index) {
  model.value = tourCars[index];
  view.value = ['studio', 'front', 'side', 'studio'][index];
  garage.dispatchEvent(new Event('garage-selection'));
  state.restoreCamera = false;
  useCar();
  if (stage.classList.contains('is-live') && viewer.loaded && state.car === model.value) scheduleTour();
  else openModel();
}

function showError() {
  stopTour();
  setLoading(false);
  photo.disabled = true;
  fullscreen.disabled = true;
  load.hidden = false;
  load.textContent = messages.retry;
  stage.classList.remove('is-live');
  status.textContent = messages.failed;
}

async function openModel() {
  if (state.pending) return;
  state.requested = true;
  setLoading(true);
  stage.classList.remove('is-live');
  load.hidden = false;
  status.textContent = messages.loading;
  try {
    await loadModel(viewer, monoplaces[model.value].model, '/mercedes-w13/draco/', 1);
  } catch {
    showError();
  }
}

viewer.addEventListener('load', () => {
  const restoreFocus = document.activeElement === load;
  stage.classList.add('is-live');
  state.car = model.value;
  setLoading(false);
  load.hidden = true;
  useConfiguration();
  if (!(state.restoreCamera && restoreCamera(viewer, defaults))) viewer.jumpCameraToGoal();
  state.restoreCamera = false;
  status.textContent = messages.loaded;
  scheduleTour();
  if (restoreFocus) {
    const camera = garage.querySelector('.signature-camera-selector:not([hidden]) button[aria-pressed="true"]');
    (camera || view).focus({ preventScroll: true });
  }
});
viewer.addEventListener('error', showError);
load.addEventListener('click', openModel);
model.addEventListener('change', () => {
  stopTour();
  state.restoreCamera = false;
  useCar();
  if (state.requested) openModel();
});
view.addEventListener('change', () => {
  stopTour();
  useConfiguration();
});
for (const control of [lighting, backdrop]) control.addEventListener('change', setAppearance);
new ResizeObserver(entries => {
  for (const entry of entries) {
    const compact = entry.contentRect.width < 580;
    if (compact === state.compact) continue;
    state.compact = compact;
    if (viewer.loaded) useConfiguration();
  }
}).observe(stage);

tourButton.addEventListener('click', () => {
  if (tour.index >= 0) {
    stopTour();
    return;
  }
  if (state.pending) return;
  tour.index = 0;
  tourButton.setAttribute('aria-pressed', 'true');
  tourButton.textContent = messages.stopTour;
  visitCar(0);
});
new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stopTour(); }).observe(garage);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopTour(); });
viewer.addEventListener('camera-change', event => {
  if (event.detail.source === 'user-interaction') stopTour();
});

fullscreen.addEventListener('click', async () => {
  try {
    await stage.requestFullscreen();
  } catch {
    status.textContent = messages.unsupportedFullscreen;
  }
});

photo.addEventListener('click', async () => {
  if (photo.disabled) return;
  stopTour();
  photo.disabled = true;
  model.disabled = true;
  try {
    const dimensions = await exportPhoto(viewer, `Mercedes-AMG-${monoplaces[model.value].name}`, backdrop.value);
    status.textContent = `${messages.captured} ${dimensions} px`;
  } catch {
    status.textContent = messages.captureFailed;
  } finally {
    photo.disabled = state.pending || !viewer.loaded;
    model.disabled = state.pending;
  }
});

if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-ar').then(supported => {
    if (!supported) return;
    viewer.setAttribute('ar', '');
    viewer.setAttribute('ar-modes', 'webxr');
    ar.hidden = false;
    ar.disabled = !viewer.loaded;
  }).catch(() => {});
}
viewer.addEventListener('ar-status', event => {
  if (event.detail.status === 'failed') status.textContent = messages.arUnavailable;
});
ar.addEventListener('click', async () => {
  stopTour();
  try {
    await viewer.activateAR();
  } catch {
    status.textContent = messages.arUnavailable;
  }
});

share.addEventListener('click', () => {
  const url = new URL(location.pathname, location.origin);
  url.hash = 'garage';
  for (const [name, control] of Object.entries({ monoplace: model, vue: view, lumiere: lighting, fond: backdrop })) {
    url.searchParams.set(name, control.value);
  }
  saveCamera(viewer, url.searchParams);
  shareView(url, output, status, messages);
});

for (const [name, control] of Object.entries({ monoplace: model, vue: view, lumiere: lighting, fond: backdrop })) {
  const value = defaults.get(name);
  if ([...control.options].some(option => option.value === value)) control.value = value;
}
state.restoreCamera = defaults.get('monoplace') === model.value;
useCar();
fullscreen.hidden = !document.fullscreenEnabled;
garage.querySelector('.garage-actions').hidden = false;
