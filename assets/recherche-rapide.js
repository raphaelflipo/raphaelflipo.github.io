import { editorial } from './index-recherche.js?v=5';

const entries = [
  ['/projets/', 'Tous les projets', 'All projects', 'portfolio recherche search'],
  ['/projets/la-boussole/', 'Étude de cas La Boussole', 'La Boussole case study', 'covoiturage scout carpool'],
  ['/la-boussole/', 'La Boussole', 'La Boussole', 'transport application'],
  ['/jarvis/', 'Jarvis', 'Jarvis', 'logiciel software assistant'],
  ['/studio-3d/', 'Studio 3D', '3D Studio', 'blender formules f1 garage'],
  ['/mercedes-w13/', 'Mercedes W13', 'Mercedes W13', 'bahreïn bahrain 2022'],
  ['/mercedes-w14/', 'Mercedes W14', 'Mercedes W14', 'monaco 2023'],
  ['/mercedes-w15/', 'Mercedes W15', 'Mercedes W15', 'bahreïn bahrain 2024'],
  ['/mercedes-w16/', 'Mercedes W16', 'Mercedes W16', 'melbourne 2025'],
  ['/mercedes-comparateur/', 'Comparateur 3D', '3D comparison tool', 'pair overlay'],
  ['/aileron-f1/', 'Aileron arrière F1', 'Formula 1 rear wing', 'blender cad'],
  ['/ingenierie/', 'Dossiers d’ingénierie', 'Engineering library', 'aero w13 w14 w15 w16'],
  ['/ingenierie/glossaire/', 'Glossaire aérodynamique', 'Aerodynamics glossary', 'definition downforce'],
  ['/telechargements/', 'Téléchargements', 'Downloads', 'cv jarvis install pdf apk'],
  ['/cv/', 'Curriculum vitæ', 'Curriculum vitae', 'cv pdf expérience experience'],
  ['/journal/', 'Journal de développement', 'Development log', 'nouveautés updates'],
  ...['w13', 'w14', 'w15', 'w16'].flatMap(car => [
    [`/mercedes-${car}/composants/`, `Inspecter la ${car.toUpperCase()}`, `Inspect the ${car.toUpperCase()}`, 'composants components DRS coupe cutaway'],
    [`/ingenierie/${car}/`, `Dossier ${car.toUpperCase()}`, `${car.toUpperCase()} engineering dossier`, 'aérodynamique aerodynamics'],
  ]),
  ...editorial,
  ['/statut/',  'État des services', 'Service checks', 'disponibilité status'],
];

const limit = 18;
const searchText = text => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
let dialog;
let input;
let list;
let trigger;

function linkPath(path, english) {
  if (!english) return path;
  return path === '/cv/' ? '/cv/en/' : path === '/la-boussole/' ? '/la-boussole/en/' : '/en' + path;
}

function createSearch() {
  const english = document.documentElement.lang === 'en';
  dialog = document.createElement('dialog');
  dialog.className = 'rf-search';
  dialog.setAttribute('aria-labelledby', 'rf-quick-title');
  const heading = document.createElement('h2');
  heading.id = 'rf-quick-title';
  heading.textContent = english ? 'Find a project or page' : 'Trouver un projet ou une page';
  input = document.createElement('input');
  input.type = 'search';
  input.autocomplete = 'off';
  input.maxLength = 100;
  input.setAttribute('aria-label', english ? 'Filter pages' : 'Filtrer les pages');
  list = document.createElement('ul');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'rf-btn rf-btn--outline';
  close.textContent = english ? 'Close' : 'Fermer';
  close.addEventListener('click', () => dialog.close());
  dialog.append(heading, input, status, list, close);
  document.body.append(dialog);

  function render() {
    const terms = searchText(input.value).trim().split(/\s+/).filter(Boolean);
    const visible = entries.filter(([,fr,en,keywords]) => terms.every(term => searchText(fr + ' ' + en + ' ' + keywords).includes(term)));
    status.textContent = visible.length > limit && terms.length
      ? (english ? 'Refine the search to see more specific results.' : 'Précisez la recherche pour affiner les résultats.')
      : visible.length ? '' : (english ? 'No matching pages.' : 'Aucune page correspondante.');
    list.replaceChildren(...visible.slice(0, limit).map(([path,fr,en]) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = linkPath(path, english);
      link.textContent = english ? en : fr;
      item.append(link);
      return item;
    }));
  }

  input.addEventListener('input', render);
  dialog.addEventListener('close', () => trigger?.focus());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
      return;
    }
    if (event.key === 'Enter' && event.target === input) {
      list.querySelector('a')?.click();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const links = [...list.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    if (next < -1 || next >= links.length) return;
    event.preventDefault();
    (links[next] ?? input).focus();
  });
  render();
}

export function openSearch(opener) {
  if (!dialog) createSearch();
  if (dialog.open) return;
  trigger = opener;
  dialog.showModal();
  input.focus();
  input.select();
}
