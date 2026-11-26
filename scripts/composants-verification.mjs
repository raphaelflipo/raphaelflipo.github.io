import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const dir = 'assets/composants/';
for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
  const map = JSON.parse(readFileSync(dir + file));
  const stem = file.replace('.json','');
  const car = stem.match(/mercedes-w\d+/)[0];
  const glb = readFileSync(car + '/' + stem + '.glb');
  assert.equal(createHash('sha256').update(glb).digest('hex'), map.sha256, stem + ' source');
  const gltf = JSON.parse(glb.toString('utf8',20,20 + glb.readUInt32LE(12)));
  const counts = Array(map.parts.length).fill(0);
  assert.equal(map.meshes.length, gltf.meshes.length);
  gltf.meshes.forEach((mesh,i)=>{
    assert.equal(mesh.primitives.length,map.meshes[i].length);
    mesh.primitives.forEach((primitive,j)=>{
      const n=gltf.accessors[primitive.indices].count/3;
      const value=map.meshes[i][j];
      if(typeof value==='number'){assert.ok(value>=0 && value<counts.length);counts[value]+=n;}
      else{
        const groups=inflateSync(Buffer.from(value,'base64'));assert.equal(groups.length,n);
        for(const k of groups){assert.ok(k<counts.length);counts[k]++;}
      }
    });
  });
  map.parts.forEach((id,i)=>{assert.equal(counts[i],map.triangles[id]??0);if(id!=='context')assert.ok(counts[i]>0,stem+' '+id);});
  console.log(stem, counts.reduce((a,b)=>a+b,0), 'triangles');
}
