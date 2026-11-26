(() => {
  const root = document.documentElement;
  try {
    const theme = localStorage.getItem('rf-theme');
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  } catch (_) {}

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    const system = matchMedia('(prefers-color-scheme: dark)');
    const english = root.lang === 'en';
    const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : system.matches;
    const color = document.querySelector('meta[name="theme-color"]');

    function render() {
      const active = dark();
      if (color) color.content = active ? '#17251f' : '#f6f8f5';
      if (!button) return;
      button.setAttribute('aria-pressed', String(active));
      button.title = english
        ? (active ? 'Use light theme' : 'Use dark theme')
        : (active ? 'Activer le thème clair' : 'Activer le thème sombre');
    }

    if (button) {
      button.setAttribute('aria-label', english ? 'Dark theme' : 'Thème sombre');
      button.addEventListener('click', () => {
        root.dataset.theme = dark() ? 'light' : 'dark';
        try { localStorage.setItem('rf-theme', root.dataset.theme); } catch (_) {}
        render();
      });
      button.hidden = false;
    }
    system.addEventListener('change', render);
    render();
  }, { once: true });
})();
