import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sources } from './ingenierie/sources.mjs';
import { pieces } from './ingenierie/pieces.mjs';
import { monoplaces } from './ingenierie/monoplaces.mjs';
import { glossaire } from './ingenierie/glossaire.mjs';
import { comparaison, physique, synthese } from './ingenierie/synthese.mjs';

const site = 'https://raphaelflipo.github.io';
const localePath = (lang) => lang === 'en' ? '/en' : '';
const basePath = (lang) => localePath(lang) + '/ingenierie/';
const text = (lang, fr, en) => lang === 'en' ? en : fr;
const local = (lang, translations) => translations[lang === 'en' ? 1 : 0];
const titleCase = (value) => value.toUpperCase();
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
);
const paragraphs = (values) => values.map(value => `<p>${escapeHtml(value)}</p>`).join('\n');

function refs(lang, keys) {
  if (!keys.length) return '';
  const label = text(lang, 'Sources', 'Sources');
  return `<ul class="eng-refs" aria-label="${label}">${[...new Set(keys)].map(key => {
    const source = sources[key];
    if (!source) throw new Error('Source inconnue ' + key);
    return `<li><a href="${escapeHtml(source[2])}" hreflang="en">${escapeHtml(local(lang, source))}</a></li>`;
  }).join('')}</ul>`;
}

function note(lang, fr, en) {
  return `<p class="eng-note">${escapeHtml(text(lang, fr, en))}</p>`;
}

function sectionHeading(id, title) {
  return `<h2 id="${id}">${escapeHtml(title)}</h2>`;
}

function page({ lang, route, title, description, body, artwork = '' }) {
  const base = localePath(lang);
  const canonical = site + base + route;
  const fr = site + route;
  const en = site + '/en' + route;
  const locale = text(lang, 'fr_FR', 'en_GB');
  const alternate = text(lang, 'en_GB', 'fr_FR');
  const opposite = text(lang, 'en', 'fr');
  const switchPath = localePath(opposite) + route;
  const studio = base + '/studio-3d/';
  const label = text(lang, 'Ingénierie', 'Engineering');
  const navigation = [
    [base + '/#projets', text(lang, 'Projets', 'Projects')],
    [studio, 'Studio 3D'],
    [basePath(lang), label],
    [text(lang, '/cv/', '/cv/en/'), text(lang, 'CV', 'Résumé')],
  ].map(([url, label]) => `<a href="${escapeHtml(url)}"${url === base + route ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`).join('');
  const alt = text(lang, 'Rendu Blender d’une Mercedes de course', 'Blender render of a Mercedes race car');
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="#163c2a">
  <title>${escapeHtml(title)} | Raphaël Flipo</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="Raphaël Flipo">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="fr" href="${fr}">
  <link rel="alternate" hreflang="en" href="${en}">
  <link rel="alternate" hreflang="x-default" href="${fr}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="${locale}">
  <meta property="og:locale:alternate" content="${alternate}">
  <meta property="og:site_name" content="Raphaël Flipo">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">${artwork ? `
  <meta property="og:image" content="${site + artwork}">
  <meta property="og:image:alt" content="${escapeHtml(alt)}">
  <meta name="twitter:card" content="summary_large_image">` : ''}
  <link rel="stylesheet" href="/assets/refonte.css">
  <link rel="stylesheet" href="/assets/ingenierie.css">
  <script src="/assets/theme.js"></script>
  <script src="/assets/menu.js" defer></script>
</head>
<body class="portfolio engineering">
  <a class="rf-skip" href="#contenu">${text(lang, 'Aller au contenu', 'Skip to content')}</a>
  <header class="rf-header">
    <div class="rf-shell rf-header__inner">
      <a class="rf-brand" href="${base}/">Raphaël <span>Flipo.</span></a>
      <nav class="rf-nav rf-nav--desktop" aria-label="${text(lang, 'Navigation principale', 'Main navigation')}">${navigation}</nav>
      <div class="rf-nav-tools">
        <a class="rf-lang" href="${switchPath}" lang="${opposite}" hreflang="${opposite}" aria-label="${text(lang, 'English', 'Français')}">${titleCase(opposite)}</a>
        <button class="rf-theme-button" id="theme-toggle" type="button" aria-label="${text(lang, 'Thème sombre', 'Dark theme')}" hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
        </button>
        <details class="rf-menu"><summary>Menu</summary><nav aria-label="${text(lang, 'Navigation mobile', 'Mobile navigation')}">${navigation}</nav></details>
      </div>
    </div>
  </header>
  <main class="rf-shell eng-main" id="contenu" tabindex="-1">
${body}
  </main>
  <footer class="rf-footer"><div class="rf-shell rf-footer__inner"><span>${text(lang, 'Collection indépendante de Raphaël Flipo', 'Independent collection by Raphaël Flipo')}</span><a href="${base}/confidentialite/">${text(lang, 'Confidentialité', 'Privacy')}</a></div></footer>
</body>
</html>
`;
}

