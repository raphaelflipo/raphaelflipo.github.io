import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const port=8790, origin='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
  browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [car,lang,width] of [['w13','',390],['w14','en/',390],['w15','en/',1280],['w16','',390]]){
    const ctx=await browser.newContext({viewport:{width,height:844},acceptDownloads:true});
    const page=await ctx.newPage();
    const requests=[],errors=[];
    page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/'+lang+'mercedes-'+car+'/composants/');
    await page.selectOption('#part','diffuser');
    assert(!requests.some(url=>url.endsWith('.glb')));
    assert(await page.locator('[data-family=diffuser]').isVisible());
    await page.click('#load-parts');
    await page.locator('#stage[data-selection=diffuser]').waitFor({timeout:90000});
    for(const key of await page.locator('#part option').evaluateAll(options=>options.map(o=>o.value))){
      await page.selectOption('#part',key);
      assert(Number(await page.locator('#stage').getAttribute('data-marked'))>0);
    }
    await page.selectOption('#projection','ortho');
    assert.equal(await page.locator('#stage').getAttribute('data-camera'),'OrthographicCamera');
    await page.selectOption('#part','diffuserRamp');
    for(const mode of ['isolate','transparent','explode']){
      await page.selectOption('#mode',mode);
      const stats=await page.locator('#stage').evaluate(el=>({...el.dataset}));
      if(mode==='isolate')assert(+stats.visible===+stats.marked && +stats.visible<+stats.total);
      if(mode==='transparent')assert(+stats.ghosted>0);
      if(mode==='explode')assert(+stats.moved>0);
    }
    await page.click('#parts-right');await page.click('#parts-share');
    const url=await page.inputValue('#share-url');
    assert.equal(new URL(url).searchParams.get('projection'),'ortho');
    const capture=page.waitForEvent('download');
    await page.click('#parts-photo');
    const bytes=await readFile(await (await capture).path());
    assert.equal(bytes.toString('ascii',1,4),'PNG');assert(bytes.readUInt32BE(16)>=1600);
    await page.goto(url);await page.click('#load-parts');
    await page.locator('#stage[data-mode=explode]').waitFor({timeout:90000});
    assert.equal(await page.inputValue('#part'),'diffuserRamp');
    assert.equal(await page.locator('#stage').getAttribute('data-camera'),'OrthographicCamera');
    await page.click('#parts-share');assert.equal(await page.inputValue('#share-url'),url);
    await page.selectOption('#projection','perspective');
    assert.equal(await page.locator('#stage').getAttribute('data-camera'),'PerspectiveCamera');
    assert.deepEqual(errors,[]);console.log(car,lang||'fr',width,bytes.readUInt32BE(16),bytes.readUInt32BE(20));
    await ctx.close();
  }
}finally{await browser?.close();server.kill('SIGTERM');}
