import * as T from '../../mercedes-comparateur/vendor/three/build/three.module.min.js';
import { GLTFLoader } from '../../mercedes-comparateur/vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../../mercedes-comparateur/vendor/three/examples/jsm/loaders/DRACOLoader.js';

import {children, triangles} from './familles.js';
const shift = {
  frontWing:[-.65,.15,0], nose:[-.2,.5,0], frontSuspension:[-.15,.64,0], wheels:[0,0,0],
  sidepods:[0,.5,0], inlets:[-.25,.85,0], floor:[0,-.5,0], diffuser:[.45,-.45,0],
  cockpit:[0,1.05,0], airbox:[0,1.35,0], engineCover:[.3,.85,0],
  rearSuspension:[.3,.65,0], rearWing:[.65,.65,0], drs:[.85,1.05,0],
  mainplane:[-.8,-.05,0], flaps:[-.65,.55,0], endplates:[-.85,.25,0],
  fences:[-.25,-.75,0], beamWing:[.65,.1,0], diffuserRamp:[.45,-.45,0],
  tyres:[0,1.25,0], rims:[0,.77,0], brakes:[0,.18,0]
};

async function splitScene(gltf, map) {
  const originals = [];
  gltf.scene.traverse(mesh=>{if(mesh.isMesh) originals.push(mesh);});
  const pieces = [];
  for (const mesh of originals) {
    const association = gltf.parser.associations.get(mesh);
    const code = map.meshes[association.meshes][association.primitives ?? 0];
    const original = mesh.geometry;
    const indices = original.index;
    if (!indices) throw Error('Indices');
    const parts = new Map();
    if (typeof code === 'number') parts.set(code, original);
    else {
      const labels = await triangles(code);
      if (labels.length * 3 !== indices.count) throw Error('Topology');
      const buckets = new Map();
      labels.forEach((id, face)=>{
        if (!buckets.has(id)) buckets.set(id, []);
        const group = buckets.get(id);
        group.push(indices.getX(face*3),indices.getX(face*3+1),indices.getX(face*3+2));
      });
      for (const [id, list] of buckets) {
        const g = new T.BufferGeometry();
        for (const [key, attribute] of Object.entries(original.attributes)) g.setAttribute(key, attribute);
        g.setIndex(list);
        parts.set(id,g);
      }
    }
    const holder = new T.Group();
    holder.position.copy(mesh.position); holder.quaternion.copy(mesh.quaternion); holder.scale.copy(mesh.scale);
    mesh.parent.add(holder);
    while(mesh.children.length) holder.add(mesh.children[0]);
    mesh.removeFromParent();
    for (const [id,geometry] of parts) {
      const piece = new T.Mesh(geometry,mesh.material);
      holder.add(piece);
      pieces.push({mesh:piece, id:map.parts[id], material:mesh.material});
    }
  }
  gltf.scene.updateMatrixWorld(true);
  const point = new T.Vector3();
  for(const p of pieces) {
    const g=p.mesh.geometry, bounds=new T.Box3();
    for(let i=0;i<g.index.count;i++) bounds.expandByPoint(point.fromBufferAttribute(g.attributes.position,g.index.getX(i)).applyMatrix4(p.mesh.matrixWorld));
    p.bounds=bounds;
  }
  return pieces;
}

