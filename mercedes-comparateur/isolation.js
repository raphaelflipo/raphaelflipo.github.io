import * as T from './vendor/three/build/three.module.min.js';
import { children, triangles } from '../assets/composants/familles.js';

export function clearSelection(car) {
  for (const mesh of car.selection ?? []) {
    mesh.removeFromParent();
    if (mesh.userData.ownsIndex) mesh.geometry.dispose();
  }
  car.selection=[];
}

export async function prepareSelection(car,id) {
  if (!car.semanticMap) {
    const response=await fetch('/assets/composants/mercedes-'+car.id+'.json');
    if (!response.ok) throw Error('HTTP '+response.status);
    car.semanticMap=await response.json();
  }
  const map=car.semanticMap, wanted=new Set([id,...children[id]??[]]);
  const pieces=[];
  for(const [source,association] of car.primitives){
    const code=map.meshes[association.meshes][association.primitives??0];
    let geometry=source.geometry,ownsIndex=false;
    if(typeof code==='number'){
      if(!wanted.has(map.parts[code]))continue;
    }else{
      let ids=car.decoded.get(code);
      if(!ids){ids=await triangles(code);car.decoded.set(code,ids);}
      const original=source.geometry.index;
      if(ids.length*3!==original.count)throw Error('Topology');
      const subset=[];
      ids.forEach((value,face)=>{
        if(wanted.has(map.parts[value]))subset.push(original.getX(face*3),original.getX(face*3+1),original.getX(face*3+2));
      });
      if(!subset.length)continue;
      geometry=new T.BufferGeometry();
      for(const [name,attr] of Object.entries(source.geometry.attributes))geometry.setAttribute(name,attr);
      geometry.setIndex(subset);ownsIndex=true;
    }
    const mesh=new T.Mesh(geometry,source.material);
    mesh.layers.set(2);mesh.userData.ownsIndex=ownsIndex;
    pieces.push([source,mesh]);
  }
  return pieces;
}
