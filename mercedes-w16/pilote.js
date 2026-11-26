import '/assets/visionneuse-monoplace.js';

const panel = document.querySelector('#car-viewer');
const picker = panel.querySelector('#car-driver');
const poster = panel.querySelector('.w13-poster');
const viewer = panel.querySelector('model-viewer');
const controls = panel.querySelector('#car-controls');
const expand = panel.querySelector('#car-expand');
const load = panel.querySelector('#car-load');
const status = panel.querySelector('#car-status');
const surface = panel.querySelector('.w16-surface');
const observation = panel.querySelector('.w16-observation');
const initial = { src: poster.getAttribute('src'), srcset: poster.getAttribute('srcset') };
const originals = new WeakMap();
const loadedVariants = new Map();
const grey = [.37, .37, .37, 1];

function materialState(material) {
  const pbr = material.pbrMetallicRoughness;
  const textures = [pbr.baseColorTexture, pbr.metallicRoughnessTexture, material.normalTexture,
    material.occlusionTexture, material.emissiveTexture].filter(Boolean);
  return {
    pbr,
    textures: textures.map(info => [info, info.texture]),
    baseColor: pbr.baseColorFactor,
    metallic: pbr.metallicFactor,
    roughness: pbr.roughnessFactor,
    emissive: material.emissiveFactor,
    clearcoat: material.clearcoatFactor,
    alphaMode: material.getAlphaMode()
  };
}

function applySurface() {
  const technical = surface.querySelector('input:checked').value === 'clay';
  panel.dataset.surface = technical ? 'clay' : 'livery';
  if (!viewer.loaded) return;
  for (const material of viewer.model.materials) {
    const original = originals.get(material);
    if (technical === Boolean(original)) continue;
    if (technical) {
      const saved = materialState(material);
      originals.set(material, saved);
      const graphic = material.name.startsWith('Décal ');
      for (const [info, texture] of saved.textures) {
        if (texture) info.setTexture(null);
      }
      saved.pbr.setBaseColorFactor(graphic ? [0, 0, 0, 0] : grey);
      saved.pbr.setMetallicFactor(0);
      saved.pbr.setRoughnessFactor(.72);
      material.setEmissiveFactor([0, 0, 0]);
      material.setClearcoatFactor(0);
      if (graphic) material.setAlphaMode('BLEND');
    } else {
      for (const [info, texture] of original.textures) {
        if (texture) info.setTexture(texture);
      }
      original.pbr.setBaseColorFactor(original.baseColor);
      original.pbr.setMetallicFactor(original.metallic);
      original.pbr.setRoughnessFactor(original.roughness);
      material.setEmissiveFactor(original.emissive);
      material.setClearcoatFactor(original.clearcoat);
      if (material.name.startsWith('Décal ')) material.setAlphaMode(original.alphaMode);
      originals.delete(material);
    }
  }
}

surface.addEventListener('change', applySurface);
viewer.addEventListener('load', applySurface);

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
  poster.alt = `Rendu Blender de la Mercedes-AMG W16 · ${driver} · Trois quarts avant`;
  viewer.alt = `Mercedes-AMG W16 · ${driver} · Utilise les flèches du clavier pour pivoter.`;
  status.textContent = `Rendu de la W16 n° ${option.value} réalisé dans Blender.`;
}

picker.value = panel.dataset.driver;
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
    status.textContent = `Chargement de la W16 n° ${panel.dataset.driver}…`;
    viewer.src = cachedUrl;
  } else {
    load.click();
  }
});
