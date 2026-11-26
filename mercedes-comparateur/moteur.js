import * as THREE from './vendor/three/build/three.module.min.js';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './vendor/three/examples/jsm/loaders/DRACOLoader.js';
import { monoplaces, pieces, repereCommun } from '/assets/donnees-mercedes.js';

const cadrages = {
  studio: { yaw: -.77, pitch: .31 },
  side: { yaw: 0, pitch: 0 },
  front: { yaw: -Math.PI / 2, pitch: 0 },
  back: { yaw: Math.PI / 2, pitch: 0 },
  top: { yaw: 0, pitch: Math.PI / 2 },
  below: { yaw: 0, pitch: -Math.PI / 2 }
};
const palette = [new THREE.Color('#49d5ba'), new THREE.Color('#ffbf72')];
const étatInitial = () => ({ ...cadrages.studio, zoom: 1 });
const interpolation = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

function éclairer(scene) {
  const ambient = new THREE.HemisphereLight(0xeaf2ff, 0x626068, 1.52);
  const main = new THREE.DirectionalLight(0xfff7ef, 2.33);
  const fill = new THREE.DirectionalLight(0xd9e9ee, 1.60);
  const rim = new THREE.DirectionalLight(0xe8fffc, 1.28);
  main.position.set(-3, 6, 3);
  fill.position.set(4, 2, -2);
  rim.position.set(2, 5, 3);
  scene.add(ambient, main, fill, rim);
  return [ambient, main, fill, rim];
}

function studioEnvironment(renderer) {
  const width = 128;
  const height = 64;
  const data = new Float32Array(width * height * 4);
  const sources = [
    [new THREE.Vector3(-.40,.85,.31).normalize(), .89, 1.7],
    [new THREE.Vector3(.45,.25,-.87).normalize(), .95, 1.4],
    [new THREE.Vector3(.93,.35,.14).normalize(), .89, 1.2]
  ];
  const direction = new THREE.Vector3();
  for (let y = 0; y < height; y++) {
    const pitch = y * Math.PI / height - Math.PI / 2;
    for (let x = 0; x < width; x++) {
      const yaw = x * Math.PI * 2 / width;
      direction.set(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch));
      let light = .13 + Math.max(0, direction.y) * .24;
      for (const [centre, edge, intensity] of sources) {
        const t = interpolation((direction.dot(centre) - edge) * 36, 0, 1);
        light += intensity * t * t * (3 - 2 * t);
      }
      const pixel = (y * width + x) * 4;
      data.set([light * .96, light, light * 1.014, 1], pixel);
    }
  }
  const image = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  image.mapping = THREE.EquirectangularReflectionMapping;
  image.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const filtered = pmrem.fromEquirectangular(image);
  image.dispose();
  pmrem.dispose();
  return filtered;
}

