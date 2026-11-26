const filters = document.getElementById('filtres');
const query = document.getElementById('projet-recherche');
const category = document.getElementById('projet-categorie');
const status = document.getElementById('projet-resultats');
const projects = [...document.querySelectorAll('[data-project]')];
const english = document.documentElement.lang === 'en';

const normalized = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const entries = projects.map(project => [project, normalized(project.textContent)]);

function filterProjects() {
  const terms = normalized(query.value).split(/\s+/).filter(Boolean);
  let count = 0;
  for (const [project, content] of entries) {
    const match = (!category.value || project.dataset.project === category.value) && terms.every(term => content.includes(term));
    project.hidden = !match;
    if (match) count++;
  }
  status.textContent = english
    ? (count ? `${count} ${count === 1 ? 'project' : 'projects'}` : 'No matching projects.')
    : (count ? `${count} ${count === 1 ? 'projet' : 'projets'}` : 'Aucun projet correspondant.');
}

const initial = new URLSearchParams(location.search);
query.value = (initial.get('q') || '').slice(0, 100);
category.value = initial.get('category') || '';
if (category.selectedIndex < 0) category.value = '';
filters.addEventListener('input', filterProjects);
filters.addEventListener('submit', event => {
  event.preventDefault();
  filterProjects();
});
filters.addEventListener('reset', event => {
  event.preventDefault();
  query.value = '';
  category.value = '';
  filterProjects();
  query.focus();
});
filters.hidden = false;
status.hidden = false;
filterProjects();
