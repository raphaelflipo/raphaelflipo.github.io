import '/assets/visionneuse-monoplace.js?v=3';

const panel = document.querySelector('#car-viewer');
const picker = panel.querySelector('#car-driver');
const poster = panel.querySelector('.w13-poster');
const viewer = panel.querySelector('model-viewer');
const controls = panel.querySelector('#car-controls');
const expand = panel.querySelector('#car-expand');
const load = panel.querySelector('#car-load');
const status = panel.querySelector('#car-status');
const observation = panel.querySelector('.w16-observation');
const initial = { src: poster.getAttribute('src'), srcset: poster.getAttribute('srcset') };
const loadedVariants = new Map();
const english = document.documentElement.lang.startsWith('en');

function showObservation(text = '') {
  observation.hidden = !text;
  observation.textContent = text;
}

for (const button of panel.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => showObservation(button.dataset.observation));
}
viewer.addEventListener('camera-change', event => {
  if (event.detail.source === 'user-interaction' && !observation.hidden) showObservation();
});
viewer.addEventListener('load', () => {
  showObservation();
  loadedVariants.set(panel.dataset.model, viewer.src);
});
viewer.addEventListener('error', () => loadedVariants.delete(panel.dataset.model));

const isLoading = () => load.getAttribute('aria-disabled') === 'true';
new MutationObserver(() => {
  if (isLoading()) picker.setAttribute('aria-disabled', 'true');
  else picker.removeAttribute('aria-disabled');
}).observe(load, { attributes: true, attributeFilter: ['aria-disabled'] });

function applyDriver() {
  const option = picker.selectedOptions[0];
  panel.dataset.driver = option.value;
  panel.dataset.model = option.dataset.model;
  if (option.dataset.poster) {
    poster.removeAttribute('srcset');
    poster.src = option.dataset.poster;
  } else {
    poster.src = initial.src;
    poster.srcset = initial.srcset;
  }
  const driver = option.textContent.trim();
  poster.alt = english ? `Blender render of the Mercedes-AMG W16 · ${driver} · Front three-quarter view`
    : `Rendu Blender de la Mercedes-AMG W16 · ${driver} · Trois quarts avant`;
  viewer.alt = english ? `Mercedes-AMG W16 · ${driver} · Use the arrow keys to rotate.`
    : `Mercedes-AMG W16 · ${driver} · Utilise les flèches du clavier pour pivoter.`;
  status.textContent = english ? `Blender render of the W16 no. ${option.value}.`
    : `Rendu de la W16 n° ${option.value} réalisé dans Blender.`;
}

const requestedDriver = new URL(location.href).searchParams.get('pilote');
picker.value = panel.dataset.driver;
if ([...picker.options].some(option => option.value === requestedDriver)) {
  picker.value = requestedDriver;
  applyDriver();
}
picker.closest('.mercedes-driver').hidden = false;
picker.addEventListener('change', () => {
  if (isLoading()) {
    picker.value = panel.dataset.driver;
    return;
  }
  if (picker.value === panel.dataset.driver) return;
  applyDriver();
  if (!viewer.src) return;
  panel.classList.remove('is-ready');
  controls.hidden = true;
  expand.hidden = true;
  const cachedUrl = loadedVariants.get(panel.dataset.model);
  if (cachedUrl) {
    load.setAttribute('aria-disabled', 'true');
    status.textContent = english ? `Loading the W16 no. ${panel.dataset.driver}…`
      : `Chargement de la W16 n° ${panel.dataset.driver}…`;
    viewer.src = cachedUrl;
  } else {
    load.click();
  }
});
