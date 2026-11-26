export function readNumbers(value, limits) {
  const numbers = value?.split(',').map(part => part.trim() ? Number(part) : NaN);
  if (numbers?.length !== limits.length) return null;
  return numbers.every((number, index) => Number.isFinite(number) && number >= limits[index][0] && number <= limits[index][1])
    ? numbers : null;
}

export function restoreCamera(viewer, parameters) {
  const orbit = readNumbers(parameters.get('camera'), [[-3.142, 3.142], [.001, 3.142], [.5, 65]]);
  const target = readNumbers(parameters.get('cible'), [[-12, 12], [-4, 6], [-6, 6]]);
  const fov = readNumbers(parameters.get('fov'), [[8, 85]]);
  if (!(orbit && target && fov)) return false;
  viewer.cameraOrbit = `${orbit[0]}rad ${orbit[1]}rad ${orbit[2]}m`;
  viewer.cameraTarget = target.map(value => `${value}m`).join(' ');
  viewer.fieldOfView = `${fov[0]}deg`;
  viewer.jumpCameraToGoal();
  return true;
}

export function saveCamera(viewer, parameters) {
  if (!viewer.loaded) return;
  const { theta, phi, radius } = viewer.getCameraOrbit();
  const { x, y, z } = viewer.getCameraTarget();
  const rounded = values => values.map(value => value.toFixed(4)).join(',');
  parameters.set('camera', rounded([Math.atan2(Math.sin(theta), Math.cos(theta)), phi, radius]));
  parameters.set('cible', rounded([x, y, z]));
  parameters.set('fov', viewer.getFieldOfView().toFixed(2));
}

export async function shareView(url, output, status, messages) {
  try {
    await navigator.clipboard.writeText(url.href);
    output.hidden = true;
    status.textContent = messages.copied;
  } catch {
    output.value = url.href;
    output.hidden = false;
    output.focus();
    output.select();
    status.textContent = messages.copyManually;
  }
}

const backdrops = {
  graphite: ['#536169', '#29353b'],
  paper: ['#f7f8f7', '#bfc8c8'],
  green: ['#456e59', '#102b20']
};

const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

async function captureViewer(viewer) {
  const constructor = viewer.constructor;
  if (!('minimumRenderScale' in constructor)) return viewer.toBlob({ mimeType: 'image/png' });

  const ratio = Math.min(4, Math.max(1, Math.floor(window.devicePixelRatio)));
  const previousMinimum = constructor.minimumRenderScale ?? .5;
  let removeListener = () => {};
  try {
    let timeout;
    const ready = new Promise(resolve => {
      const onResize = event => {
        if (event.detail.pixelWidth >= 1278 && event.detail.pixelHeight >= 718) resolve();
      };
      timeout = setTimeout(resolve, 1300);
      viewer.addEventListener('render-scale', onResize);
      removeListener = () => {
        clearTimeout(timeout);
        viewer.removeEventListener('render-scale', onResize);
      };
    });
    constructor.minimumRenderScale = 1;
    viewer.dataset.photoScale = String(ratio);
    await ready;
    await frame();
    await frame();
    return await viewer.toBlob({ mimeType: 'image/png', idealAspect: false });
  } finally {
    delete viewer.dataset.photoScale;
    constructor.minimumRenderScale = previousMinimum;
    removeListener();
  }
}

export async function exportPhoto(viewer, name, backdrop) {
  const image = await captureViewer(viewer);
  if (!image?.size) throw new Error('PNG');
  const source = URL.createObjectURL(image);
  let png = image;
  let dimensions;
  try {
    const rendered = new Image();
    rendered.src = source;
    await rendered.decode();
    const canvas = document.createElement('canvas');
    canvas.width = rendered.naturalWidth;
    canvas.height = rendered.naturalHeight;
    dimensions = `${canvas.width} × ${canvas.height}`;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(canvas.width * .45, canvas.height * .3, 0,
      canvas.width * .45, canvas.height * .3, Math.hypot(canvas.width, canvas.height) * .65);
    const [start, end] = backdrops[backdrop] ?? backdrops.graphite;
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(rendered, 0, 0);
    png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')) ?? image;
  } finally {
    URL.revokeObjectURL(source);
  }
  const url = URL.createObjectURL(png);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name}.png`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return dimensions;
}
