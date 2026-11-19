import { PRO_HTML } from './pro.mjs';
import { page, escape, landing, recoveryPage, accessPage, style } from './pages.mjs';

const encoder = new TextEncoder();
const cookieName = '__Host-importclair';
const stateName = '__Host-importclair-state';
const maxBody = 8192;
const baseHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; form-action 'self' https://checkout.stripe.com https://billing.stripe.com; frame-ancestors 'none'; base-uri 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
function response(body,status=200,extra={}) { return new Response(body,{status,headers:{...baseHeaders,'Content-Type':'text/html; charset=utf-8',...extra}}); }
function problem(message,status=400){return response(page('Information',`<h1>${escape(message)}</h1><p><a href="/">Retour à l’accueil</a></p>`),status);}
function redirect(url,extra={}) { return response(null,303,{Location:url,...extra}); }
function cookie(name,value,seconds){return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;}
function readCookie(req,name){return (req.headers.get('Cookie')??'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)??'';}
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function unb64(text){if(!/^[A-Za-z0-9_-]+$/.test(text))throw Error('encoding');return Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
async function key(secret){if(!secret||secret.length<32)throw Error('secret');return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function sign(payload,secret){const body=b64(encoder.encode(JSON.stringify(payload)));return body+'.'+b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(body))));}
export async function verify(token,secret,aud){try{if(token.length>4096)return null;const [body,sig,extra]=token.split('.');if(extra||!body||!sig)return null;if(!await crypto.subtle.verify('HMAC',await key(secret),unb64(sig),encoder.encode(body)))return null;const value=JSON.parse(new TextDecoder().decode(unb64(body)));if(value.aud!==aud||!Number.isFinite(value.exp)||value.exp<=Date.now()/1000)return null;return value;}catch{return null;}}
function serviceReady(env,html){return Boolean(html) && /^https:\/\/[^/]+$/.test(env.PUBLIC_ORIGIN??'') && env.SESSION_SECRET?.length>=32 && /^sk_(test|live)_/.test(env.STRIPE_SECRET_KEY??'');}
export function configured(env,html=PRO_HTML){return env.SALES_ENABLED==='true' && serviceReady(env,html) && ['SELLER_NAME','SELLER_ADDRESS','SELLER_SIREN','SUPPORT_EMAIL','TERMS_TEXT','PRIVACY_TEXT'].every(k=>typeof env[k]==='string'&&env[k].trim().length>0);}
async function stripe(env,path,parameters){
  const result=await (env.fetcher??fetch)('https://api.stripe.com/v1'+path,{
    method:parameters?'POST':'GET',
    headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Stripe-Version':'2026-10-28.endive',...(parameters?{'Content-Type':'application/x-www-form-urlencoded'}:{})},
    ...(parameters?{body:new URLSearchParams(parameters).toString()}:{}),
    signal:AbortSignal.timeout(10000)
  });
  if(!result.ok)throw Error('payment provider unavailable');
  return result.json();
}
function subscriptionMatches(sub,customer){
  const items=sub?.items?.data??[];
  return /^sub_[A-Za-z0-9]+$/.test(sub?.id??'') && sub.customer===customer && items.length===1 && items[0].quantity===1 && items[0].price?.currency==='eur' && items[0].price?.unit_amount===4900 && items[0].price?.recurring?.interval==='year' && items[0].price?.recurring?.interval_count===1 && items[0].price?.metadata?.product_code==='importclair-pro';
}
export function subscriptionAllowed(sub,customer){return sub?.status==='active' && subscriptionMatches(sub,customer);}
async function accountAccess(req,env){
  const claims=await verify(readCookie(req,cookieName),env.SESSION_SECRET,'session');
  if(!claims||!/^sub_[A-Za-z0-9]+$/.test(claims.sub)||!/^cus_[A-Za-z0-9]+$/.test(claims.customer))return null;
  const sub=await readSubscription(env,claims.sub);
  return subscriptionMatches(sub,claims.customer)?{claims,active:sub.status==='active'}:null;
}
async function entitled(req,env){const access=await accountAccess(req,env);return access?.active?access.claims:null;}
async function readSubscription(env,id){
  const sub=await stripe(env,'/subscriptions/'+id+'?expand[]=items.data.price.product');
  const price=sub?.items?.data?.[0]?.price;
  if(price)price.metadata={product_code:price.product?.metadata?.product_code};
  return sub;
}
async function credentials(claims,env){
  const now=Math.floor(Date.now()/1000),identity={sub:claims.sub,customer:claims.customer};
  return {session:await sign({...identity,aud:'session',exp:now+86400*30},env.SESSION_SECRET),recovery:await sign({...identity,aud:'recovery',exp:now+86400*400},env.SESSION_SECRET)};
}
async function form(req){
  if(!req.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))throw Error('invalid form');
  const reader=req.body?.getReader();if(!reader)return new URLSearchParams();
  let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBody){await reader.cancel();throw Error('form too large');}chunks.push(value);}
  const body=new Uint8Array(size);let pos=0;for(const chunk of chunks){body.set(chunk,pos);pos+=chunk.length;}return new URLSearchParams(new TextDecoder().decode(body));
}
export function makeWorker(html=PRO_HTML){return {async fetch(req,env){
  const url=new URL(req.url),path=url.pathname;
  if(!['GET','HEAD','POST'].includes(req.method))return problem('Méthode non autorisée.',405);
  if(req.method==='HEAD'){const r=await this.fetch(new Request(req.url,{method:'GET',headers:req.headers}),env);return new Response(null,{status:r.status,headers:r.headers});}
  if(req.method==='POST' && (req.headers.get('Origin')!==url.origin || (env.PUBLIC_ORIGIN&&url.origin!==env.PUBLIC_ORIGIN)))return problem('Origine non autorisée.',403);
  try{
    if(path==='/style.css'&&req.method==='GET')return response(style,200,{'Content-Type':'text/css; charset=utf-8'});
    if(path==='/health'&&req.method==='GET')return response(JSON.stringify({status:'ok',sales:configured(env,html),productIntegrated:Boolean(html)}),200,{'Content-Type':'application/json'});
    if(path==='/'&&req.method==='GET')return response(landing(configured(env,html)));
    if(path==='/conditions'&&req.method==='GET')return response(page('Conditions et éditeur',`<h1>Conditions et éditeur</h1><p>${escape(env.SELLER_NAME||'Éditeur non renseigné — vente désactivée')}<br>${escape(env.SELLER_ADDRESS)}<br>SIREN : ${escape(env.SELLER_SIREN)}<br>Contact : ${escape(env.SUPPORT_EMAIL)}</p><pre>${escape(env.TERMS_TEXT||'Conditions de vente en préparation. Aucun achat disponible.')}</pre>`));
    if(path==='/confidentialite'&&req.method==='GET')return response(page('Confidentialité',`<h1>Confidentialité</h1><pre>${escape(env.PRIVACY_TEXT||'Préversion : aucun compte ou paiement activé. La version commerciale nécessitera une information complète sur les traitements liés aux paiements et aux accès.')}</pre>`));
    if(path==='/recover'&&req.method==='GET')return response(recoveryPage());
    if(path==='/logout'&&req.method==='POST')return redirect('/',{'Set-Cookie':cookie(cookieName,'',0)});
    if(!serviceReady(env,html))return problem('Le service Pro n’est pas encore disponible.',503);
    if(url.origin!==env.PUBLIC_ORIGIN)return problem('Adresse non autorisée.',403);
    if(path==='/checkout'&&req.method==='POST'){
      if(!configured(env,html))return problem('Les nouvelles souscriptions sont temporairement fermées.',503);
      if(await entitled(req,env))return redirect('/account');
      const data=await form(req);if(data.get('professional')!=='yes')return problem('L’achat doit être professionnel et les conditions acceptées.');
      const nonce=crypto.randomUUID().replaceAll('-','');
      const session=await stripe(env,'/checkout/sessions',{
        mode:'subscription','payment_method_types[0]':'card',locale:'fr',
        'line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':'4900',
        'line_items[0][price_data][recurring][interval]':'year','line_items[0][price_data][tax_behavior]':'inclusive',
        'line_items[0][price_data][product_data][name]':'ImportClair Pro — licence annuelle professionnelle',
        'line_items[0][price_data][product_data][metadata][product_code]':'importclair-pro',
        'line_items[0][quantity]':'1','subscription_data[metadata][product_code]':'importclair-pro',
        client_reference_id:nonce,success_url:env.PUBLIC_ORIGIN+'/complete?session_id={CHECKOUT_SESSION_ID}',cancel_url:env.PUBLIC_ORIGIN+'/',
        billing_address_collection:'required',
        'custom_fields[0][key]':'company','custom_fields[0][label][type]':'custom',
        'custom_fields[0][label][custom]':'Nom de votre entreprise','custom_fields[0][type]':'text',
        'custom_text[submit][message]':'49 EUR par an, renouvellement automatique. Réservé aux professionnels. Résiliation pour la prochaine échéance depuis votre espace.'
      });
      if(!session.url?.startsWith('https://checkout.stripe.com/'))throw Error('invalid provider redirect');
      const state=await sign({aud:'checkout',nonce,exp:Math.floor(Date.now()/1000)+86400},env.SESSION_SECRET);
      return redirect(session.url,{'Set-Cookie':cookie(stateName,state,86400)});
    }
    if(path==='/complete'&&req.method==='GET'){
      const id=url.searchParams.get('session_id')??'',state=await verify(readCookie(req,stateName),env.SESSION_SECRET,'checkout');
      if(!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(id)||!state)return problem('Reprenez l’activation depuis le navigateur utilisé pour payer.',403);
      const paid=await stripe(env,'/checkout/sessions/'+id);
      if(paid.client_reference_id!==state.nonce||paid.mode!=='subscription'||paid.status!=='complete'||paid.payment_status!=='paid'||!/^sub_[A-Za-z0-9]+$/.test(paid.subscription??''))return problem('Le paiement et l’abonnement ne sont pas confirmés.',403);
      const sub=await readSubscription(env,paid.subscription);
      if(!subscriptionAllowed(sub,paid.customer))return problem('Cet abonnement ne donne pas accès au produit.',403);
      const tokens=await credentials({sub:sub.id,customer:paid.customer},env);
      const result=response(accessPage(tokens.recovery));result.headers.append('Set-Cookie',cookie(cookieName,tokens.session,86400*30));result.headers.append('Set-Cookie',cookie(stateName,'',0));return result;
    }
    if(path==='/recover'&&req.method==='POST'){
      const data=await form(req),claims=await verify(data.get('token')??'',env.SESSION_SECRET,'recovery');
      if(!claims||!/^sub_[A-Za-z0-9]+$/.test(claims.sub)||!/^cus_[A-Za-z0-9]+$/.test(claims.customer))return problem('Code invalide ou expiré.',403);
      const sub=await readSubscription(env,claims.sub);
      if(!subscriptionMatches(sub,claims.customer))return problem('Cet abonnement ne correspond pas à votre accès.',403);
      const tokens=await credentials(claims,env);return response(accessPage(tokens.recovery,sub.status==='active'),200,{'Set-Cookie':cookie(cookieName,tokens.session,86400*30)});
    }
    if(path==='/app'&&req.method==='GET'){
      if(!await entitled(req,env))return redirect('/recover');
      return response(html,200,{'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; worker-src blob:; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; sandbox allow-scripts allow-downloads"});
    }
    if(path==='/account'&&req.method==='GET'){const access=await accountAccess(req,env);if(!access)return redirect('/recover');return response(accessPage('',access.active));}
    if(path==='/portal'&&req.method==='POST'){
      // Billing remains accessible after cancellation and delinquency.
      const claims=await verify(readCookie(req,cookieName),env.SESSION_SECRET,'session');
      if(!claims||!/^cus_[A-Za-z0-9]+$/.test(claims.customer))return redirect('/recover');
      const portal=await stripe(env,'/billing_portal/sessions',{customer:claims.customer,return_url:env.PUBLIC_ORIGIN+'/account',locale:'fr'});
      if(!portal.url?.startsWith('https://billing.stripe.com/'))throw Error('invalid portal redirect');return redirect(portal.url);
    }
    return problem('Page introuvable.',404);
  }catch{return problem('Service temporairement indisponible. Aucun accès accordé sans vérification.',503);}
}};}
export default makeWorker();
