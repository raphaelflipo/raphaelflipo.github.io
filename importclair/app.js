/** ImportClair : moteur déterministe, sans dépendances réseau. */
const FIELDS = [
  ['first','Prénom'],['last','Nom'],['full','Nom complet'],['company','Société'],
  ['email','E-mail'],['phone','Téléphone'],['siret','SIRET / SIREN'],
  ['address','Adresse'],['postal','Code postal'],['city','Ville']
];
const ALIASES = {
 first:['prenom','first name','firstname','given name','contact firstname'],
 last:['nom','nom de famille','last name','lastname','surname','contact lastname'],
 full:['nom complet','nom contact','contact','full name','name','person name'],
 company:['societe','entreprise','raison sociale','company','company name','organisation','organization','organization name','organisation name'],
 email:['email','e mail','courriel','adresse email','email address','e-mail','person email'],
 phone:['telephone','tel','telephone portable','mobile','phone','phone number','person phone','numero telephone'],
 siret:['siret','siren','numero siret','numero siren','siret siren'],
 address:['adresse','adresse postale','address','street address','rue'],
 postal:['code postal','cp','zip','zipcode','zip code','postal code'],
 city:['ville','commune','city','localite']
};
const normalizeKey = s => String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s_\-.]+/g,' ').trim();
function guessMapping(headers) {
  const result={}; const used=new Set();
  for (const [field] of FIELDS) {
    let at=headers.findIndex((h,i)=>!used.has(i) && ALIASES[field].some(a=>normalizeKey(a)===normalizeKey(h)));
    if(at<0) at=headers.findIndex((h,i)=>!used.has(i) && ALIASES[field].some(a=>normalizeKey(h).startsWith(normalizeKey(a)+' ')));
    result[field]=at; if(at>=0) used.add(at);
  }
  return result;
}
function delimiterScore(line,delimiter){let n=0,quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){i++;continue;}quoted=!quoted;}else if(!quoted&&c===delimiter)n++;}return n;}
function detectDelimiter(text) {
  // Analyser les enregistrements CSV logiques, et non les lignes physiques :
  // une valeur entre guillemets peut contenir des sauts de ligne.
  const input=String(text).replace(/^\uFEFF/,'');
  const logical=[];let record='',quoted=false;
  for(let i=0;i<input.length && logical.length<8;i++){
    const c=input[i];
    if(c==='"'){
      if(quoted&&input[i+1]==='"'){record+='""';i++;continue;}
      quoted=!quoted;record+=c;continue;
    }
    if(!quoted && (c==='\n'||c==='\r')){
      if(record.trim())logical.push(record);
      record='';if(c==='\r'&&input[i+1]==='\n')i++;
    }else record+=c;
  }
  if(record.trim()&&logical.length<8)logical.push(record);
  const candidates=[';',',','\t','|'];
  const scores=candidates.map(d=>{
    const counts=logical.map(line=>delimiterScore(line,d));
    const positive=counts.filter(n=>n>0),first=counts[0]||0;
    // Favorise le séparateur présent dans l'entête ET dans les autres enregistrements.
    const matches=positive.filter(n=>n===first).length;
    return {d,score:(first>0?100:0)+matches*10+positive.length*3+Math.min(positive.reduce((a,b)=>a+b,0),50)};
  });
  return scores.sort((a,b)=>b.score-a.score)[0]?.d||';';
}
function parseCsv(text,{maxRows=40000}={}) {
  if(typeof text!=='string')throw Error('Le contenu CSV doit être du texte.');
  text=text.replace(/^\uFEFF/,'');
  const delimiter=detectDelimiter(text);
  const table=[];let row=[],cell='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else cell+=c;continue;}
    if(c==='"'&&cell===''){quoted=true;closed=false;continue;}
    if(c==='"'&&closed){throw Error('Guillemets CSV incorrects (position '+(i+1)+').');}
    if(c===delimiter){row.push(cell);cell='';closed=false;continue;}
    if(c==='\r'||c==='\n'){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(cell);cell='';closed=false;
      if(row.some(x=>x!==''))table.push(row);
      row=[];if(table.length>maxRows+1)throw Error('Fichier trop volumineux : limite de '+maxRows+' lignes.');continue;
    }
    if(closed && !/\s/.test(c))throw Error('Texte inattendu après des guillemets CSV.');
    cell+=c;closed=false;
  }
  if(quoted)throw Error('Guillemet non fermé dans le CSV.');
  if(cell!==''||row.length){row.push(cell);if(row.some(x=>x!==''))table.push(row);}
  if(table.length>maxRows+1)throw Error('Fichier trop volumineux : limite de '+maxRows+' lignes.');
  if(!table.length)throw Error('Fichier vide.');
  const headers=table[0].map((h,i)=>h.trim()||`Colonne ${i+1}`);
  if(headers.length<2)throw Error('Au moins deux colonnes sont nécessaires. Vérifiez le séparateur.');
  if(headers.length>180)throw Error('Trop de colonnes (maximum 180).');
  const warnings=[],records=[];
  const usedHeaders=new Set();
  for(const header of headers){const normalized=normalizeKey(header);if(usedHeaders.has(normalized))warnings.push(`En-tête présent plusieurs fois : ${header}. Vérifier le mapping dans le CRM.`);usedHeaders.add(normalized);}
  for(let i=1;i<table.length;i++){
    const raw=table[i];
    if(raw.length>headers.length)throw Error(`Ligne ${i+1} : ${raw.length} colonnes pour ${headers.length} en-têtes. Import interrompu pour éviter de perdre des valeurs.`);
    if(raw.length<headers.length)warnings.push(`Ligne ${i+1} : ${raw.length} colonnes au lieu de ${headers.length}. Les champs manquants resteront vides.`);
    records.push(headers.map((_,j)=>String(raw[j]??'')));
  }
  return {headers,records,delimiter,warnings:warnings.slice(0,80)};
}
async function readCsvFile(file,maxMB=6,maxRows=40000) {
  if(file.size>maxMB*1024*1024)throw Error(`Fichier supérieur à ${maxMB} Mo.`);
  const b=new Uint8Array(await file.arrayBuffer());let text,encoding='UTF-8';
  try {
    if(b.length>1&&b[0]===255&&b[1]===254){text=new TextDecoder('utf-16le',{fatal:true}).decode(b.slice(2));encoding='UTF-16 LE';}
    else if(b.length>1&&b[0]===254&&b[1]===255){text=new TextDecoder('utf-16be',{fatal:true}).decode(b.slice(2));encoding='UTF-16 BE';}
    else text=new TextDecoder('utf-8',{fatal:true}).decode(b);
  }catch{ text=new TextDecoder('windows-1252').decode(b); encoding='Windows-1252'; }
  return {...parseCsv(text,{maxRows}),encoding};
}
function normalizePhone(value){
  const original=String(value??'').trim();if(!original)return {value:'',valid:true};
  const compact=original.replace(/[\s.()\-/]/g,'');
  let nine;
  if(/^0[1-9]\d{8}$/.test(compact))nine=compact.slice(1);
  else if(/^\+33[1-9]\d{8}$/.test(compact))nine=compact.slice(3);
  else if(/^0033[1-9]\d{8}$/.test(compact))nine=compact.slice(4);
  if(nine)return {value:'+33'+nine,valid:true};
  return {value:original,valid:false};
}
function validEmail(v){
  const value=String(v??'').trim();return !value || /^[^\s@,;<>]+@[^\s@,;<>]+\.[a-zA-Z]{2,}$/.test(value);
}
function luhn(v){const s=String(v??'').replace(/\s/g,'');if(!/^\d{9}(\d{5})?$/.test(s))return false;let sum=0,double=false;for(let i=s.length-1;i>=0;i--){let n=Number(s[i]);if(double){n*=2;if(n>9)n-=9;}sum+=n;double=!double;}return sum%10===0;}
function normalizeId(v){return String(v??'').replace(/[\s.\-]/g,'').trim();}
function normalizePostal(v){const s=String(v??'').trim();if(/^\d{1,5}$/.test(s))return s.padStart(5,'0');return s;}
function normalizeWhitespace(v){return String(v??'').replace(/\s+/g,' ').trim();}
function buildAnalysis(data,mapping,{fuzzy=false}={}){
  const headers=data.headers,records=data.records,issues=[],seen=new Map(),out=[],stats={rows:records.length,invalidEmails:0,invalidPhones:0,invalidIds:0,missingIdentity:0,exactDuplicates:0,changedCells:0,possibleDuplicates:0};
  const get=(r,f)=>mapping[f]>=0?String(r[mapping[f]]??''):'';
  records.forEach((source,i)=>{
    const row=[...source],notes=[],originalRow=i+2;
    for(let j=0;j<row.length;j++){const fixed=normalizeWhitespace(row[j]);if(row[j]!==fixed){row[j]=fixed;stats.changedCells++;}}
    if(mapping.email>=0){const idx=mapping.email;const fixed=row[idx].toLowerCase();if(row[idx]!==fixed){row[idx]=fixed;stats.changedCells++;}
      if(!validEmail(row[idx])){stats.invalidEmails++;notes.push('E-mail à vérifier');}}
    if(mapping.phone>=0){const idx=mapping.phone;const p=normalizePhone(row[idx]);if(row[idx]!==p.value){row[idx]=p.value;stats.changedCells++;}if(!p.valid){stats.invalidPhones++;notes.push('Téléphone à vérifier');}}
    if(mapping.siret>=0){const idx=mapping.siret;const fixed=normalizeId(row[idx]);if(row[idx]!==fixed){row[idx]=fixed;stats.changedCells++;}if(fixed&&!luhn(fixed)){stats.invalidIds++;notes.push('SIREN/SIRET à vérifier (clé ou format)');}}
    if(mapping.postal>=0){const idx=mapping.postal;const fixed=normalizePostal(row[idx]);if(row[idx]!==fixed){row[idx]=fixed;stats.changedCells++;}}
    const name=normalizeKey([get(row,'first'),get(row,'last')].filter(Boolean).join(' ')||get(row,'full'));
    if(!name&&!get(row,'company')){stats.missingIdentity++;notes.push('Nom ou société manquant');}
    const email=normalizeKey(get(row,'email')),phone=normalizePhone(get(row,'phone')).value;
    const hasIdentity=Boolean(name||get(row,'company'));
    const key=hasIdentity&&(email ? `e:${email}#${name}` : phone ? `p:${phone}#${name}` : `r:${row.map(normalizeKey).join('|')}`);
    let duplicateOf=null;
    if(key&&seen.has(key)){duplicateOf=seen.get(key);stats.exactDuplicates++;notes.push(`Doublon exact probable (ligne ${duplicateOf})`);} else if(key)seen.set(key,originalRow);
    out.push({row,notes,duplicateOf,sourceLine:originalRow,source});
  });
  return {headers,records:out,issues,stats,source:data};
}
function eligibleRows(analysis,{excludeDuplicates=false}={}){
  return analysis.records.filter(item=>!(excludeDuplicates&&item.duplicateOf)).map(item=>item.row);
}
function protectFormula(s){const value=String(s??'');return /^[\s\uFEFF\u200B]*[=+@\-＝＋－＠]/u.test(value)?'\t'+value:value;}
function exportCsv(headers,records,{delimiter=';',bom=true,protect=true}={}){
  const quote=(value)=>{let v=protect?protectFormula(value):String(value??'');if(/[\r\n"\t]/.test(v)||v.includes(delimiter)||/^[\s]|[\s]$/.test(v))v='"'+v.replace(/"/g,'""')+'"';return v;};
  return (bom?'\uFEFF':'')+[headers,...records].map(r=>r.map(quote).join(delimiter)).join('\r\n')+'\r\n';
}
function crmRows(analysis,mapping,target,{excludeDuplicates=false}={}){
  const selected=analysis.records.filter(r=>!(excludeDuplicates&&r.duplicateOf)).map(r=>r.row);
  const get=(r,f)=>mapping[f]>=0?String(r[mapping[f]]??''):'';
  const full=(r)=>[get(r,'first'),get(r,'last')].filter(Boolean).join(' ')||get(r,'full');
  if(target==='pipedrive')return {
    headers:['Name','Email','Phone','Organization'],
    records:selected.map(r=>[full(r),get(r,'email'),get(r,'phone'),get(r,'company')]),
    warning:'Colonnes indicatives pour les personnes : contrôler la correspondance dans l’écran d’import Pipedrive avant validation.'
  };
  if(target==='hubspot')return {
    headers:['First Name','Last Name','Email','Phone Number','Company Name'],
    records:selected.map(r=>[get(r,'first'),get(r,'last')||get(r,'full'),get(r,'email'),get(r,'phone'),get(r,'company')]),
    warning:'Colonnes indicatives : vérifier les propriétés HubSpot, notamment Nom si seul le nom complet est disponible.'
  };
  throw Error('Format CRM inconnu.');
}
const SAMPLE_CSV='Prénom;Nom;Société;E-mail;Téléphone;SIRET;Code postal;Ville\nJulie;Martin;Aster Conseil; JULIE@EXEMPLE.FR ;06 12 34 56 78;73282932000074;59000;Lille\nJulie;Martin;Aster Conseil;julie@exemple.fr;0612345678;73282932000074;59000;Lille\nAlex;Bernard;Maison Bleue;alex@@exemple.fr;07 20 30 40 50;12345678901234;75001;Paris\nAlice;;Maison Bleue;;03 20 00 00 00;;59000;Lille\n';


/* Application ImportClair. Aucune requête réseau : fichiers traités en mémoire. */
(() => {
  const pro = document.documentElement.dataset.edition==='pro';
  const $=id=>document.getElementById(id);
  const state={data:null,analysis:null,mapping:{},filename:'contacts.csv',showOriginal:false};
  const mappingBox=$('mapping'),status=$('status'),fileInput=$('file'),drop=$('dropzone');
  const show=(element,yes)=>{if(element)element.hidden=!yes;};
  function flash(message,type='info') {status.className='alert '+type;status.textContent=message;status.hidden=false;}
  function empty(element){element.replaceChildren();}
  function text(tag,value,className){const x=document.createElement(tag);x.textContent=value;if(className)x.className=className;return x;}
  function option(value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;return o;}
  function filename(base,suffix,ext='csv'){return (base.replace(/\.(csv|tsv|txt|xlsx)$/i,'').replace(/[^a-zA-Z0-9À-ÿ_-]/g,'-')||'contacts')+'-'+suffix+'.'+ext;}
  function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  function saveCsv(headers,rows,name){download(new Blob([exportCsv(headers,rows,{delimiter:';',bom:true,protect:true})],{type:'text/csv;charset=utf-8'}),name);}
  function selectMapping(){
    empty(mappingBox);
    for(const [field,label] of FIELDS){
      const block=document.createElement('label');block.className='field';block.append(text('span',label));
      const select=document.createElement('select');select.dataset.key=field;
      select.append(option(-1,'— Aucune —'));
      state.data.headers.forEach((h,i)=>select.append(option(i,h)));
      select.value=state.mapping[field]??-1;
      select.addEventListener('change',()=>{
        const next=Number(select.value);
        const other=Object.entries(state.mapping).find(([key,index])=>key!==field&&index===next&&next>=0);
        if(other){select.value=String(state.mapping[field]??-1);flash('Cette colonne est déjà attribuée au champ « '+(FIELDS.find(([key])=>key===other[0])?.[1]||other[0])+' ».','warning');return;}
        state.mapping[field]=next;analyze();
      });
      block.append(select);mappingBox.append(block);
    }
  }
  function analyze(){
    if(!state.data)return;
    state.analysis=buildAnalysis(state.data,state.mapping);
    if(pro)markFuzzyDuplicates(state.analysis,state.mapping);
    render();
  }
  function metric(container,label,value){const el=document.createElement('div');el.className='metric';el.append(text('strong',String(value)),text('span',label));container.append(el);}
  function render(){
    const a=state.analysis,s=a.stats;show($('results'),true);show($('placeholder'),false);
    const metrics=$('metrics');empty(metrics);
    metric(metrics,'Contacts analysés',s.rows);
    metric(metrics,'Doublons exacts',s.exactDuplicates);
    metric(metrics,'E-mails invalides',s.invalidEmails);
    metric(metrics,'Téléphones invalides',s.invalidPhones);
    metric(metrics,'SIREN/SIRET à vérifier',s.invalidIds);
    metric(metrics,'Cellules ajustées',s.changedCells);
    if(pro)metric(metrics,'Doublons ressemblants',s.possibleDuplicates);
    const table=$('preview');empty(table);
    const head=document.createElement('thead'),header=document.createElement('tr');
    header.append(text('th','Ligne'));for(const h of a.headers.slice(0,7))header.append(text('th',h));header.append(text('th','Diagnostic'));head.append(header);table.append(head);
    const body=document.createElement('tbody');
    a.records.slice(0,30).forEach(item=>{const tr=document.createElement('tr');if(item.notes.length)tr.className='has-issues';
      tr.append(text('td',item.sourceLine));for(const value of (state.showOriginal?item.source:item.row).slice(0,7))tr.append(text('td',value||'—'));
      tr.append(text('td',item.notes.length?item.notes.join(' · '):'OK',item.notes.length?'warning-text':'good-text'));body.append(tr);
    });table.append(body);
    $('preview-count').textContent=`${Math.min(30,s.rows)} lignes affichées sur ${s.rows} (source préservée).`;
    $('summary').textContent=`${a.source.encoding||'CSV'} · ${a.headers.length} colonnes · ${a.source.warnings.length} avertissement(s) de structure · ${s.missingIdentity} ligne(s) sans nom ni société.`;
    if(pro){
      show($('crm-check'),true);
      const audit=crmPreflight(a,state.mapping,$('crm-target').value);
      $('crm-summary').textContent=`${audit.rows} ligne(s) · ${audit.blockers} point(s) bloquant(s) · ${audit.warnings} vérification(s) recommandée(s).`;
      const list=$('crm-issues');empty(list);
      if(!audit.issues.length)list.append(text('li','Aucun problème détecté par les règles locales de précontrôle.'));
      for(const issue of audit.issues.slice(0,15))list.append(text('li',`Ligne ${issue.line} · ${issue.type} · ${issue.message}`));
      if(audit.issues.length>15)list.append(text('li',`… ${audit.issues.length-15} autre(s) point(s) disponible(s) dans l'export du précontrôle.`));
    }
    $('show-original').checked=state.showOriginal;
    const warnings=$('warnings');empty(warnings);for(const warning of a.source.warnings.slice(0,8))warnings.append(text('li',warning));show($('warnings-wrap'),a.source.warnings.length>0);
    $('exclude').checked=$('exclude').checked&&s.exactDuplicates>0;
    $('exclude').disabled=s.exactDuplicates===0;
    flash('Analyse terminée. Vérifiez les diagnostics avant d’exporter.','success');
  }
  async function loadFile(file){
    try{
      if(!file)return;
      const isXlsx=/\.xlsx$/i.test(file.name);if(isXlsx&&!pro)throw Error('La lecture XLSX est réservée à la version Pro. Enregistrez votre feuille au format CSV pour l’essai gratuit.');
      if(!/\.(csv|tsv|txt|xlsx)$/i.test(file.name))throw Error('Format non pris en charge : CSV, TSV et TXT'+(pro?' ou XLSX.':'.'));
      // Éviter qu'un import erroné permette d'exporter silencieusement l'ancien fichier.
      state.data=null;state.analysis=null;state.showOriginal=false;
      show($('results'),false);show($('mapping-wrap'),false);show($('placeholder'),true);
      $('file-name').textContent='Aucun fichier valide chargé';
      flash('Lecture locale du fichier…');
      state.filename=file.name;
      state.data=isXlsx?await readXlsx(file,{maxMB:15,maxRows:40000}):await readCsvFile(file,pro?15:5,pro?40000:500);
      state.mapping=guessMapping(state.data.headers);
      $('file-name').textContent=file.name;
      show($('mapping-wrap'),true);selectMapping();analyze();
    }catch(err){flash(err?.message||'Impossible de lire le fichier.','error');}
  }
  fileInput.addEventListener('change',()=>loadFile(fileInput.files?.[0]));
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');loadFile(e.dataTransfer?.files?.[0]);});
  $('sample').addEventListener('click',()=>{state.filename='exemple-fictif.csv';state.data={...parseCsv(SAMPLE_CSV,{maxRows:500}),encoding:'CSV de démonstration'};state.mapping=guessMapping(state.data.headers);$('file-name').textContent='exemple-fictif.csv';show($('mapping-wrap'),true);selectMapping();analyze();});
  $('show-original').addEventListener('change',e=>{state.showOriginal=e.target.checked;if(state.analysis)render();});
  $('export-csv').addEventListener('click',()=>{if(!state.analysis)return;saveCsv(state.analysis.headers,eligibleRows(state.analysis,{excludeDuplicates:$('exclude').checked}),filename(state.filename,'nettoye'));flash('CSV généré localement. Les cellules ressemblant à des formules sont neutralisées : vérifiez-les avant import CRM.','success');});
  if(pro){
    show($('pro-export'),true);
    $('crm-target').addEventListener('change',()=>{if(state.analysis)render();});
    $('export-xlsx').addEventListener('click',()=>{if(!state.analysis)return;download(writeXlsx(state.analysis.headers,eligibleRows(state.analysis,{excludeDuplicates:$('exclude').checked})),filename(state.filename,'nettoye','xlsx'));flash('Classeur Excel généré : toutes les cellules sont du texte, sans formule exécutable.','success');});
    $('export-pipedrive').addEventListener('click',()=>exportCrm('pipedrive'));
    $('export-hubspot').addEventListener('click',()=>exportCrm('hubspot'));
    $('export-report').addEventListener('click',()=>{const a=state.analysis;if(!a)return;const rows=a.records.map(r=>[r.sourceLine,r.notes.join(' | ')||'OK',r.duplicateOf||'',...r.source,...r.row]);saveCsv(['Ligne','Diagnostics','Ligne doublon',...a.headers.map(h=>'Original : '+h),...a.headers.map(h=>'Proposé : '+h)],rows,filename(state.filename,'rapport'));});
    $('export-crm-check').addEventListener('click',()=>{
      if(!state.analysis)return;
      const a=crmPreflight(state.analysis,state.mapping,$('crm-target').value);
      const rows=a.issues.map(i=>[a.target,i.line,i.type,i.message]);
      saveCsv(['CRM','Ligne','Niveau','Contrôle'],rows,filename(state.filename,'precontrole-'+a.target));
      flash('Rapport de précontrôle exporté. Vérifiez le mapping et les données dans le CRM avant import.','warning');
    });
  }
  function exportCrm(target){
    if(!state.analysis)return;
    const built=crmRows(state.analysis,state.mapping,target,{excludeDuplicates:$('exclude').checked});
    saveCsv(built.headers,built.records,filename(state.filename,target));flash(built.warning,'warning');
  }
  show($('premium-indicator'),pro);
  show($('free-indicator'),!pro);
  show($('pro-upsell'),!pro);
  show($('premium-notice'),pro);
  if(!pro){
    const buy=document.querySelectorAll('[data-buy-link]'),url=document.documentElement.dataset.buyUrl;
    if(url&&/^https:\/\/(?:payhip\.com\/\S+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)?gumroad\.com\/l\/[a-z0-9_-]+\/?)$/i.test(url))buy.forEach(a=>{a.href=url;a.removeAttribute('aria-disabled');a.classList.remove('disabled');a.textContent='Acheter la version Pro · 29 €';});
    else buy.forEach(a=>{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.classList.add('disabled');a.textContent='Vente bientôt disponible';});
  }
})();

