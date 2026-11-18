const menu = document.querySelector('.rf-menu');

if (menu) {
  menu.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

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
}