export async function openScene(host, model, signal, onLoss, onPick, label) {
  const renderer = new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});
  let observer,frame=0;
  const originals=new Set();
  const root = new T.Scene();
  const perspective=new T.PerspectiveCamera(34,1,.025,75);
  const orthographic=new T.OrthographicCamera(-1,1,1,-1,.025,75);
  const halfFov=Math.tan(perspective.fov*Math.PI/360);
  let camera=perspective;
  const draco = new DRACOLoader().setDecoderPath('/mercedes-w13/draco/').setWorkerLimit(2);
  const lightMaterial = new T.MeshStandardMaterial({color:0x22dcc3,emissive:0x126957,emissiveIntensity:.55,roughness:.56,side:T.DoubleSide});
  const glass = new T.MeshBasicMaterial({color:0xb6cad3,transparent:true,opacity:.13,depthWrite:false,side:T.FrontSide});
  function dispose() {
    cancelAnimationFrame(frame); observer?.disconnect();draco.dispose();
    root.traverse(o=>{if(o.isMesh){o.geometry.dispose();}});
    const textures=new Set();
    for(const material of originals){for(const value of Object.values(material)){if(value?.isTexture)textures.add(value);}material.dispose();}
    for(const texture of textures){texture.dispose();texture.source?.data?.close?.();}
    lightMaterial.dispose();glass.dispose();renderer.dispose();renderer.forceContextLoss();
    renderer.domElement.remove();
  }
  try {
    const stem=model.split('/').pop().replace('.glb','');
    const read=async url=>{const r=await fetch(url,{signal});if(!r.ok)throw Error('HTTP '+r.status);return r;};
    const [raw,map]=await Promise.all([read(model).then(r=>r.arrayBuffer()),read('/assets/composants/'+stem+'.json').then(r=>r.json())]);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==map.sha256)throw Error('Version GLB');
    const gltf=await new GLTFLoader().setDRACOLoader(draco).parseAsync(raw,model.slice(0,model.lastIndexOf('/')+1));
    const pieces=await splitScene(gltf,map);
    root.add(gltf.scene);
    for(const p of pieces)originals.add(p.material);
    signal.throwIfAborted();
    root.background=new T.Color(0x263238);
    root.add(new T.HemisphereLight(0xffffff,0x89959c,2.2));
    for(const [x,y,z,intensity] of [[-4,5,4,3],[4,2,-4,2]]) {
      const light=new T.DirectionalLight(0xffffff,intensity);light.position.set(x,y,z);root.add(light);
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    const canvas=renderer.domElement; canvas.setAttribute('aria-hidden','true'); host.prepend(canvas);
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();onLoss();},{once:true,signal});
    const marker=host.querySelector('.parts-marker');
    const projector=new T.Vector3(), raycaster=new T.Raycaster();
    const ids=new WeakMap(pieces.map(p=>[p.mesh,p.id]));
    let anchor, anchorMesh;
    const target=new T.Vector3();let yaw=-.85,pitch=.34,radius=6;
    function draw(){
      frame=0;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
      renderer.setSize(width,height,false);
      const aspect=width/height;
      if(camera.isOrthographicCamera){
        const halfHeight=radius*halfFov;
        camera.top=halfHeight;camera.bottom=-halfHeight;
        camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
      }else camera.aspect=aspect;
      camera.updateProjectionMatrix();
      camera.position.set(target.x+radius*Math.sin(yaw)*Math.cos(pitch),target.y+radius*Math.sin(pitch),target.z+radius*Math.cos(yaw)*Math.cos(pitch));
      camera.lookAt(target);renderer.render(root,camera);
      if(anchor && anchorMesh){
        projector.copy(anchor).applyMatrix4(anchorMesh.matrixWorld).project(camera);
        marker.hidden=Math.abs(projector.x)>1 || Math.abs(projector.y)>1 || Math.abs(projector.z)>1;
        marker.style.left=Math.max(4,Math.min(78,50*(1+projector.x)))+'%';
        marker.style.top=Math.max(4,Math.min(90,50*(1-projector.y)))+'%';
      }
    }
    function redraw(){if(!frame)frame=requestAnimationFrame(draw);}
    const limit=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
    const turn=(dx,dy)=>{yaw+=dx;pitch=limit(pitch+dy,-1.52,1.52);redraw();};
    const zoom=f=>{radius=limit(radius*f,.28,28);redraw();};
    const pointers=new Map(); let initialSpan=0, tap;
    function pick(event){
      if(!tap || Math.hypot(event.clientX-tap[0],event.clientY-tap[1])>6)return;
      const r=canvas.getBoundingClientRect();
      raycaster.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2),camera);
      const hits=raycaster.intersectObjects(pieces.filter(p=>p.mesh.visible && p.id!=='context').map(p=>p.mesh),false);
      if(hits.length)onPick(ids.get(hits[0].object));
    }
    const span=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a[0]-b[0],a[1]-b[1]);};
    canvas.addEventListener('pointerdown',e=>{tap=pointers.size?null:[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2)initialSpan=span();},{signal});
    canvas.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;
      const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
      if(pointers.size===2){const next=span();if(next>0&&initialSpan>0)zoom(initialSpan/next);initialSpan=next;}
      else turn((old[0]-e.clientX)*.009,(e.clientY-old[1])*.007);
    },{signal});
    canvas.addEventListener('pointerup',pick,{signal});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>pointers.delete(e.pointerId),{signal});
    observer=new ResizeObserver(redraw);observer.observe(host);
    const all=new T.Box3();for(const p of pieces)all.union(p.bounds);
    function show(id,mode,fit=true){
      const family=new Set([id,...children[id]??[]]), selected=new T.Box3();
      let visible=0,marked=0,moved=0,ghosted=0;
      for(const p of pieces){
        const active=family.has(p.id);
        p.mesh.visible=mode==='isolate'?active:mode==='explode'?p.id!=='context':true;
        p.mesh.material=active?lightMaterial:mode==='transparent'?glass:p.material;
        p.mesh.position.set(0,0,0);
        if(mode==='explode' && shift[p.id]){
          const dx=shift[p.id];const origin=p.mesh.parent.getWorldPosition(new T.Vector3());
          const offset=new T.Vector3(...dx);
          if(p.id==='wheels')offset.y=.48;
          origin.add(offset);p.mesh.position.copy(p.mesh.parent.worldToLocal(origin));
          if(offset.lengthSq()>0)moved++;
        }
        if(active)selected.union(p.bounds);
        if(p.mesh.visible)visible++;
        if(active&&p.mesh.visible)marked++;
        if(p.mesh.visible&&p.mesh.material===glass)ghosted++;
      }
      if(!marked)throw Error('Composant absent');
      const middle=selected.getCenter(new T.Vector3()), sample=new T.Vector3();
      let nearest=Infinity;
      for(const p of pieces.filter(p=>family.has(p.id))){
        const g=p.mesh.geometry, step=Math.max(1,Math.floor(g.index.count/90));
        for(let i=0;i<g.index.count;i+=step){
          sample.fromBufferAttribute(g.attributes.position,g.index.getX(i));
          const d=projector.copy(sample).applyMatrix4(p.mesh.matrixWorld).distanceToSquared(middle);
          if(d<nearest){nearest=d;anchor=sample.clone();anchorMesh=p.mesh;}
        }
      }
      marker.textContent=label();
      if(fit){
        const box=mode==='explode'?all:selected;
        box.getCenter(target);const size=box.getSize(new T.Vector3());
        const aspect=host.clientWidth/Math.max(1,host.clientHeight);
        radius=limit(Math.max(size.length()*.56,.4)/(halfFov*Math.min(1,aspect))*(mode==='explode'?1.55:1.1),1,24);
        yaw=(id==='diffuser'||id==='diffuserRamp'||id==='rearWing'||id==='drs'||id==='beamWing')?.9:-.8;
        pitch=id==='floor'||id==='diffuser'||id==='diffuserRamp'||id==='fences'?-.36:.32;
      }
      redraw();return {visible,marked,moved,ghosted,total:pieces.length};
    }
    function view(values){
      if(values && values.length===6 && values.every(Number.isFinite) && values.slice(0,3).every(n=>Math.abs(n)<15)){
        target.fromArray(values);yaw=values[3];pitch=limit(values[4],-1.52,1.52);radius=limit(values[5],.28,28);redraw();
      }
      return [...target.toArray(),yaw,pitch,radius].map(n=>+n.toFixed(4));
    }
    async function photo(){
      draw();
      const ratio=renderer.getPixelRatio();
      const width=Math.max(1600, Math.round(host.clientWidth*ratio));
      const height=Math.round(width*host.clientHeight/host.clientWidth);
      try{
        renderer.setPixelRatio(1);renderer.setSize(width,height,false);renderer.render(root,camera);
        return await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      }finally{renderer.setPixelRatio(ratio);draw();}
    }
    function projection(value){
      camera=value==='ortho'?orthographic:perspective;
      draw();
      return camera.type;
    }
    return {show,view,turn,zoom,dispose,photo,projection};
  }catch(e){dispose();throw e;}
}