function hero(lang, title, subtitle, options = {}) {
  const { model, actions = '', label = '' } = options;
  const [width, height] = model?.dimensions || [];
  const image = model ? `<figure class="eng-hero__figure">
      <img src="${model.thumb}" srcset="${model.thumb} 800w, ${model.image} ${width}w" sizes="(max-width: 740px) calc(100vw - 34px), 42vw" width="${width}" height="${height}" alt="${escapeHtml(text(lang, 'Rendu Blender, vue de trois quarts', 'Three-quarter Blender render'))}" fetchpriority="high">
      <figcaption>${escapeHtml(local(lang, model.venue))} · ${model.year} · ${text(lang, 'Rendu Blender', 'Blender render')}</figcaption>
    </figure>` : '';
  return `    <section class="eng-hero${model ? ' eng-hero--photo' : ''}" aria-labelledby="eng-title">
      <div>${label ? `<p class="eng-kicker">${escapeHtml(label)}</p>` : ''}
        <h1 id="eng-title">${escapeHtml(title)}</h1>
        <p class="eng-lead">${escapeHtml(subtitle)}</p>
        ${actions ? `<div class="rf-actions">${actions}</div>` : ''}
      </div>
      ${image}
    </section>`;
}

function carPage(lang, id, model) {
  const car = titleCase(id);
  const root = basePath(lang);
  const viewerPath = localePath(lang) + '/mercedes-' + id + '/';
  const title = text(lang, car + ' · Dossier d’ingénierie', car + ' · Engineering dossier');
  const name = 'Mercedes-AMG ' + car;
  const actions = `<a class="rf-btn" href="${viewerPath}">${text(lang, 'Ouvrir la visionneuse', 'Open the 3D viewer')}</a><a class="rf-btn rf-btn--outline" href="#nomenclature">${text(lang, 'Voir les composants', 'Browse components')}</a>`;
  const carLinks = Object.keys(monoplaces).map(key => `<a href="${root + key}/"${key === id ? ' aria-current="page"' : ''}>${titleCase(key)}</a>`).join('');
  const toc = `<nav class="eng-toc" aria-labelledby="nomenclature">
        ${sectionHeading('nomenclature', text(lang, 'Nomenclature', 'Component index'))}
        <ol>${pieces.map(piece => `<li><a href="#${piece.id}">${escapeHtml(local(lang, piece.title))}</a></li>`).join('')}</ol>
      </nav>`;
  const cards = pieces.map(piece => {
    const observation = model.components[piece.id];
    if (!observation) throw new Error(id + ' ' + piece.id + ' manquant');
    const component = local(lang, piece.title);
    const image = model.photos[piece.id];
    const termLinks = piece.terms.map(id => {
      const target = glossaire.find(entry => entry[0] === id);
      if (!target) throw new Error('Glossaire incomplet ' + id);
      return `<a href="${root}glossaire/#${id}">${escapeHtml(local(lang, target.slice(1, 3)))}</a>`;
    }).join('');
    return `<article class="eng-piece" id="${piece.id}" aria-labelledby="${piece.id}-title">
      <div class="eng-piece__copy">
        ${sectionHeading(piece.id + '-title', component)}
        <p class="eng-discovery">${escapeHtml(local(lang, piece.simple))}</p>
        <p>${escapeHtml(local(lang, observation))}</p>
        ${refs(lang, observation.slice(2))}
        <details>
          <summary>${text(lang, 'Mode ingénierie', 'Engineering detail')}</summary>
          ${paragraphs([local(lang, piece.detail), local(lang, piece.interactions)])}
          ${refs(lang, piece.sources)}
          <p class="eng-term-links">${termLinks}</p>
        </details>
      </div>
      ${image ? `<figure><img src="${image[0]}" width="${image[1]}" height="${image[2]}" alt="${escapeHtml(component + ' · ' + name)}" loading="lazy" decoding="async"><figcaption>${text(lang, 'Rendu du modèle Blender', 'Blender model render')}</figcaption></figure>` : ''}
    </article>`;
  }).join('\n    ');
  const body = `${hero(lang, name, local(lang, model.headline), { model, actions, label: text(lang, 'Dossier d’ingénierie', 'Engineering dossier') })}
    <nav class="eng-model-nav" aria-label="${text(lang, 'Monoplaces', 'Cars')}">${carLinks}<a href="${root}glossaire/">${text(lang, 'Glossaire', 'Glossary')}</a></nav>
    <section class="eng-section" aria-labelledby="configuration">
      ${sectionHeading('configuration', text(lang, 'Configuration et règlement', 'Configuration and regulations'))}
      ${paragraphs([local(lang, model.introduction), local(lang, model.regulatory)])}
      ${refs(lang, model.contextSources)}
    </section>
    ${toc}
    ${cards}
    <section class="eng-section" aria-labelledby="modele">
      ${sectionHeading('modele', text(lang, 'Ce que contient le modèle Blender', 'What the Blender model contains'))}
      ${paragraphs([local(lang, model.model)])}
      ${note(lang, 'Les vues et animations expliquent les formes et les principes. Les performances et les géométries internes des voitures de course restent hors de cette reconstitution.', 'Views and animations illustrate shapes and principles. Actual race-car performance and internal geometry remain outside this reconstruction.')}
      <p><a class="rf-link" href="${root}#comparaison">${text(lang, 'Comparer les évolutions', 'Compare the design changes')}</a></p>
    </section>`;
  return page({ lang, route: '/ingenierie/' + id + '/', title, description: local(lang, model.introduction), artwork: model.image, body });
}

