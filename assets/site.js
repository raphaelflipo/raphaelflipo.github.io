'use strict';
(() => {
  const root = document.documentElement;
  const english = root.lang === 'en';
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
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
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
  const updateTheme = () => {
    if (themeButton) {
      const label = english ? (isDark() ? 'Use light theme' : 'Use dark theme') : (isDark() ? 'Activer le thème clair' : 'Activer le thème sombre');
      themeButton.setAttribute('aria-label', label);
      themeButton.title = label;
      themeButton.setAttribute('aria-pressed', String(isDark()));
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isDark() ? '#111b16' : '#f7f7f2';
  };
  if (themeButton) {
    themeButton.hidden = false;
    themeButton.addEventListener('click', () => {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem('rf-theme', root.dataset.theme); } catch (_) {}
      updateTheme();
    });
  }
  updateTheme();
  darkPreference.addEventListener('change', updateTheme);

  const copy = document.getElementById('copy-email');
  const copyStatus = document.getElementById('copy-status');
  const mailLink = document.querySelector('.contact-email');
  if (copy && copyStatus && mailLink && navigator.clipboard && window.isSecureContext) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const address = mailLink.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      try {
        await navigator.clipboard.writeText(address);
        copyStatus.textContent = 'Adresse copiée : ' + address;
      } catch (_) {
        copyStatus.textContent = 'Vous pouvez sélectionner l’adresse ci-dessus ou cliquer dessus pour ouvrir votre messagerie.';
      }
    });
  }

  document.querySelectorAll('[data-print]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => window.print());
  });

  const path = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.site-nav a').forEach(link => {
    const url = new URL(link.href);
    if (!url.hash && url.pathname.replace(/index\.html$/, '') === path && path !== '/') link.setAttribute('aria-current', 'page');
  });
  const sectionLinks = [...document.querySelectorAll('.site-nav [data-section]')];
  const sections = sectionLinks.map(link => document.getElementById(link.dataset.section)).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = sectionLinks.find(item => item.dataset.section === entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          sectionLinks.forEach(item => item.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'location');
        } else if (link.getAttribute('aria-current') === 'location') {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }

  const dialog = document.getElementById('image-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    const full = document.getElementById('image-full');
    const caption = document.getElementById('image-caption');
    let opener;
    document.querySelectorAll('[data-lightbox]').forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const preview = link.querySelector('img');
        full.src = link.href;
        full.alt = preview.alt;
        full.width = preview.width;
        full.height = preview.height;
        caption.textContent = link.dataset.caption;
        opener = link;
        dialog.showModal();
        document.body.classList.add('dialog-open');
      });
    });
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (opener) opener.focus({ preventScroll: true });
    });
  }
})();
