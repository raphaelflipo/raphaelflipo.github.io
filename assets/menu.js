const menu = document.querySelector('.rf-menu');

if (menu) {
  menu.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    menu.open = false;
    const section = document.getElementById(link.hash.slice(1));
    if (section) {
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });

  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  menu.addEventListener('focusout', event => {
    if (!menu.contains(event.relatedTarget)) menu.open = false;
  });
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[data-language], a.rf-lang[hreflang], .language-switch a[hreflang]');
  if (!link || link.origin !== location.origin) return;
  const language = link.dataset.language || link.hreflang;
  if (language === 'fr' || language === 'en') {
    try { localStorage.setItem('rf-language', language); } catch (_) {}
  }
});

const englishRecovery = document.querySelector('[data-recovery-en]');
if (englishRecovery) {
  let language;
  try { language = localStorage.getItem('rf-language'); } catch (_) {}
  if (location.pathname.startsWith('/en/') || language === 'en') {
    document.documentElement.lang = 'en';
    document.title = 'Page not found | Raphaël Flipo';
    document.querySelector('[data-recovery-fr]').hidden = true;
    englishRecovery.hidden = false;
  }
}
