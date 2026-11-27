const menu = document.querySelector('.rf-menu');
const navigation = menu?.querySelector('nav');
if (navigation) {
  const english = document.documentElement.lang === 'en';
  const catalogue = english ? '/en/projets/' : '/projets/';
  if (!navigation.querySelector(`a[href="${catalogue}"]`)) {
    const link = document.createElement('a');
    link.href = catalogue;
    link.textContent = english ? 'Project catalogue' : 'Catalogue des projets';
    navigation.append(link);
  }
  navigation.setAttribute('aria-label', english ? 'Explore the portfolio' : 'Explorer le portfolio');
  menu.closest('.rf-header')?.classList.add('signature-header');
  menu.addEventListener('click', event => {
    if (event.target.closest('a') && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) menu.open = false;
  });
}

for (const group of document.querySelectorAll('[data-signature-selector]')) {
  const select = document.getElementById(group.dataset.signatureSelector);
  const label = select?.labels[0];
  if (!label) continue;
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label.querySelector('span').textContent);
  const buttons = Array.from(select.options, option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.text;
    button.addEventListener('click', () => {
      if (select.disabled || select.value === option.value) return;
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    group.append(button);
    return [option.value, button];
  });
  const sync = () => {
    for (const [value, button] of buttons) {
      button.setAttribute('aria-pressed', String(select.value === value));
      button.setAttribute('aria-disabled', String(select.disabled));
    }
  };
  select.addEventListener('change', sync);
  group.closest('.studio-garage').addEventListener('garage-selection', sync);
  const observer = new MutationObserver(sync);
  observer.observe(group.closest('.garage-actions'), { attributeFilter: ['hidden'] });
  observer.observe(select, { attributeFilter: ['disabled'] });
  window.addEventListener('pageshow', sync);
  sync();
  group.hidden = false;
  label.hidden = true;
  label.classList.add('signature-select-fallback');
}

const motion = matchMedia('(prefers-reduced-motion: no-preference)');
if (motion.matches && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (motion.matches && !entry.target.contains(document.activeElement)) {
        entry.target.animate([{ transform: 'translateY(14px)' }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' });
      }
    }
  }, { threshold: 0.18 });
  for (const target of document.querySelectorAll('[data-reveal]')) observer.observe(target);
}
