import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(), base='https://raphaelflipo.github.io';
const paths=['importclair/index.html','importclair/guides/index.html',...readdirSync('importclair/guides',{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>'importclair/guides/'+x.name+'/index.html')];
const sitemap=readFileSync('sitemap.xml','utf8'), robots=readFileSync('robots.txt','utf8');
assert(!/^Disallow:\s*\/(?:\s|$)/im.test(robots));
const titles=new Set(), descriptions=new Set();
for(const path of paths){
 const html=readFileSync(path,'utf8'), title=html.match(/<title>([^<]+)<\/title>/)?.[1], description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
 const url=base+'/'+path.replace(/index\.html$/,'');
 assert(title&&title.length>=15&&title.length<110,path+': titre');assert(!titles.has(title),path+': titre répété');titles.add(title);
 assert(description&&description.length>=60&&description.length<=180,path+': description');assert(!descriptions.has(description),path+': description répétée');descriptions.add(description);
 assert(html.includes('<link rel="canonical" href="'+url+'">'),path+': canonical');
 assert(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html),path+': noindex');
 assert(sitemap.includes('<loc>'+url+'</loc>'),path+': sitemap');assert.equal((html.match(/<h1\b/g)||[]).length,1,path+': h1');
 assert(!/href="[^"]*(?:gumroad|stripe|payhip)/i.test(html),path+': paiement');
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
}
const app=readFileSync('importclair/app.js');
assert.equal(createHash('sha256').update(app).digest('hex'),'3bff3e65e375f1743ddfb1d6d04203f5fdbea3569bf4fbb18029dc3e4449b046','Moteur gratuit modifié : réviser sa validation avant publication');
assert(!/function\s+(?:readXlsx|writeXlsx|markFuzzyDuplicates|crmPreflight)\b/.test(app.toString()),'Code Pro');
assert(!readdirSync('importclair').some(x=>/\.(zip|env)$/i.test(x)),'Archive ou configuration privée');
console.log(paths.length+' pages ImportClair : indexabilité, canonical, sitemap, maillage contrôlé par audit global, données structurées et séparation gratuite OK.');
