const page=document.querySelector('.parts-page'), en=document.documentElement.lang==='en';
const t=(fr,eng)=>en?eng:fr;
const find=id=>document.getElementById(id);
const part=find('part'),level=find('level'),mode=find('mode'),driver=find('variant');
const stage=find('stage'), area=find('scene-panel'), load=find('load-parts'), status=find('parts-status');
const language=document.querySelector('.rf-lang'), originalLanguage=language.href;
const fields=new URLSearchParams(location.search);
function choose(field,value){if(field&&[...field.options].some(o=>o.value===value))field.value=value;}
choose(part,fields.get('piece'));choose(level,fields.get('niveau'));choose(mode,fields.get('mode'));choose(driver,fields.get('pilote'));
let scene, controller, pendingView=fields.get('vue')?.split(',').map(Number);
const readyButtons=[...area.querySelectorAll('[data-action]')];
function link(base=location.href){
  const url=new URL(base);url.search='';url.hash='';
  for(const [name,field] of [['piece',part],['niveau',level],['mode',mode],['pilote',driver]])if(field)url.searchParams.set(name,field.value);
  const view=scene?.view()??pendingView;if(view?.length===6)url.searchParams.set('vue',view.join(','));
  return url;
}
function updateText(){
  for(const a of page.querySelectorAll('[data-family]')){
    a.hidden=a.dataset.family!==part.value;
    const more=a.querySelector('details');if(more)more.open=level.value==='engineering';
  }
  language.href=link(originalLanguage).href;
}
function display(fit=true){
  updateText();
  if(scene){
    const proof=scene.show(part.value,mode.value,fit);
    status.textContent=t('Sélection','Selection')+' · '+part.selectedOptions[0].text+' · '+mode.selectedOptions[0].text;
    stage.dataset.selection=part.value;stage.dataset.mode=mode.value;
    stage.dataset.visible=String(proof.visible);stage.dataset.marked=String(proof.marked);
    stage.dataset.moved=String(proof.moved);stage.dataset.ghosted=String(proof.ghosted);stage.dataset.total=String(proof.total);
  }
}
function closeScene(){
  controller?.abort();controller=undefined;scene?.dispose();scene=undefined;
  for(const b of readyButtons)b.disabled=true;
  stage.querySelector('img').hidden=false;stage.querySelector('.parts-marker').hidden=true;load.hidden=false;load.disabled=false;
  delete stage.dataset.selection;
}
function error(){
  closeScene();load.textContent=t('Réessayer en 3D','Retry 3D');
  status.textContent=t('La scène est indisponible. Vérifiez la connexion et la prise en charge de WebGL 2. Les explications et les rendus restent accessibles.','The scene is unavailable. Check the connection and WebGL 2 support. The explanations and renders remain available.');
}
async function activate(){
  closeScene();const attempt=new AbortController();controller=attempt;load.disabled=true;
  status.textContent=t('Chargement du modèle et de ses composants…','Loading the model and its components…');
  const name=driver?.value||page.dataset.car, model='/mercedes-'+page.dataset.car+'/mercedes-'+name+'.glb';
  try{
    const {openScene}=await import('./scene.js');
    const loaded=await openScene(stage,model,attempt.signal,error, id=>{choose(part,id);display();}, ()=>part.selectedOptions[0].text);
    if(attempt.signal.aborted){loaded.dispose();return;}
    scene=loaded;stage.querySelector('img').hidden=true;load.hidden=true;
    readyButtons.forEach(b=>b.disabled=false);display();
    if(pendingView)scene.view(pendingView);pendingView=undefined;
  }catch{if(!attempt.signal.aborted)error();}
}
load.addEventListener('click',activate);
part.onchange=()=>{pendingView=undefined;display();};level.onchange=updateText;mode.onchange=()=>display();
driver?.addEventListener('change',()=>{pendingView=undefined;if(scene||controller)activate();else updateText();});
language.addEventListener('click',()=>{language.href=link(originalLanguage).href;});
find('parts-share').onclick=async()=>{
  const url=link().href,field=find('share-url');
  field.hidden=false;field.value=url;
  try{await navigator.clipboard.writeText(url);status.textContent=t('Lien copié.','Link copied.');}
  catch{field.focus();field.select();status.textContent=t('Le lien est prêt à copier.','The link is ready to copy.');}
};
function expanded(){return !!document.fullscreenElement||area.classList.contains('full-window');}
function fullLabel(){find('parts-full').textContent=expanded()?t('Revenir à la page','Back to page'):t('Plein écran','Fullscreen');}
document.addEventListener('fullscreenchange',fullLabel);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&area.classList.contains('full-window')){area.classList.remove('full-window');fullLabel();find('parts-full').focus();}});
for(const b of readyButtons)b.addEventListener('click',async()=>{
  if(!scene)return;
  switch(b.dataset.action){
    case 'left':scene.turn(-.22,0);break;
    case 'right':scene.turn(.22,0);break;
    case 'zoom':scene.zoom(.8);break;
    case 'out':scene.zoom(1.25);break;
    case 'reset':display();break;
    case 'full':
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(area.classList.contains('full-window'))area.classList.remove('full-window');
      else {try{await area.requestFullscreen();}catch{area.classList.add('full-window');}}
      fullLabel();break;
    case 'photo':{
      const blob=await scene.photo();if(!blob){status.textContent=t('Export indisponible.','Export unavailable.');break;}
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=page.dataset.car+'-'+part.value+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
      status.textContent=t('Capture PNG téléchargée.','PNG image downloaded.');break;
    }
  }
});
updateText();
