export async function loadModel(viewer, source, dracoDecoderLocation) {
  if (!customElements.get('model-viewer')) {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) throw new Error('WebGL 2 indisponible');
    context.getExtension('WEBGL_lose_context')?.loseContext();
  }
  const { ModelViewerElement } = await import('/aileron-f1/vendor/model-viewer.min.js');
  if (dracoDecoderLocation) ModelViewerElement.dracoDecoderLocation = dracoDecoderLocation;
  const url = new URL(source, document.baseURI);
  if (viewer.src) {
    const previousAttempt = Number(new URL(viewer.src, document.baseURI).searchParams.get('reessai'));
    // La visionneuse garde en mémoire le résultat du chargement par URL.
    url.searchParams.set('reessai', String(previousAttempt + 1));
  }
  viewer.loading = 'eager';
  viewer.src = url.href;
}
