const share = document.querySelector('[data-copy-page]');
const announcer = document.getElementById('partage-etat');
const english = document.documentElement.lang === 'en';

if (navigator.clipboard?.writeText) {
  share.addEventListener('click', async event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(share.href);
      announcer.textContent = english ? 'Link copied.' : 'Lien copié.';
    } catch {
      announcer.textContent = share.href;
    }
  });
} else {
  share.textContent = english ? 'Open the portfolio' : 'Ouvrir le portfolio';
}
