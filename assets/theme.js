
(() => {
  try {
    const value = localStorage.getItem('rf-theme');
    if (value === 'light' || value === 'dark') document.documentElement.dataset.theme = value;
  } catch (_) {  }
})();
