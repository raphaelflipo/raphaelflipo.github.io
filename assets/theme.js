/* Apply the saved preference before paint. All content also works without JS. */
(() => {
  try {
    const value = localStorage.getItem('rf-theme');
    if (value === 'light' || value === 'dark') document.documentElement.dataset.theme = value;
  } catch (_) { /* Storage may be disabled. */ }
})();
