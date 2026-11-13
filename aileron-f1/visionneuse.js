'use strict';

const viewer = document.getElementById('wing-model');
const container = document.getElementById('wing-viewport');
const status = document.getElementById('wing-status');

if (matchMedia('(max-width: 640px)').matches) {
  viewer.setAttribute('camera-orbit', '35deg 70deg 3m');
}

viewer.addEventListener('load', () => {
  container.classList.add('rf-wing-viewer--ready');
  status.textContent = 'Modèle chargé. Faites glisser pour pivoter et utilisez la molette pour zoomer.';
});

viewer.addEventListener('error', () => {
  container.classList.add('rf-wing-viewer--error');
  status.textContent = 'Le modèle ne peut pas être affiché dans ce navigateur. Le fichier GLB reste téléchargeable.';
});

window.addEventListener('load', () => {
  if (!('WebGLRenderingContext' in window)) {
    container.classList.add('rf-wing-viewer--error');
    status.textContent = 'Le navigateur ne prend pas en charge WebGL. Vous pouvez télécharger le fichier GLB.';
  }
});