function floorDiagram(lang) {
  return `<figure class="eng-flow">
      <svg viewBox="0 0 650 220" role="img" aria-labelledby="flux-titre flux-description">
        <title id="flux-titre">${text(lang, 'Écoulement schématique sous le plancher', 'Schematic underfloor airflow')}</title>
        <desc id="flux-description">${text(lang, 'Le passage entre piste et plancher se resserre vers le col et s’élargit vers le diffuseur.', 'The passage between road and floor narrows at the throat and expands towards the diffuser.')}</desc>
        <defs><marker id="flow-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto" markerUnits="strokeWidth"><path class="eng-arrow" d="M0 0L7 3.5L0 7Z"/></marker></defs>
        <path class="eng-floor" d="M24 57 Q120 61 200 98 Q254 121 327 122 Q397 122 461 92 L619 49"/>
        <path class="eng-road" d="M24 193H625"/>
        <path class="eng-flowline" marker-end="url(#flow-arrow)" d="M28 84 C168 86 222 145 325 143 C475 141 550 95 620 78"/>
        <path class="eng-flowline" marker-end="url(#flow-arrow)" d="M28 120 C176 120 210 162 325 161 C437 161 534 129 620 119"/>
        <path class="eng-flowline" marker-end="url(#flow-arrow)" d="M28 158 C155 155 254 177 325 177 C437 176 529 163 620 153"/>
        <path class="eng-throat" d="M326 123V193"/>
      </svg>
      <figcaption>${text(lang, 'De gauche à droite, l’entrée, le col puis la rampe du diffuseur. Illustration qualitative du principe aérodynamique. Les trajectoires sont schématiques et ne proviennent pas d’une simulation CFD.', 'From left to right, the entrance, throat and diffuser ramp. A qualitative illustration of the aerodynamic principle. The paths are schematic and are not CFD simulation results.')}</figcaption>
    </figure>`;
}

