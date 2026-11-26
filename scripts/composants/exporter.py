"""Exporte l'appartenance des triangles des GLB publics aux objets des maîtres Blender.
Python avec bpy 5.3, DracoPy, NumPy et SciPy. Usage : exporter.py maître.blend modèle.glb sortie.json.
Les indices sont ceux du décodage Draco. Aucun sommet, matériau ou attribut du GLB n'est réécrit.
"""
import base64
import hashlib
import json
import re
import struct
import sys
import unicodedata
import zlib
from collections import Counter
from pathlib import Path

import bpy
import DracoPy
import numpy as np
from scipy.spatial import cKDTree

parts = 'context frontWing nose frontSuspension wheels sidepods inlets floor diffuser cockpit airbox engineCover rearSuspension rearWing drs mainplane flaps endplates fences beamWing'.split()

def plain(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.lower().replace('_', ' ')) if not unicodedata.combining(c))

def family(obj, moving):
    n = plain(obj.name)
    c = plain(' '.join(coll.name for coll in obj.users_collection))
    if moving or 'volet mobile' in n or 'volet superieur mobile' in n: return 'drs'
    if 'livree' in c or obj.get('marquage'): return 'context'
    if 'beam wing' in n or 'beam wing' in c: return 'beamWing'
    if 'aileron avant' in c:
        if 'derive' in n or 'plaque laterale' in n: return 'endplates'
        if 'plan principal' in n: return 'mainplane'
        if 'volet' in n: return 'flaps'
        return 'frontWing'
    if 'aileron arriere' in c: return 'rearWing'
    if 'suspension' in c: return 'rearSuspension' if 'arriere' in c or re.match(r'^ar[gd]', n) else 'frontSuspension'
    if 'roue' in c: return 'wheels'
    if 'plancher' in c or 'diffuseur' in c:
        if 'diffuseur' in c and 'plancher' not in c: return 'diffuser'
        if ('diffuseur' in n and 'tunnel' not in n) or 'levre profilee de sortie' in n: return 'diffuser'
        if 'cloison' in n or 'fence' in n: return 'fences'
        return 'floor'
    if 'ponton' in c:
        if any(t in n for t in ['admission','entree','conduit visible','levre','prise laterale']): return 'inlets'
        return 'sidepods'
    if any(t in n for t in ['airbox','admission superieure','prise moteur','prise superieure','arceau superieur','coiffe arceau','admission moteur']): return 'airbox'
    if any(t in c for t in ['pilotage','cockpit','habitacle','retroviseur']) or 'cockpit' in n: return 'cockpit'
    if any(t in n for t in ['capot','echappement','ouie','cheminee','sortie chaude']) or 'capot' in c and 'cellule' not in c: return 'engineCover'
    if any(t in c for t in ['chassis','cellule','nez','monocoque']): return 'nose'
    return 'context'

