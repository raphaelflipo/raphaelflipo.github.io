'use strict';
(() => {
  const root = document.documentElement;
  const menu = document.getElementById('site-nav');
  const menuButton = document.getElementById('menu-toggle');
  if (menu && menuButton) {
    root.classList.add('menu-enhanced');
    menuButton.hidden = false;
    const closeMenu = (returnFocus = false) => {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      if (returnFocus) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    document.addEventListener('focusin', event => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    matchMedia('(min-width: 761px)').addEventListener('change', () => closeMenu());
  }

  const themeButton = document.getElementById('theme-toggle');
  const darkPreference = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : darkPreference.matches;
  const updateThemeLabel = () => {
    if (!themeButton) return;
    const english = root.lang === 'en';
    themeButton.setAttribute('aria-label', english ? (isDark() ? 'Use light theme' : 'Use dark theme') : (isDark() ? 'Activer le thème clair' : 'Activer le thème sombre'));
    themeButton.setAttribute('aria-pressed', String(isDark()));
  };
  if (themeButton) {
    themeButton.hidden = false;
    updateThemeLabel();
    themeButton.addEventListener('click', () => {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem('rf-theme', root.dataset.theme); } catch (_) {}
      updateThemeLabel();
    });
    darkPreference.addEventListener('change', updateThemeLabel);
  }

  const copy = document.getElementById('copy-email');
  if (copy && navigator.clipboard && window.isSecureContext) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const status = document.getElementById('copy-status');
      try {
        await navigator.clipboard.writeText('r.flipob@gmail.com');
        status.textContent = 'Adresse copiée.';
      } catch (_) {
        status.textContent = 'Copie indisponible. Vous pouvez sélectionner l’adresse ou ouvrir votre messagerie.';
      }
    });
  }
  document.querySelectorAll('[data-print]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => window.print());
  });
  const tabs = [...document.querySelectorAll('[role="tab"][data-panel]')];
  if (tabs.length) {
    const activate = tab => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.dataset.panel).hidden = !selected;
      });
    };
    document.querySelector('[data-gallery-controls]').hidden = false;
    activate(tabs[0]);
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault(); tabs[next].focus(); activate(tabs[next]);
      });
    });
  }
})();