function overviewPage(lang) {
  const root = basePath(lang);
  const title = text(lang, 'Ingénierie des Mercedes F1', 'Engineering the Mercedes F1 cars');
  const description = text(lang, 'Quatre dossiers d’ingénierie, de la W13 à la W16. Analyse des pontons, du plancher, des suspensions et des ailerons, avec références publiques et glossaire bilingue.', 'Four engineering dossiers, from W13 to W16. Sidepods, floor, suspension and wings, with public references and a bilingual glossary.');
  const cards = Object.entries(monoplaces).map(([id, model]) => {
    const [width, height] = model.dimensions;
    return `<article class="eng-card"><a href="${root + id}/">
        <img src="${model.thumb}" width="${width}" height="${height}" alt="${escapeHtml(text(lang, 'Rendu Blender de la ', 'Blender render of the ') + titleCase(id))}" loading="lazy" decoding="async">
        <div><h3>${titleCase(id)} · ${model.year}</h3><p>${escapeHtml(local(lang, model.headline))}</p></div>
      </a></article>`;
  }).join('\n');
  const comparisonLabel = text(lang, 'W15 et W16 à la loupe', 'A closer look at the W15 and W16');
  const compareURL = localePath(lang) + '/mercedes-comparateur/?gauche=w15&amp;droite=w16';
  const sections = Object.entries(synthese).map(([id, article]) => `<section class="eng-section" aria-labelledby="${id}">
      ${sectionHeading(id, local(lang, article.title))}
      ${paragraphs(local(lang, article.body))}
      ${id === 'plancher' ? floorDiagram(lang) : ''}
      ${refs(lang, article.sources)}
    </section>`).join('\n    ');
  const table = `<div class="eng-table-wrap"><table>
      <caption>${text(lang, 'Configurations de Bahreïn 2024 et Melbourne 2025', 'Bahrain 2024 and Melbourne 2025 configurations')}</caption>
      <thead><tr><th scope="col">${text(lang, 'Zone', 'Area')}</th><th scope="col">W15 · 2024</th><th scope="col">W16 · 2025</th></tr></thead>
      <tbody>${comparaison.map(row => `<tr><th scope="row">${escapeHtml(local(lang, row))}</th><td><a href="${root}w15/#${row[6]}">${escapeHtml(text(lang, row[2], row[4]))}</a></td><td><a href="${root}w16/#${row[6]}">${escapeHtml(text(lang, row[3], row[5]))}</a></td></tr>`).join('')}</tbody>
    </table></div>`;
  const actions = `<a class="rf-btn" href="#dossiers">${text(lang, 'Lire les dossiers', 'Browse the dossiers')}</a><a class="rf-btn rf-btn--outline" href="${root}glossaire/">${text(lang, 'Glossaire FR–EN', 'FR–EN glossary')}</a>`;
  const body = `${hero(lang, title, text(lang, 'Quatre monoplaces pour comprendre comment le châssis, le refroidissement et l’écoulement autour du plancher ont évolué de 2022 à 2025.', 'Four cars show how chassis, cooling and the flow around the floor evolved from 2022 to 2025.'), { actions })}
    <section class="eng-section" aria-labelledby="dossiers">
      ${sectionHeading('dossiers', text(lang, 'Les quatre dossiers', 'Four engineering dossiers'))}
      <div class="eng-card-grid">${cards}</div>
    </section>
    <section class="eng-section" aria-labelledby="comparaison">
      ${sectionHeading('comparaison', comparisonLabel)}
      ${table}
      ${refs(lang, ['bahrain24', 'melbourne25', 'mercedes15', 'mercedes16'])}
      <a class="rf-link" href="${compareURL}">${text(lang, 'Aligner les modèles dans le comparateur', 'Align the models in the comparator')}</a>
    </section>
    ${sections}
    <section class="eng-section" aria-labelledby="physique">
      ${sectionHeading('physique', text(lang, 'Les grandeurs et leurs unités', 'Quantities and units'))}
      <dl class="eng-equations">${physique.map(([formula, fr, en]) => `<div><dt>${escapeHtml(formula)}</dt><dd>${escapeHtml(text(lang, fr, en))}</dd></div>`).join('')}</dl>
      ${note(lang, 'Le bilan de Bernoulli le long d’une ligne de courant suppose notamment un écoulement stationnaire, incompressible et sans pertes. Il ne décrit pas les sillages et ne produit pas de valeurs de Cz ou Cx pour ces voitures.', 'A Bernoulli balance along a streamline assumes steady, incompressible flow without losses, among other conditions. It does not describe wakes or supply Cz or Cx for these cars.')}
      ${refs(lang, ['lift', 'drag', 'reynolds', 'ground'])}
    </section>`;
  return page({ lang, route: '/ingenierie/', title, description, artwork: monoplaces.w16.image, body });
}

