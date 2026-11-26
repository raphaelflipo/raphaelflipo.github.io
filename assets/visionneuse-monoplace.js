import { loadModel } from './charger-modele-3d.js?v=2';

const panel = document.querySelector('[data-model]');
const viewer = panel.querySelector('model-viewer');
const controls = panel.querySelector('.w13-controls');
const loadButton = panel.querySelector('.car-load');
const expand = panel.querySelector('.w13-expand');
const status = panel.querySelector('#car-status, #w13-status');
const views = [...controls.querySelectorAll('[data-view]')];
const drs = controls.querySelector('.w13-drs');
const slider = drs.querySelector('input');
const opening = drs.querySelector('output');
const [initialView] = views;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const english = document.documentElement.lang.startsWith('en');
const copy = english ? {
  before: 'Enter fullscreen',
  after: 'Exit fullscreen',
  dialog: '3D viewer for the',
  retry: 'Try again',
  error: 'The 3D view is unavailable. The rendered images are still available on this page.',
  loaded: 'Drag or use the arrow keys to rotate. Scroll or pinch to zoom. Home resets the view.',
  loading: 'Loading the',
  degrees: 'degrees'
} : {
  before: 'Passer en plein écran',
  after: 'Quitter le plein écran',
  dialog: 'Visionneuse 3D de la',
  retry: 'Réessayer',
  error: 'La vue 3D est indisponible. Les rendus restent accessibles sur cette page.',
  loaded: 'Fais glisser ou utilise les flèches pour pivoter. Utilise la molette ou pince l’écran pour zoomer. La touche Début réinitialise la vue.',
  loading: 'Chargement de la',
  degrees: 'degrés'
};
let compact = panel.clientWidth < 620;
const inertOutsidePanel = [];
let activeView;
let loading = false;
let workshopRequested = false;
let photoRequested = false;
function openPhotoTools(){
  const photo=controls.querySelector('.car-workshop');
  if(!photoRequested || !photo || photo.hidden)return;
  photoRequested=false;photo.open=true;
  photo.querySelector('summary').focus();
}
document.querySelector('[data-open-photo]')?.addEventListener('click',()=>{
  photoRequested=true;
  if(panel.classList.contains('is-ready'))openPhotoTools();
  else loadButton.click();
});

function selectView(button) {
  const [azimuth, elevation, radius] = button.dataset.orbit.split(' ');
  const scale = compact && button.dataset.view !== 'front' ? Number(panel.dataset.cameraScale) : 1;
  viewer.cameraTarget = button.dataset.target;
  viewer.cameraOrbit = `${azimuth} ${elevation} ${parseFloat(radius) * scale}m`;
  viewer.fieldOfView = '28deg';
  activeView = button;
  for (const view of views) view.setAttribute('aria-pressed', String(view === button));
  if (reduceMotion.matches) viewer.jumpCameraToGoal();
}

for (const button of views) button.addEventListener('click', () => selectView(button));
function resetCamera() {
  selectView(initialView);
  panel.querySelector('.w16-observation')?.setAttribute('hidden', '');
}

controls.querySelector('[data-reset-camera]')?.addEventListener('click', resetCamera);
viewer.addEventListener('keydown', event => {
  if (event.key !== 'Home' || !viewer.loaded) return;
  event.preventDefault();
  resetCamera();
});
new ResizeObserver(() => {
  const next = panel.clientWidth < 620;
  if (compact === next) return;
  compact = next;
  if (activeView) selectView(activeView);
}).observe(panel);

viewer.addEventListener('camera-change', event => {
  if (event.detail.source !== 'user-interaction' || !activeView) return;
  activeView = null;
  for (const button of views) button.setAttribute('aria-pressed', 'false');
});

panel.addEventListener('workshop-camera-change', () => { activeView = null; });

function updateDrs() {
  const angle = Number(slider.value);
  // La dernière image du clip boucle sur la première dans le moteur 3D.
  const fraction = Math.min(angle / Number(slider.max), 1 - 1e-6);
  viewer.currentTime = viewer.duration * fraction;
  opening.value = `${angle}°`;
  slider.setAttribute('aria-valuetext', `${angle} ${copy.degrees}`);
}

