'use strict';

const input = document.querySelector('#wing-file');
const viewer = document.querySelector('#wing-model');
const status = document.querySelector('#wing-status');
const container = document.querySelector('#wing-viewport');
let objectUrl = null;
let libraryLoaded = false;

const setStatus = (message) => {
  status.textContent = message;
};

async function validateModel(file) {
  const name = file.name.toLowerCase();
  if (!/\.(glb|gltf)$/.test(name)) throw new Error('Sélectionne un fichier .glb ou .gltf.');
  if (file.size < 12 || file.size > 40 * 1024 * 1024) {
    throw new Error('Le fichier doit faire entre 12 octets et 40 Mo.');
  }
  if (name.endsWith('.glb')) {
    const header = new DataView(await file.slice(0, 12).arrayBuffer());
    if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) {
      throw new Error('Ce fichier ne semble pas être un GLB 2.0 valide.');
    }
    return;
  }
  let model;
  try {
    model = JSON.parse(await file.text());
  } catch {
    throw new Error('Le fichier glTF ne contient pas de JSON valide.');
  }
  if (model?.asset?.version !== '2.0') throw new Error('Exporte le modèle au format glTF 2.0.');
  const resources = [...(model.buffers || []), ...(model.images || [])];
  if (resources.some(resource => resource.uri && !resource.uri.startsWith('data:'))) {
    throw new Error('Ce glTF utilise des fichiers annexes. Exporte-le plutôt en .glb.');
  }
}

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) return;
  input.disabled = true;
  setStatus('Vérification du fichier…');
  try {
    await validateModel(file);
    if (!libraryLoaded) {
      setStatus('Chargement de la visionneuse…');
      await import('https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js');
      await customElements.whenDefined('model-viewer');
      libraryLoaded = true;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    viewer.setAttribute('src', objectUrl);
    viewer.setAttribute('alt', 'Modèle 3D de l’aileron arrière de Formule 1 chargé depuis votre ordinateur');
    container.classList.add('rf-wing-viewer--ready');
    setStatus(file.name + ' : chargement du modèle…');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Impossible de charger le modèle.');
  } finally {
    input.disabled = false;
  }
});

viewer.addEventListener('load', () => {
  setStatus('Modèle prêt. Glisse pour pivoter et utilise la molette pour zoomer.');
});

viewer.addEventListener('error', () => {
  setStatus('Le modèle n’a pas pu être affiché. Vérifie ton export GLB ou glTF.');
});

window.addEventListener('pagehide', () => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