function glossaryPage(lang) {
  const root = basePath(lang);
  const title = text(lang, 'Glossaire d’ingénierie automobile', 'Motorsport engineering glossary');
  const description = text(lang, 'Définitions bilingues des termes employés pour les Mercedes W13 à W16, de l’appui à la vorticité et à la cinématique des suspensions.', 'Bilingual definitions for the Mercedes W13 to W16 dossiers, from downforce to vorticity and suspension kinematics.');
  const locale = lang === 'en' ? 'en' : 'fr';
  const alphabet = [...glossaire].sort((a, b) => local(lang, a.slice(1, 3)).localeCompare(local(lang, b.slice(1, 3)), locale));
  const words = alphabet.map(([id, frTerm, enTerm, frScience, frSimple, enScience, enSimple]) => {
    const title = text(lang, frTerm, enTerm);
    const other = text(lang, enTerm, frTerm);
    const topics = pieces.filter(piece => piece.terms.includes(id)).slice(0, 2);
    const related = topics.map(piece => `<a href="${root}w16/#${piece.id}">W16 · ${escapeHtml(local(lang, piece.title))}</a>`).join('');
    return `<div id="${id}"><dt>${escapeHtml(title)} <span lang="${text(lang, 'en', 'fr')}">${escapeHtml(other)}</span></dt>
      <dd><p>${escapeHtml(text(lang, frScience, enScience))}</p>
      <p class="eng-note">${escapeHtml(text(lang, frSimple, enSimple))}</p>
      <p class="eng-term-links">${related || `<a href="${root}#physique">${text(lang, 'Principes physiques', 'Physical principles')}</a>`}</p></dd></div>`;
  }).join('\n');
  const body = `${hero(lang, title, description, { actions: `<a class="rf-btn rf-btn--outline" href="${root}">${text(lang, 'Revenir aux dossiers', 'Back to the dossiers')}</a>` })}
    <section class="eng-section" aria-labelledby="termes">
      ${sectionHeading('termes', text(lang, 'Les termes', 'Terms'))}
      <dl class="eng-glossary">${words}</dl>
      ${refs(lang, ['lift', 'drag', 'reynolds', 'ground', 'suspensions'])}
    </section>`;
  return page({ lang, route: '/ingenierie/glossaire/', title, description, body });
}

function save(lang, route, content) {
  const relative = '..' + localePath(lang) + route + 'index.html';
  const destination = fileURLToPath(new URL(relative, import.meta.url));
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content.replace(/[ \t]+$/gm, ''));
}

for (const lang of ['fr', 'en']) {
  save(lang, '/ingenierie/', overviewPage(lang));
  save(lang, '/ingenierie/glossaire/', glossaryPage(lang));
  for (const [key, model] of Object.entries(monoplaces)) {
    save(lang, '/ingenierie/' + key + '/', carPage(lang, key, model));
  }
}
