import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname, relative, isAbsolute, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const origin = 'https://raphaelflipo.github.io';
const errors = [];
const files = [];
const localized = new Map();
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(root);

for (const file of files) {
  const extension = extname(file);
  if (extension === '.js' && !file.includes('/vendor/')) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (error) {
      errors.push('Syntaxe JS : ' + file + '\n' + String(error.stderr || error.message));
    }
  }
  if (extension !== '.html') continue;
  const html = readFileSync(file, 'utf8');
  const page = relative(root, file);
  if (!/<html\b/i.test(html) || !/<main\b/i.test(html)) errors.push(page + ' : structure HTML incomplète');
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(html)) errors.push(page + ' : CSP absente');
  if (/\son[a-z]+\s*=/i.test(html)) errors.push(page + ' : gestionnaire JS inline');
  if (/class=["'][^"']*["']\s+class=/i.test(html)) errors.push(page + ' : attribut class en doublon');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  const alternates = new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .map(([, language, url]) => [language, url]));
  if (alternates.size) {
    const route = '/' + page.replace(/index\.html$/, '');
    const language = html.match(/<html\s+lang="([^"]+)"/)?.[1];
    if (canonical !== origin + route || alternates.get(language) !== canonical) {
      errors.push(page + ' : URL canonique ou langue incohérente');
    }
    if (alternates.size !== 3 || !alternates.has('en') || alternates.get('x-default') !== alternates.get('fr')) {
      errors.push(page + ' : alternates fr/en/x-default incomplets');
    }
    localized.set(canonical, { page, alternates });
  }
  const links = [...html.matchAll(/\s(?:href|src|data-src|data-model|data-poster)=["']([^"']+)["']/gi)]
    .map(([, value]) => value);
  for (const [, sources] of html.matchAll(/\ssrcset=["']([^"']+)["']/gi)) {
    // Les URL data: contiennent la virgule qui sépare les métadonnées de l'image.
    if (!/\bdata:/i.test(sources)) {
      for (const source of sources.split(',')) links.push(source.trim().split(/\s+/, 1)[0]);
    }
  }
  for (const link of new Set(links)) {
    const value = link.trim();
    if (!value || value[0] === '#' || /^(?:https?:|mailto:|tel:|data:|blob:)/i.test(value)) continue;
    if (/^javascript:/i.test(value)) {
      errors.push(page + ' : URL javascript interdite');
      continue;
    }
    const urlPath = value.split(/[?#]/, 1)[0];
    if (!urlPath || urlPath.startsWith('/la-boussole/')) continue;
    const destination = urlPath.startsWith('/') ? join(root, urlPath.slice(1)) : resolve(dirname(file), urlPath);
    const fromRoot = relative(root, destination);
    if (fromRoot === '..' || fromRoot.startsWith('..' + sep) || isAbsolute(fromRoot)) {
      errors.push(page + ' : chemin hors du dépôt : ' + value);
      continue;
    }
    const target = existsSync(destination) && statSync(destination).isDirectory() ? join(destination, 'index.html') : destination;
    if (!existsSync(target)) errors.push(page + ' : lien local absent : ' + value);
  }
}

const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
for (const [canonical, { page, alternates }] of localized) {
  if (!sitemap.includes('<loc>' + canonical + '</loc>')) errors.push(page + ' : URL absente du sitemap');
  for (const [language, url] of alternates) {
    const counterpart = localized.get(url);
    if (!counterpart || [...alternates].some(([key, value]) => counterpart.alternates.get(key) !== value)) {
      errors.push(page + ' : alternate ' + language + ' non réciproque');
    }
  }
}

function luminance(hex) {
  const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return values.map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
    .reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}
for (const [a, b] of [['#53665a', '#f6f8f5'], ['#276744', '#f6f8f5'], ['#bad0bd', '#121d17'], ['#8dcda4', '#121d17'], ['#ffffff', '#163c2a']]) {
  if (contrast(a, b) < 4.5) errors.push('Contraste insuffisant : ' + a + ' / ' + b);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Contrôle statique terminé : ' + files.filter(x => x.endsWith('.html')).length + ' pages HTML vérifiées.');
}