def semantic_source(blend, car):
    bpy.ops.wm.open_mainfile(filepath=str(blend.resolve()), load_ui=False, use_scripts=False)
    scene = bpy.context.scene
    scene.frame_set(1)
    pivot = next((ob for ob in scene.objects if ob.get('drs_pivot')), None)
    moving = set(pivot.children_recursive) if pivot else set()
    sources = [ob for ob in scene.objects if ob.type in {'MESH','CURVE','FONT','SURFACE'} and not ob.hide_render
               and (ob.get('piece_'+car) or car == 'W13' and 'studio' not in plain(' '.join(c.name for c in ob.users_collection)))]
    names = {ob.name:parts.index(family(ob, ob in moving)) for ob in sources}
    if car == 'W13': return names, None
    lod = [(('enveloppe slick','sièges de talon','tunnel et diffuseur'),.57),(('monocoque et museau','capot moteur','rampe et canal','arceau titane'),.66),(('volet 1','volet 2','volet 3','plan principal','volet supérieur mobile','beam wing'),.60)]
    if car == 'W16': lod.append((('enveloppe intermédiaire',),.54))
    for ob in sources:
        for patterns,ratio in lod:
            if ob.type == 'MESH' and any(pattern in ob.name.casefold() for pattern in patterns):
                ob.modifiers.new('Diffusion', 'DECIMATE').ratio = ratio
                break
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    centers, ids, vertices, owners = [], [], [], []
    for ob in sources:
        evaluated = ob.evaluated_get(deps)
        mesh = evaluated.to_mesh()
        if not mesh or not mesh.polygons:
            evaluated.to_mesh_clear()
            continue
        mesh.calc_loop_triangles()
        coords = np.empty(len(mesh.vertices)*3, np.float32)
        mesh.vertices.foreach_get('co',coords)
        matrix = np.array(evaluated.matrix_world)
        coords = coords.reshape(-1,3) @ matrix[:3,:3].T + matrix[:3,3]
        coords = coords[:,[0,2,1]].copy()
        coords[:,2] *= -1
        indices = np.empty(len(mesh.loop_triangles)*3, np.int32)
        mesh.loop_triangles.foreach_get('vertices',indices)
        tri = coords[indices.reshape(-1,3)].mean(axis=1)
        centers.append(tri); ids.append(np.full(len(tri),names[ob.name],np.uint8))
        vertices.append(coords); owners.append(np.full(len(coords),names[ob.name],np.uint8))
        evaluated.to_mesh_clear()
    return names,(cKDTree(np.vstack(centers)),np.concatenate(ids),cKDTree(np.vstack(vertices)),np.concatenate(owners))

def run(blend, model, destination):
    car = re.search(r'w1[3-6]',model.name).group().upper()
    names, trees = semantic_source(blend, car)
    raw = model.read_bytes()
    length, = struct.unpack_from('<I',raw,12)
    gltf = json.loads(raw[20:20+length])
    buf = memoryview(raw)[28+length:]
    nodes = {n['mesh']:n for n in gltf['nodes'] if 'mesh' in n}
    lookup = {}
    for name, idx in names.items():
        lookup[plain(name)] = idx
    result = []; counts = Counter(); unknown = 0
    for mi, mesh in enumerate(gltf['meshes']):
        node = nodes[mi]; row = []
        for primitive in mesh['primitives']:
            faces = gltf['accessors'][primitive['indices']]['count']//3
            if car == 'W13':
                name = node.get('name','')
                value = lookup.get(plain(name),0)
                if 'volet drs' in plain(name) or re.search(r'volet.*(?:superieur|mobile).*drs|volet mobile',plain(name)): value = parts.index('drs')
                labels = np.full(faces,value,np.uint8)
            elif 'mobile' in node['name'].lower() or 'du drs' in node['name'].lower():
                labels = np.full(faces,parts.index('drs'),np.uint8)
            elif 'marquages' in node['name'].lower():
                labels = np.zeros(faces,np.uint8)
            else:
                ext = primitive['extensions']['KHR_draco_mesh_compression']
                v = gltf['bufferViews'][ext['bufferView']]
                offset = v.get('byteOffset',0)
                draco = DracoPy.decode(bytes(buf[offset:offset+v['byteLength']]))
                coords = draco.points[draco.faces]
                distances, closest = trees[0].query(coords.mean(axis=1))
                labels = trees[1][closest].copy()
                misses = distances > .00018
                if misses.any():
                    vd, vi = trees[2].query(coords[misses])
                    owners = trees[3][vi]
                    same = (vd.max(axis=1)<.00018) & (owners.max(axis=1)==owners.min(axis=1))
                    labels[misses] = np.where(same, owners[:,0],0)
                    unknown += int((~same).sum())
            if len(labels) != faces: raise ValueError('Nombre de triangles incompatible')
            counts.update(dict(zip(*np.unique(labels,return_counts=True))))
            row.append(int(labels[0]) if labels.min()==labels.max() else base64.b64encode(zlib.compress(labels.tobytes(),9)).decode())
        result.append(row)
    out={'sha256':hashlib.sha256(raw).hexdigest(),'parts':parts,'meshes':result,'triangles':{parts[k]:int(v) for k,v in sorted(counts.items())},'unmatched':unknown}
    destination.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
    print(model.name,out['triangles'],'unmatched',unknown,flush=True)
if __name__ == '__main__':
    run(*map(Path,sys.argv[1:]))
