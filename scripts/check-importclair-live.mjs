import assert from 'node:assert/strict';

const base = 'https://raphaelflipo.github.io';
const pages = [
  '/',
  '/importclair/',
  '/importclair/guides/',
  '/importclair/guides/import-hubspot/',
  '/importclair/guides/import-pipedrive/',
  '/importclair/guides/siret-csv/',
  '/importclair/guides/csv-excel-accents/',
];
const assets = ['/importclair/app.js', '/importclair/exemple-fictif.csv'];
const routes = [...pages, ...assets, '/robots.txt', '/sitemap.xml'];

for (const route of routes) {
  const response = await fetch(base + route, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, route + ': HTTP ' + response.status);
  assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), route + ': X-Robots-Tag noindex');
  const content = await response.text();

  if (pages.includes(route)) {
    assert(/<html\b/i.test(content), route + ': HTML absent');
    assert(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(content), route + ': noindex HTML');
  }
  if (route === '/robots.txt') {
    assert(/^Sitemap:\s*https:\/\/raphaelflipo\.github\.io\/sitemap\.xml\s*$/mi.test(content), 'robots.txt: chemin du sitemap absent');
  }
  if (route === '/sitemap.xml') {
    const type = response.headers.get('content-type') || '';
    assert(/\b(?:application|text)\/xml\b/i.test(type), 'sitemap.xml: Content-Type inattendu ' + type);
    assert(/<urlset\b[\s\S]*<\/urlset>\s*$/i.test(content.trim()), 'sitemap.xml: urlset absent');
    const urls = [...content.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => match[1]);
    assert.equal(new Set(urls).size, urls.length, 'sitemap.xml: URL en doublon');
    for (const routeExpected of pages.filter(p => p.startsWith('/importclair/'))) {
      assert(urls.includes(base + routeExpected), 'sitemap.xml: URL absente ' + routeExpected);
    }
  }
  console.log('200 ' + route);
}
console.log('Disponibilité et cohérence robots/sitemap vérifiées, sans statistique de visiteurs.');