function createComposition() {
  const uniforms = {
    layerA: { value: null }, layerB: { value: null },
    tintA: { value: palette[0] }, tintB: { value: palette[1] },
    fraction: { value: .5 }, mode: { value: 0 },
    pixelWidth: { value: .002 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: `
      varying vec2 st;
      void main() {
        st = uv;
        gl_Position = vec4(position.xy, 0., 1.);
      }
    `,
    fragmentShader: `
      varying vec2 st;
      uniform sampler2D layerA;
      uniform sampler2D layerB;
      uniform vec3 tintA;
      uniform vec3 tintB;
      uniform float fraction;
      uniform float pixelWidth;
      uniform int mode;
      void main() {
        vec4 a = texture2D(layerA, st);
        vec4 b = texture2D(layerB, st);
        if (mode == 2) {
          float shared = min(a.a, b.a);
          float soloA = max(0., a.a - shared);
          float soloB = max(0., b.a - shared);
          float alpha = shared * .54 + soloA + soloB;
          vec3 rgb = (shared * .54 * vec3(.57) + soloA * tintA + soloB * tintB) / max(alpha, .0001);
          gl_FragColor = vec4(rgb, alpha);
        } else if (mode == 1) {
          gl_FragColor = st.x < 1. - fraction ? a : b;
          if (fraction > .003 && fraction < .997 && abs(st.x - (1. - fraction)) < pixelWidth) {
            gl_FragColor = vec4(.66,.83,.80,.81);
          }
        } else {
          float weightA = (1. - fraction) * a.a;
          float weightB = fraction * b.a;
          float alpha = weightA + weightB;
          gl_FragColor = vec4((a.rgb * weightA + b.rgb * weightB) / max(alpha, .0001), alpha);
        }
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const scene = new THREE.Scene();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  plane.frustumCulled = false;
  scene.add(plane);
  return { scene, material, uniforms };
}

function disposeCar(car) {
  const resources = new Set();
  const bitmaps = new Set();
  car.group.traverse(object => {
    if (!object.isMesh) return;
    resources.add(object.geometry);
    for (const material of [object.material].flat()) {
      resources.add(material);
      for (const value of Object.values(material)) {
        if (!value?.isTexture) continue;
        resources.add(value);
        const image = value.source.data;
        if (typeof image?.close === 'function') bitmaps.add(image);
      }
    }
  });
  for (const item of resources) item.dispose();
  for (const image of bitmaps) image.close();
}

export class Comparateur {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, premultipliedAlpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 60);
    this.box = new THREE.Vector4();
    this.bufferSize = new THREE.Vector2();
    this.look = new THREE.Vector3();
    this.environment = studioEnvironment(this.renderer);
    this.composition = createComposition();
    const targetType = this.renderer.extensions.has('EXT_color_buffer_float')
      ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.targets = [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, {
      type: targetType
    }));
    this.slots = [0, 1].map(() => {
      const scene = new THREE.Scene();
      scene.environment = this.environment.texture;
      scene.environmentIntensity = .9;
      const lights = éclairer(scene);
      return { scene, lights, car: null, orbit: étatInitial() };
    });
    this.draco = new DRACOLoader().setDecoderPath('/mercedes-w13/draco/').setWorkerLimit(2);
    this.loader = new GLTFLoader().setDRACOLoader(this.draco);
    this.clay = new THREE.MeshStandardMaterial({
      color: '#9daca9', roughness: .69, metalness: .04, polygonOffset: true, polygonOffsetFactor: 1
    });
    this.wire = new THREE.MeshBasicMaterial({
      color: '#8ee3d2', wireframe: true
    });
    this.mask = new THREE.MeshBasicMaterial({ color: 'white' });
    this.mode = 'split';
    this.align = 'chassis';
    this.sync = true;
    this.part = 'none';
    this.light = 'graphite';
    this.material = 'paint';
    this.blend = 'mix';
    this.opacity = .5;
    this.active = 0;
  }

  async load(ids) {
    const current = new Map(this.slots.flatMap(slot => slot.car ? [[slot.car.id, slot.car]] : []));
    const results = await Promise.allSettled(ids.map(async id => {
      const cached = current.get(id);
      if (cached) return cached;
      const { scene } = await this.loader.loadAsync(monoplaces[id].model);
      const group = new THREE.Group();
      group.add(scene);
      return { id, group };
    }));
    const failure = results.find(result => result.status === 'rejected');
    if (failure) {
      for (const result of results) {
        if (result.status === 'fulfilled' && !current.has(result.value.id)) disposeCar(result.value);
      }
      throw failure.reason;
    }
    for (const slot of this.slots) slot.car?.group.removeFromParent();
    for (const [id, car] of current) {
      if (!ids.includes(id)) disposeCar(car);
    }
    results.forEach(({ value: car }, index) => {
      const slot = this.slots[index];
      slot.car = car;
      slot.scene.add(car.group);
    });
    this.alignCars();
  }

  alignCars() {
    for (const { car } of this.slots) {
      if (car) car.group.position.x = repereCommun[this.align] - monoplaces[car.id].anchors[this.align];
    }
  }

  chooseView(view) {
    this.part = 'none';
    for (const slot of this.slots) slot.orbit = { ...cadrages[view], zoom: 1 };
  }

  choosePart(part) {
    this.part = part;
    const setting = pieces[part] ?? cadrages.studio;
    for (const slot of this.slots) {
      slot.orbit = { yaw: setting.yaw, pitch: setting.pitch, zoom: 1 };
    }
  }

  link() {
    this.slots[1 - this.active].orbit = { ...this.slots[this.active].orbit };
  }

  motion(index, x, y, zoom = 1) {
    this.active = index;
    const orbit = this.slots[index].orbit;
    orbit.yaw = (orbit.yaw + x) % (2 * Math.PI);
    orbit.pitch = interpolation(orbit.pitch + y, -Math.PI / 2, Math.PI / 2);
    orbit.zoom = interpolation(orbit.zoom * zoom, .55, 4.25);
    if (this.sync || this.mode !== 'split') this.link();
  }

  layout(width, height, stacked) {
    const w = Math.floor(width / 2);
    const h = Math.floor(height / 2);
    return stacked
      ? [[0, height - h, width, h], [0, 0, width, height - h]]
      : [[0, 0, w, height], [w, 0, width - w, height]];
  }

  point(slot, region) {
    if (!region || !slot.car) return [-.12, .47, 0];
    const { group, id } = slot.car;
    const { point, anchor } = region;
    return [group.position.x + monoplaces[id].anchors[anchor] + point[0], point[1], point[2]];
  }

  frame(slot, width, height, pxPerMetre, point) {
    const { yaw, pitch, zoom } = slot.orbit;
    const halfWidth = width / (2 * pxPerMetre * zoom);
    const halfHeight = height / (2 * pxPerMetre * zoom);
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.look.fromArray(point);
    const elevation = interpolation(pitch, -Math.PI / 2 + .0001, Math.PI / 2 - .0001);
    const cos = Math.cos(elevation);
    this.camera.position.copy(this.look).add(this.box.set(
      18 * Math.sin(yaw) * cos, 18 * Math.sin(elevation), 18 * Math.cos(yaw) * cos, 0
    ));
    this.camera.lookAt(this.look);
  }

  drawSlot(slot, silhouette = false) {
    slot.scene.overrideMaterial = silhouette ? this.mask : { clay: this.clay, wire: this.wire }[this.material] ?? null;
    slot.scene.environmentIntensity = this.light === 'studio' ? 1.19 : .84;
    for (const [index, light] of slot.lights.entries()) {
      light.intensity = (this.light === 'studio' ? [1.66,2.84,1.84,1.7] : [1.14,2.12,1.36,1.44])[index];
    }
    this.renderer.render(slot.scene, this.camera);
  }

  render() {
    if (!this.slots.every(slot => slot.car)) return null;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return null;
    const stacked = width < 620;
    const pixelRatio = Math.min(devicePixelRatio || 1, stacked ? 1 : 1.35, 1800 / width);
    if (this.canvas.width !== Math.floor(width * pixelRatio) || this.canvas.height !== Math.floor(height * pixelRatio)) {
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(width, height, false);
    }
    const panels = this.layout(width, height, stacked);
    const region = pieces[this.part];
    const frameWidth = region?.width ?? 6.15;
    const frameHeight = region ? frameWidth * .60 : 3.15;
    const renderWidth = this.mode === 'split' ? panels[0][2] : width;
    const renderHeight = this.mode === 'split' ? panels[0][3] : height;
    const scale = Math.min(renderWidth / frameWidth, renderHeight / frameHeight);
    this.renderer.setRenderTarget(null);
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.clear();
    if (this.mode === 'split') {
      this.renderer.setScissorTest(true);
      this.slots.forEach((slot, index) => {
        const box = panels[index];
        this.renderer.setScissor(...box);
        this.renderer.setViewport(...box);
        this.frame(slot, box[2], box[3], scale, this.point(slot, region));
        this.drawSlot(slot);
      });
      this.renderer.setScissorTest(false);
    } else {
      this.renderer.getDrawingBufferSize(this.bufferSize);
      const [slotA, slotB] = this.slots;
      const a = this.point(slotA, region);
      const b = this.point(slotB, region);
      this.frame(slotA, width, height, scale, a.map((value, index) => (value + b[index]) / 2));
      // Le curseur réutilise les couches tant que géométrie, caméra
      // et éclairage sont identiques.
      const stamp = JSON.stringify([
        this.bufferSize.x, this.bufferSize.y, slotA.car.id, slotB.car.id,
        slotA.orbit, this.part, this.align, this.mode, this.material, this.light
      ]);
      if (this.targetStamp !== stamp) {
        this.slots.forEach((slot, index) => {
          const target = this.targets[index];
          target.setSize(this.bufferSize.x, this.bufferSize.y);
          this.renderer.setRenderTarget(target);
          this.renderer.clear();
          this.drawSlot(slot, this.mode === 'silhouette');
        });
        this.targetStamp = stamp;
      }
      this.renderer.setRenderTarget(null);
      this.renderer.setViewport(0, 0, width, height);
      const { uniforms, scene } = this.composition;
      uniforms.layerA.value = this.targets[0].texture;
      uniforms.layerB.value = this.targets[1].texture;
      uniforms.fraction.value = this.opacity;
      uniforms.pixelWidth.value = .65 / width;
      uniforms.mode.value = this.mode === 'silhouette' ? 2 : this.blend === 'wipe' ? 1 : 0;
      this.renderer.render(scene, this.camera);
    }
    return scale * this.slots[this.active].orbit.zoom;
  }

  dispose() {
    for (const { car } of this.slots) if (car) disposeCar(car);
    for (const target of this.targets) target.dispose();
    for (const material of [this.clay, this.wire, this.mask, this.composition.material]) material.dispose();
    for (const mesh of this.composition.scene.children) mesh.geometry.dispose();
    this.environment.dispose();
    this.draco.dispose();
    this.renderer.dispose();
  }
}
