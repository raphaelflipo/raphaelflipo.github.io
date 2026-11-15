import test from 'node:test';
import assert from 'node:assert/strict';
import {makeWorker,sign,verify,configured,subscriptionAllowed} from '../src/worker.mjs';

const origin='https://example.workers.dev';
const secret='unit-test-secret-at-least-32-characters';
const env={PUBLIC_ORIGIN:origin,SALES_ENABLED:'true',STRIPE_SECRET_KEY:'sk_test_mock',SESSION_SECRET:secret,SELLER_NAME:'Example',SELLER_ADDRESS:'Example',SELLER_SIREN:'123456789',SUPPORT_EMAIL:'test@example.com',TERMS_TEXT:'Test terms',PRIVACY_TEXT:'Test privacy'};
const html='<!doctype html><html><body>Private product</body></html>';
const sub=()=>({id:'sub_123',customer:'cus_123',status:'active',items:{data:[{quantity:1,price:{currency:'eur',unit_amount:4900,recurring:{interval:'year',interval_count:1},metadata:{product_code:'importclair-pro'},product:{metadata:{product_code:'importclair-pro'}}}}]}});
const session=()=>sign({aud:'session',sub:'sub_123',customer:'cus_123',exp:Date.now()/1000+3600},secret);
const request=(path,options={})=>new Request(origin+path,options);
const cookie=token=>'__Host-importclair='+token;
const ok=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});

test('sales closed by default, including missing product',async()=>{
  assert.equal(configured(env,null),false);
  const r=await makeWorker(null).fetch(request('/checkout',{method:'POST',headers:{Origin:origin}}),env);
  assert.equal(r.status,503);
  assert.match(await (await makeWorker(null).fetch(request('/'),{})).text(),/Aucun paiement disponible/);
});
test('signed credentials reject tampering, expiry and audience confusion',async()=>{
  const valid=await session();assert.ok(await verify(valid,secret,'session'));
  assert.equal(await verify(valid+'x',secret,'session'),null);
  assert.equal(await verify(valid,secret,'recovery'),null);
  assert.equal(await verify(await sign({aud:'session',exp:1},secret),secret,'session'),null);
  assert.equal(await verify(valid,'wrong-secret-32-characters-long-abcdef','session'),null);
});
test('private HTML is not accessible without authentication or via guessed paths',async()=>{
  const worker=makeWorker(html);
  assert.equal((await worker.fetch(request('/app'),env)).status,303);
  assert.equal((await worker.fetch(request('/src/pro.generated.mjs'),env)).status,404);
});
test('cross-origin checkout is blocked before any Stripe call',async()=>{
  const r=await makeWorker(html).fetch(request('/checkout',{method:'POST',headers:{Origin:'https://attacker.example'}}),env);
  assert.equal(r.status,403);
});
test('active subscription grants access with no caching or network permission',async()=>{
  const r=await makeWorker(html).fetch(request('/app',{headers:{Cookie:cookie(await session())}}),{...env,fetcher:async()=>ok(sub())});
  assert.equal(r.status,200);assert.equal(await r.text(),html);
  assert.equal(r.headers.get('Cache-Control'),'no-store');assert.match(r.headers.get('Content-Security-Policy'),/connect-src 'none'/);
});
test('canceled, unpaid, wrong customer/product/price and quantity are denied',()=>{
  for(const mutate of [s=>s.status='canceled',s=>s.status='past_due',s=>s.customer='cus_other',s=>s.items.data[0].price.unit_amount=1,s=>s.items.data[0].price.metadata.product_code='another',s=>s.items.data[0].quantity=2,s=>s.items.data[0].price.recurring.interval='month']){
    const value=sub();mutate(value);assert.equal(subscriptionAllowed(value,'cus_123'),false);
  }
});
test('cancellation is reflected on next app request',async()=>{
  const value=sub();value.status='canceled';
  const r=await makeWorker(html).fetch(request('/app',{headers:{Cookie:cookie(await session())}}),{...env,fetcher:async()=>ok(value)});assert.equal(r.status,303);
});
test('provider failures close access without leaking secrets',async()=>{
  const r=await makeWorker(html).fetch(request('/app',{headers:{Cookie:cookie(await session())}}),{...env,fetcher:async()=>{throw Error(secret);}});
  assert.equal(r.status,503);assert.ok(!(await r.text()).includes(secret));
});
test('checkout requires professional acceptance and creates annual 49 EUR card subscription',async()=>{
  let called=false;
  const fetcher=async(url,opts)=>{called=true;const form=new URLSearchParams(opts.body);assert.equal(form.get('mode'),'subscription');assert.equal(form.get('line_items[0][price_data][unit_amount]'),'4900');assert.equal(form.get('line_items[0][price_data][recurring][interval]'),'year');assert.equal(form.get('payment_method_types[0]'),'card');return ok({url:'https://checkout.stripe.com/test'});};
  const worker=makeWorker(html),headers={Origin:origin,'Content-Type':'application/x-www-form-urlencoded'};
  assert.equal((await worker.fetch(request('/checkout',{method:'POST',headers,body:''}),{...env,fetcher})).status,400);assert.equal(called,false);
  const r=await worker.fetch(request('/checkout',{method:'POST',headers,body:'professional=yes'}),{...env,fetcher});assert.equal(r.status,303);assert.match(r.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Lax/);
});
test('checkout URL alone does not activate another browser',async()=>{
  let called=false;const r=await makeWorker(html).fetch(request('/complete?session_id=cs_test_123'),{...env,fetcher:async()=>{called=true;}});assert.equal(r.status,403);assert.equal(called,false);
});
test('paid browser-bound checkout grants signed session and recovery code',async()=>{
  const state=await sign({aud:'checkout',nonce:'123',exp:Date.now()/1000+3600},secret);
  const fetcher=async url=>ok(url.includes('/checkout/sessions/')?{client_reference_id:'123',mode:'subscription',status:'complete',payment_status:'paid',subscription:'sub_123',customer:'cus_123'}:sub());
  const r=await makeWorker(html).fetch(request('/complete?session_id=cs_test_123',{headers:{Cookie:'__Host-importclair-state='+state}}),{...env,fetcher});assert.equal(r.status,200);assert.equal(r.headers.getSetCookie().length,2);assert.match(await r.text(),/gestionnaire de mots de passe/);
});
test('recovery validates current subscription',async()=>{
  const token=await sign({aud:'recovery',sub:'sub_123',customer:'cus_123',exp:Date.now()/1000+3600},secret);
  const r=await makeWorker(html).fetch(request('/recover',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})}),{...env,fetcher:async()=>ok(sub())});assert.equal(r.status,200);assert.match(r.headers.get('Set-Cookie'),/__Host-importclair=/);
});
test('billing portal stays accessible with a valid cookie even after cancellation',async()=>{
  const r=await makeWorker(html).fetch(request('/portal',{method:'POST',headers:{Origin:origin,Cookie:cookie(await session())}}),{...env,fetcher:async()=>ok({url:'https://billing.stripe.com/test'})});assert.equal(r.status,303);
});
test('seller text is escaped',async()=>{
  const r=await makeWorker().fetch(request('/conditions'),{SELLER_NAME:'<script>bad</script>'});const body=await r.text();assert.ok(!body.includes('<script>bad'));assert.match(body,/&lt;script&gt;/);
});