slider.addEventListener('input', updateDrs);

controls.querySelector('.car-light')?.addEventListener('change', event => {
  panel.dataset.light = event.target.value;
  applyLighting();
});

const studioExposure = Number(viewer.getAttribute('exposure'));
const studioShadow = Number(viewer.getAttribute('shadow-intensity') ?? 0);

function applyLighting() {
  const light = panel.dataset.light === 'light';
  viewer.exposure = light ? 1.5 : studioExposure;
  viewer.shadowIntensity = light ? .42 : studioShadow;
}

const materialPicker = controls.querySelector('.car-surface');
const originalMaterials = new WeakMap();

function applySurface() {
  if (!materialPicker || !viewer.loaded) return;
  const clay = materialPicker.querySelector('input:checked').value === 'clay';
  panel.dataset.surface = clay ? 'clay' : 'livery';
  for (const material of viewer.model.materials) {
    const original = originalMaterials.get(material);
    if (clay === Boolean(original)) continue;
    const pbr = material.pbrMetallicRoughness;
    const decal = material.name.startsWith('Décal ');
    if (clay) {
      const textureSlots = [pbr.baseColorTexture, pbr.metallicRoughnessTexture, material.normalTexture,
        material.occlusionTexture, material.emissiveTexture];
      const saved = {
        textures: textureSlots.filter(Boolean).map(slot => [slot, slot.texture]),
        baseColor: pbr.baseColorFactor,
        metallic: pbr.metallicFactor,
        roughness: pbr.roughnessFactor,
        emissive: material.emissiveFactor,
        clearcoat: material.clearcoatFactor,
        alphaMode: material.getAlphaMode()
      };
      originalMaterials.set(material, saved);
      for (const [slot, texture] of saved.textures) {
        if (texture) slot.setTexture(null);
      }
      pbr.setBaseColorFactor(decal ? [0, 0, 0, 0] : [.37, .37, .37, 1]);
      pbr.setMetallicFactor(0);
      pbr.setRoughnessFactor(.72);
      material.setEmissiveFactor([0, 0, 0]);
      material.setClearcoatFactor(0);
      if (decal) material.setAlphaMode('BLEND');
    } else {
      for (const [slot, texture] of original.textures) {
        if (texture) slot.setTexture(texture);
      }
      pbr.setBaseColorFactor(original.baseColor);
      pbr.setMetallicFactor(original.metallic);
      pbr.setRoughnessFactor(original.roughness);
      material.setEmissiveFactor(original.emissive);
      material.setClearcoatFactor(original.clearcoat);
      if (decal) material.setAlphaMode(original.alphaMode);
      originalMaterials.delete(material);
    }
  }
}

materialPicker?.addEventListener('change', applySurface);

function updateExpandState() {
  const expanded = document.fullscreenElement === panel || panel.classList.contains('is-expanded');
  const label = expanded ? copy.after : copy.before;
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
    panel.setAttribute('aria-label', `${copy.dialog} ${panel.dataset.car}`);
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
  loadButton.textContent = copy.retry;
  status.textContent = copy.error;
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
  resetCamera();
  viewer.jumpCameraToGoal();
  applyLighting();
  applySurface();
  status.textContent = copy.loaded;
  if (focusWasOnLoad) initialView.focus({ preventScroll: true });
  if (!workshopRequested && controls.querySelector('.car-workshop')) {
    workshopRequested = true;
    import('./atelier-monoplace.js').then(({ setupWorkshop }) => setupWorkshop(panel, viewer, controls, views))
      .then(openPhotoTools).catch(() => { workshopRequested = false; });
  }
});

loadButton.hidden = false;
loadButton.addEventListener('click', async () => {
  if (loading) return;
  loading = true;
  loadButton.setAttribute('aria-disabled', 'true');
  status.textContent = `${copy.loading} ${panel.dataset.car}…`;
  try {
    await loadModel(viewer, panel.dataset.model, '/mercedes-w13/draco/', 2);
  } catch {
    showError();
  }
});
