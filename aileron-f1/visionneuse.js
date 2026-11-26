import { loadModel } from '/assets/charger-modele-3d.js';

const viewer = document.getElementById('wing-model');
const container = document.getElementById('wing-viewport');
const button = document.getElementById('wing-load');
const status = document.getElementById('wing-status');
const narrowStage = matchMedia('(max-width: 640px)');
const english = document.documentElement.lang === 'en';
const copyFor = (fr, en) => english ? en : fr;
let loading = false;

function centerModel() {
  viewer.cameraOrbit = narrowStage.matches ? '35deg 70deg 3m' : '35deg 70deg 2.4m';
  viewer.fieldOfView = '36deg';
  viewer.jumpCameraToGoal();
}

function finishLoading() {
  loading = false;
  button.removeAttribute('aria-disabled');
}

function showPoster() {
  finishLoading();
  container.classList.remove('rf-wing-viewer--ready');
  button.textContent = copyFor('Réessayer', 'Try again');
  status.textContent = copyFor(
    'La vue 3D est indisponible. L’aperçu ci-dessus et le fichier GLB restent accessibles.',
    'The 3D view is unavailable. The preview above and the GLB file are still available.'
  );
}

viewer.addEventListener('load', () => {
  finishLoading();
  centerModel();
  container.classList.add('rf-wing-viewer--ready');
  button.textContent = copyFor('Recentrer la vue', 'Reset view');
  status.textContent = copyFor(
    'Fais glisser pour pivoter ou utilise les flèches du clavier. Utilise la molette ou pince l’écran pour zoomer.',
    'Drag or use the arrow keys to rotate. Scroll or pinch to zoom.'
  );
});
viewer.addEventListener('error', showPoster);

button.hidden = false;
button.addEventListener('click', async () => {
  if (container.classList.contains('rf-wing-viewer--ready')) {
    centerModel();
    return;
  }
  if (loading) return;
  loading = true;
  button.setAttribute('aria-disabled', 'true');
  status.textContent = copyFor('Chargement de l’aileron…', 'Loading the rear wing…');
  try {
    await loadModel(viewer, container.dataset.model);
  } catch {
    showPoster();
  }
});
