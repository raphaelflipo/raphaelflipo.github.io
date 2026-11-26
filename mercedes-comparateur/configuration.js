const selectKeys = {
  material: 'matiere', align: 'repere', light: 'lumiere', quality: 'qualite',
  composite: 'composition', part: 'piece'
};
const rangeKeys = { opacity: 'opacity', 'opacity-a': 'opacityA', sensitivity: 'seuil', 'section-x': 'x' };

function readOrbit(raw) {
  const numbers = raw?.split(',').map(value => /^-?\d+(?:\.\d{1,4})?$/.test(value) ? Number(value) : NaN);
  if (numbers?.length !== 3 || !numbers.every(Number.isFinite)) return null;
  const [yaw, pitch, zoom] = numbers;
  if (Math.abs(yaw) > 6.284 || Math.abs(pitch) > 1.571 || zoom < .55 || zoom > 4.25) return null;
  return { yaw, pitch, zoom };
}

export function restoreSettings(params, byId, modes, views) {
  for (const [id, key] of Object.entries(selectKeys)) {
    const select = byId(id);
    const value = params.get(key);
    if (Array.from(select.options).some(option => option.value === value)) select.value = value;
  }
  for (const [id, key] of Object.entries(rangeKeys)) {
    const input = byId(id);
    const raw = params.get(key);
    const value = /^-?\d+$/.test(raw) ? Number(raw) : NaN;
    if (value >= Number(input.min) && value <= Number(input.max)) input.value = String(value);
  }
  const mode = modes.find(input => input.value === params.get('mode'));
  if (mode) mode.checked = true;
  byId('section').checked = params.get('coupe') === '1';
  byId('isolate').checked = params.get('isole') === 'drs';
  if (byId('isolate').checked) byId('part').value = 'rearWing';
  const requestedView = params.get('vue');
  const view = views.some(button => button.dataset.view === requestedView) ? requestedView : 'studio';
  const orbits = [readOrbit(params.get('camA')), readOrbit(params.get('camB'))];
  return {
    view: byId('part').value === 'none' ? view : '',
    sync: params.get('sync') !== '0',
    orbits,
    active: params.get('active') === '1' ? 1 : 0
  };
}

export function comparisonParams({ ids, byId, mode, view, sync, camera }) {
  const query = new URLSearchParams({ gauche: ids[0], droite: ids[1], mode, sync: sync ? '1' : '0' });
  for (const [id, key] of Object.entries({ ...selectKeys, ...rangeKeys })) query.set(key, byId(id).value);
  if (byId('section').checked) query.set('coupe', '1');
  if (byId('isolate').checked) query.set('isole', 'drs');
  if (view) query.set('vue', view);
  if (camera.active === 1) query.set('active', '1');
  ['camA', 'camB'].forEach((key, index) => {
    const orbit = camera.orbits[index];
    if (!orbit) return;
    query.set(key, [orbit.yaw, orbit.pitch, orbit.zoom].map(number => Number(number.toFixed(4))).join(','));
  });
  return query;
}
