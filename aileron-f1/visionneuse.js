import { loadModel } from '/assets/charger-modele-3d.js';

const viewer = document.getElementById('wing-model');
const container = document.getElementById('wing-viewport');
const button = document.getElementById('wing-load');
const status = document.getElementById('wing-status');
const narrowStage = matchMedia('(max-width: 640px)');
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
  button.textContent = 'Réessayer';
  status.textContent = 'La vue 3D est indisponible. L’aperçu ci-dessus et le fichier GLB restent accessibles.';
}

viewer.addEventListener('load', () => {
  finishLoading();
  centerModel();
  container.classList.add('rf-wing-viewer--ready');
  button.textContent = 'Recentrer la vue';
  status.textContent = 'Fais glisser pour pivoter ou utilise les flèches du clavier. Utilise la molette ou pince l’écran pour zoomer.';
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
  status.textContent = 'Chargement de l’aileron…';
  try {
    await loadModel(viewer, container.dataset.model);
  } catch {
    showPoster();
  }
});
