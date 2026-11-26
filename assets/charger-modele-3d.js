const attemptsByViewer = new WeakMap();

export async function loadModel(viewer, source, dracoDecoderLocation, cacheSize) {
  if (!customElements.get('model-viewer')) {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) throw new Error('WebGL 2 indisponible');
    context.getExtension('WEBGL_lose_context')?.loseContext();
  }
  const { ModelViewerElement } = await import('/aileron-f1/vendor/model-viewer.min.js');
  if (dracoDecoderLocation) ModelViewerElement.dracoDecoderLocation = dracoDecoderLocation;
  if (cacheSize) ModelViewerElement.modelCacheSize = cacheSize;

  const url = new URL(source, document.baseURI);
  const key = url.href;
  let attempts = attemptsByViewer.get(viewer);
  if (!attempts) {
    attempts = { current: null, count: new Map() };
    attemptsByViewer.set(viewer, attempts);
  }
  const previous = attempts.count.get(key) ?? 0;
  const next = attempts.current === key ? previous + 1 : previous;
  attempts.current = key;
  attempts.count.set(key, next);
  // Le cache du moteur associe les échecs à l’URL. Seul un nouvel essai doit la modifier.
  if (next) url.searchParams.set('reessai', String(next));

  viewer.loading = 'eager';
  viewer.src = url.href;
}
