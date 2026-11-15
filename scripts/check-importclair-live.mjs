import assert from 'node:assert/strict';
const base='https://raphaelflipo.github.io';
const routes=['/','/importclair/','/importclair/guides/','/importclair/guides/import-hubspot/','/importclair/guides/import-pipedrive/','/importclair/guides/siret-csv/','/importclair/guides/csv-excel-accents/','/importclair/app.js','/importclair/exemple-fictif.csv','/robots.txt','/sitemap.xml'];
for(const route of routes){
 const response=await fetch(base+route,{signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,200,route+': HTTP '+response.status);
 const text=await response.text();
 if(route.endsWith('/')){assert(/<html\b/i.test(text),route+': HTML absent');assert(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(text),route+': noindex');}
 assert(!/noindex/i.test(response.headers.get('x-robots-tag')||''),route+': X-Robots-Tag');
 console.log('200 '+route);
}
console.log('Disponibilité et indexabilité HTTP contrôlées, sans statistique de visiteurs.');
