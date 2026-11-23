import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/* ───────────── helpers ───────────── */

const PEAK_Z = -36;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function fbm(x: number, y: number, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * noise(x * f, y * f); f *= 2; amp *= 0.5; }
  return v;
}
function ridged(x: number, y: number) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { v += amp * (1 - Math.abs(noise(x * f, y * f))); f *= 2.1; amp *= 0.5; }
  return v;
}
const gauss = (x: number, z: number, cx: number, cz: number, h: number, w: number) =>
  h * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / w);

/** Height of the landscape at (x, z). */
export function heightAt(x: number, z: number) {
  const d2 = x * x + (z - PEAK_Z) ** 2;
  // main peak with ridges
  let peak = 34 * Math.exp(-d2 / 170) * (0.85 + 0.3 * fbm(x * 0.09, z * 0.09));
  peak += 7 * ridged(x * 0.07, z * 0.07) * Math.exp(-d2 / 420);
  // valley walls that narrow toward the peak
  const wallStart = 13 + (z - PEAK_Z) * 0.12;
  const w = Math.max(0, Math.abs(x) - wallStart);
  let walls = Math.min(26, w * w * 0.045 + w * 0.6 * ridged(x * 0.06, z * 0.06));
  walls += fbm(x * 0.05, z * 0.05) * w * 0.25;
  // distant ranges
  const far = Math.max(
    gauss(x, z, -48, -75, 30, 380), gauss(x, z, 52, -70, 28, 420),
    gauss(x, z, -66, -20, 20, 300), gauss(x, z, 66, -12, 22, 320),
  ) * (0.8 + 0.4 * ridged(x * 0.05, z * 0.05));
  let h = Math.max(peak, walls, far) + 0.45 * fbm(x * 0.3, z * 0.3);
  // lake basin
  const ld = x * x + (z - 6) ** 2;
  if (ld < 34) h = Math.min(h, -0.7 + ld * 0.018);
  return h;
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.85)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ───────────── campfire ───────────── */

class Campfire {
  group = new THREE.Group();
  light: THREE.PointLight;
  flames: THREE.Mesh[] = [];
  sparks: THREE.Points;
  steam: THREE.Points;
  private sparkData: { v: number; life: number }[] = [];
  private steamData: { v: number; life: number }[] = [];

  constructor(pos: THREE.Vector3, dot: THREE.Texture, withPot: boolean) {
    this.group.position.copy(pos);
    const logMat = new THREE.MeshStandardMaterial({ color: "#4a2f1d", roughness: 1 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 6), logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 3) * Math.PI;
      log.position.y = 0.08;
      this.group.add(log);
    }
    const stoneMat = new THREE.MeshStandardMaterial({ color: "#6b655e", flatShading: true });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), stoneMat);
      s.position.set(Math.cos(a) * 0.65, 0.06, Math.sin(a) * 0.65);
      this.group.add(s);
    }
    const fc = ["#ff5a1f", "#ff9a3d", "#ffd27a"];
    fc.forEach((col, i) => {
      const f = new THREE.Mesh(
        new THREE.ConeGeometry(0.32 - i * 0.08, 0.9 - i * 0.18, 7),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 }),
      );
      f.position.y = 0.45 - i * 0.05;
      this.flames.push(f);
      this.group.add(f);
    });
    this.light = new THREE.PointLight("#ff7a2f", 0, 18, 1.6);
    this.light.position.y = 1.2;
    this.group.add(this.light);

    if (withPot) {
      const potMat = new THREE.MeshStandardMaterial({ color: "#2a2b2f", metalness: 0.6, roughness: 0.4 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.38, 16), potMat);
      pot.position.y = 1.05;
      this.group.add(pot);
      const stickMat = new THREE.MeshStandardMaterial({ color: "#5a3b22" });
      [-1, 1].forEach((sd) => {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 5), stickMat);
        st.position.set(sd * 0.7, 0.75, 0);
        st.rotation.z = sd * 0.25;
        this.group.add(st);
      });
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 5), stickMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 1.45;
      this.group.add(bar);
    }

    const mk = (n: number, color: string, size: number, opacity: number, blending: THREE.Blending) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
      return new THREE.Points(g, new THREE.PointsMaterial({
        color, size, map: dot, transparent: true, opacity, depthWrite: false, blending,
      }));
    };
    this.sparks = mk(60, "#ffb35c", 0.14, 1, THREE.AdditiveBlending);
    this.steam = mk(withPot ? 40 : 0, "#ffffff", 0.5, 0.25, THREE.NormalBlending);
    for (let i = 0; i < 60; i++) this.sparkData.push({ v: 0.6 + Math.random() * 1.2, life: Math.random() });
    for (let i = 0; i < 40; i++) this.steamData.push({ v: 0.3 + Math.random() * 0.4, life: Math.random() });
    this.group.add(this.sparks, this.steam);
  }

  update(t: number, dt: number, strength: number) {
    this.group.visible = strength > 0.02;
    this.light.intensity = strength * (5 + Math.sin(t * 13) * 0.8 + Math.sin(t * 7.3) * 0.6);
    this.flames.forEach((f, i) => {
      f.scale.y = 1 + Math.sin(t * (10 + i * 3)) * 0.15;
      f.rotation.y = t * (1 + i);
    });
    const sp = this.sparks.geometry.attributes.position as THREE.BufferAttribute;
    this.sparkData.forEach((s, i) => {
      s.life += dt * s.v * 0.5;
      if (s.life > 1) s.life = 0;
      sp.setXYZ(i, Math.sin(i * 7.1 + t) * 0.3 * s.life, 0.4 + s.life * 3.5, Math.cos(i * 3.3 + t) * 0.3 * s.life);
    });
    sp.needsUpdate = true;
    const stp = this.steam.geometry.attributes.position as THREE.BufferAttribute;
    this.steamData.forEach((s, i) => {
      s.life += dt * s.v * 0.3;
      if (s.life > 1) s.life = 0;
      stp.setXYZ(i, Math.sin(i * 2.1 + t * 0.8) * 0.4 * s.life, 1.3 + s.life * 2.4, Math.cos(i * 1.7) * 0.3 * s.life);
    });
    stp.needsUpdate = true;
  }
}

/* ───────────── main scene ───────────── */

export class ExpeditionScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer?: EffectComposer;
  private bloom?: UnrealBloomPass;
  private last = performance.now();
  private elapsed = 0;
  private low: boolean;

  private sun: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private sunSprite: THREE.Sprite;
  private moonMesh: THREE.Mesh;
  private lake: THREE.Mesh;
  private clouds = new THREE.Group();
  private cloudMat: THREE.MeshLambertMaterial;
  private birds = new THREE.Group();
  private birdMat: THREE.LineBasicMaterial;
  private grassMat: THREE.MeshStandardMaterial;
  private grassTime = { value: 0 };
  private fires: Campfire[] = [];
  private trail: THREE.Vector3[] = [];
  private trailDone: THREE.Line;
  private climber = new THREE.Group();
  private headlamp: THREE.SpotLight;
  private stars: THREE.Points[] = [];
  private galaxy: THREE.Points;
  private planet = new THREE.Group();
  private shooting: THREE.Line;
  private shootT = -1;
  private flags = new THREE.Group();

  private skyKeys: [number, THREE.Color][];
  private lookAt = new THREE.Vector3();
  private camPos = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, low: boolean) {
    this.low = low;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.25 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 900);
    this.scene.background = new THREE.Color("#b9d3e3");
    this.scene.fog = new THREE.FogExp2("#b9d3e3", 0.0038);

    this.skyKeys = (
      [
        [0, "#a9cbe3"], [0.13, "#e9c497"], [0.25, "#eaa46e"], [0.36, "#d9714f"],
        [0.45, "#4a3566"], [0.55, "#121a3a"], [0.66, "#0a1030"], [0.8, "#03040c"], [1, "#03040c"],
      ] as [number, string][]
    ).map(([a, c]) => [a, new THREE.Color(c)]);

    const dot = dotTexture();

    /* lights */
    this.sun = new THREE.DirectionalLight("#ffd29a", 2.2);
    this.sun.position.set(40, 30, 10);
    this.moonLight = new THREE.DirectionalLight("#aebfff", 0);
    this.moonLight.position.set(-40, 50, 20);
    this.hemi = new THREE.HemisphereLight("#cfe3f2", "#3b3222", 1);
    this.scene.add(this.sun, this.moonLight, this.hemi);

    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: "#ffe3b0", transparent: true, fog: false, depthWrite: false }));
    this.sunSprite.scale.setScalar(26);
    this.scene.add(this.sunSprite);
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial({ color: "#f4f1e6", fog: false }));
    this.moonMesh.position.set(-90, 95, -170);
    this.scene.add(this.moonMesh);

    this.buildTerrain();
    this.lake = this.buildLake();
    this.grassMat = this.buildMeadow(dot);
    this.buildTrees();
    this.cloudMat = this.buildClouds();
    this.birdMat = this.buildBirds();
    this.buildTrail();
    this.trailDone = this.scene.getObjectByName("trailDone") as THREE.Line;
    this.headlamp = this.buildClimber();
    this.buildTents();
    this.buildFlags();

    this.fires.push(new Campfire(new THREE.Vector3(6, heightAt(6, 12.5), 12.5), dot, true));
    const hc = this.trailPoint(0.88);
    this.fires.push(new Campfire(new THREE.Vector3(hc.x + 1.6, heightAt(hc.x + 1.6, hc.z + 0.8), hc.z + 0.8), dot, true));
    this.fires.forEach((f) => this.scene.add(f.group));

    this.buildStars(dot);
    this.galaxy = this.buildGalaxy(dot);
    this.buildPlanet();
    this.shooting = this.buildShootingStar();

    if (!low) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.5, 0.82);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
  }

  /* ───── builders ───── */

  private buildTerrain() {
    const seg = this.low ? 140 : 230;
    const g = new THREE.PlaneGeometry(190, 190, seg, seg);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -25);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const cols: number[] = [];
    const grass = new THREE.Color("#8d9a45"), forest = new THREE.Color("#2f4527"),
      rock = new THREE.Color("#7f766c"), rockDark = new THREE.Color("#5d564f"), snow = new THREE.Color("#f4f1ea"),
      shore = new THREE.Color("#6d6a4a"), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z);
      pos.setY(i, h);
      const n = fbm(x * 0.2, z * 0.2) * 2.5;
      const ld = x * x + (z - 6) ** 2;
      if (ld < 44) c.copy(shore);
      else if (h < 1.6) c.copy(grass).lerp(new THREE.Color("#a3a24e"), Math.max(0, fbm(x * 0.15, z * 0.15)));
      else if (h < 10 + n) c.copy(grass).lerp(forest, Math.min(1, (h - 1.6) / 3));
      else if (h < 21 + n) c.copy(forest).lerp(rock, Math.min(1, (h - 10 - n) / 3)).lerp(rockDark, Math.max(0, fbm(x * 0.07, z * 0.07)) * 0.5);
      else c.copy(rock).lerp(snow, Math.min(1, (h - 21 - n) / 4));
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
    this.scene.add(m);
  }

  private buildLake() {
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(6, 48),
      new THREE.MeshPhongMaterial({ color: "#5f8fae", shininess: 120, specular: new THREE.Color("#ffffff"), transparent: true, opacity: 0.92 }),
    );
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0, -0.08, 6);
    this.scene.add(lake);
    return lake;
  }

  private buildMeadow(dot: THREE.Texture) {
    // swaying grass blades (instanced)
    const blade = new THREE.PlaneGeometry(0.07, 0.6, 1, 3);
    blade.translate(0, 0.3, 0);
    const mat = new THREE.MeshStandardMaterial({ color: "#9aa84d", side: THREE.DoubleSide, roughness: 1 });
    const time = this.grassTime;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time;
      sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         #ifdef USE_INSTANCING
           float ph = instanceMatrix[3].x * 0.6 + instanceMatrix[3].z * 0.4;
         #else
           float ph = 0.0;
         #endif
         transformed.x += sin(uTime * 1.8 + ph) * 0.18 * position.y * position.y;
         transformed.z += cos(uTime * 1.3 + ph) * 0.08 * position.y;`,
      );
    };
    const count = this.low ? 3500 : 9000;
    const im = new THREE.InstancedMesh(blade, mat, count);
    const o = new THREE.Object3D();
    let n = 0;
    for (let k = 0; k < count * 3 && n < count; k++) {
      const x = (Math.random() - 0.5) * 40, z = -4 + Math.random() * 36;
      const h = heightAt(x, z);
      if (h > 2 || x * x + (z - 6) ** 2 < 42) continue;
      o.position.set(x, h - 0.05, z);
      o.rotation.y = Math.random() * Math.PI;
      const s = 0.7 + Math.random() * 0.9;
      o.scale.set(1, s, 1);
      o.updateMatrix();
      im.setMatrixAt(n++, o.matrix);
    }
    im.count = n;
    this.scene.add(im);

    // wildflowers
    const fp: number[] = [], fc: number[] = [];
    const pal = ["#ef8cc6", "#ffffff", "#f6d56a", "#b98ce0", "#ffffff", "#ff9fb0"].map((h) => new THREE.Color(h));
    const fCount = this.low ? 2200 : 5000;
    for (let i = 0; i < fCount; i++) {
      const x = (Math.random() - 0.5) * 36, z = 2 + Math.random() * 30;
      const h = heightAt(x, z);
      if (h > 1.8 || x * x + (z - 6) ** 2 < 42) continue;
      fp.push(x, h + 0.35 + Math.random() * 0.2, z);
      const c = pal[i % pal.length];
      fc.push(c.r, c.g, c.b);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3));
    fg.setAttribute("color", new THREE.Float32BufferAttribute(fc, 3));
    this.scene.add(new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, map: dot, transparent: true, depthWrite: false })));
    return mat;
  }

  private buildTrees() {
    const parts = [0, 1, 2].map((i) => {
      const c = new THREE.ConeGeometry(1.1 - i * 0.28, 1.6, 7);
      c.translate(0, 1.4 + i * 0.85, 0);
      return c;
    });
    const foliage = mergeGeometries(parts)!;
    const trunk = new THREE.CylinderGeometry(0.12, 0.16, 1, 5);
    trunk.translate(0, 0.5, 0);
    const count = this.low ? 650 : 1500;
    const fm = new THREE.InstancedMesh(foliage, new THREE.MeshStandardMaterial({ color: "#1f3a26", flatShading: true, roughness: 1 }), count);
    const tm = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: "#3d2a1c" }), count);
    const col = new THREE.Color();
    const o = new THREE.Object3D();
    let n = 0;
    for (let k = 0; k < 20000 && n < count; k++) {
      const x = (Math.random() - 0.5) * 120, z = -70 + Math.random() * 100;
      const h = heightAt(x, z);
      const tx = this.trailX(z);
      const inMeadow = Math.abs(x) < 9 && z > -6;
      if (h < 0.3 || h > 13 || inMeadow || Math.abs(x - tx) < 2.6 || x * x + (z - 6) ** 2 < 70) continue;
      const s = 0.55 + Math.random() * 0.75;
      o.position.set(x, h - 0.1, z);
      o.rotation.y = Math.random() * Math.PI;
      o.scale.set(s, s * (0.9 + Math.random() * 0.5), s);
      o.updateMatrix();
      fm.setMatrixAt(n, o.matrix);
      tm.setMatrixAt(n, o.matrix);
      fm.setColorAt(n, col.set("#1f3a26").offsetHSL(0, 0, (Math.random() - 0.5) * 0.06));
      n++;
    }
    fm.count = tm.count = n;
    this.scene.add(fm, tm);
  }

  private buildClouds() {
    const mat = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: new THREE.Color("#e8dccf"), emissiveIntensity: 0.55, transparent: true, opacity: 0.95, depthWrite: false });
    const spots: [number, number, number][] = [[-38, 44, -70], [30, 50, -80], [4, 58, -100], [-60, 48, -50], [62, 42, -55]];
    spots.forEach(([x, y, z]) => {
      const c = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(3 + Math.random() * 3.5, 3), mat);
        m.position.set((Math.random() - 0.5) * 16, Math.random() * 2.5, (Math.random() - 0.5) * 6);
        m.scale.set(1.3, 0.55, 1);
        c.add(m);
      }
      c.position.set(x, y, z);
      this.clouds.add(c);
    });
    this.scene.add(this.clouds);
    return mat;
  }

  private buildBirds() {
    const mat = new THREE.LineBasicMaterial({ color: "#2a2520", transparent: true });
    for (let i = 0; i < 16; i++) {
      const b = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.5, 0.25, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, 0.25, 0)]),
        mat,
      );
      b.position.set(Math.random() * 14, Math.random() * 5, Math.random() * 4);
      this.birds.add(b);
    }
    this.birds.position.set(-40, 26, -14);
    this.scene.add(this.birds);
    return mat;
  }

  private trailX(z: number) {
    const t = (16 - z) / (16 - PEAK_Z);
    return Math.sin(t * Math.PI * 5) * 7 * (1 - t);
  }
  trailPoint(t: number) {
    const i = Math.round(Math.min(1, Math.max(0, t)) * (this.trail.length - 1));
    return this.trail[i];
  }

  private buildTrail() {
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const z = 16 - t * (16 - PEAK_Z);
      const x = Math.sin(t * Math.PI * 5) * 7 * (1 - t);
      this.trail.push(new THREE.Vector3(x, heightAt(x, z) + 0.25, z));
    }
    const g = new THREE.BufferGeometry().setFromPoints(this.trail);
    const faint = new THREE.Line(g, new THREE.LineDashedMaterial({ color: "#f3e3cf", dashSize: 0.5, gapSize: 0.4, transparent: true, opacity: 0.6 }));
    faint.computeLineDistances();
    const done = new THREE.Line(g.clone(), new THREE.LineBasicMaterial({ color: "#ff8a3d" }));
    done.name = "trailDone";
    done.geometry.setDrawRange(0, 0);
    this.scene.add(faint, done);
  }

  private buildClimber() {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 4, 8), new THREE.MeshStandardMaterial({ color: "#e4572e" }));
    body.position.y = 0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshStandardMaterial({ color: "#f1c7a3" }));
    head.position.y = 1.0;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.2), new THREE.MeshStandardMaterial({ color: "#2f4b6e" }));
    pack.position.set(0, 0.58, 0.2);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: "#fff6d0" }));
    lamp.position.set(0, 1.05, -0.16);
    this.climber.add(body, head, pack, lamp);
    const spot = new THREE.SpotLight("#fff2cc", 0, 14, 0.5, 0.6, 1.5);
    spot.position.set(0, 1.05, -0.2);
    spot.target.position.set(0, 0, -5);
    this.climber.add(spot, spot.target);
    this.climber.scale.setScalar(1.4);
    this.scene.add(this.climber);
    return spot;
  }

  private buildTents() {
    const colors = ["#ff7a2f", "#f2c14e", "#e4572e", "#5aa9e6", "#ff7a2f"];
    [0.06, 0.2, 0.34, 0.48, 0.62].forEach((t, i) => {
      const p = this.trailPoint(t);
      const g = new THREE.Group();
      const tent = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 4), new THREE.MeshStandardMaterial({ color: colors[i], flatShading: true }));
      tent.position.y = 0.55;
      tent.rotation.y = Math.PI / 4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6), new THREE.MeshStandardMaterial({ color: "#ddd" }));
      pole.position.set(0.9, 0.8, 0);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.28), new THREE.MeshStandardMaterial({ color: "#fff", side: THREE.DoubleSide }));
      flag.position.set(1.12, 1.45, 0);
      g.add(tent, pole, flag);
      const ox = p.x + 2, oz = p.z;
      g.position.set(ox, heightAt(ox, oz), oz);
      this.scene.add(g);
    });
  }

  private buildFlags() {
    const top = this.trailPoint(1);
    const cols = ["#3a7bd5", "#ffffff", "#e4572e", "#3bb273", "#f2c14e"];
    const a = new THREE.Vector3(top.x - 3, top.y + 1.6, top.z + 0.5);
    const b = new THREE.Vector3(top.x + 3, top.y + 0.4, top.z - 0.5);
    this.flags.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: "#ddd" })));
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshStandardMaterial({ color: cols[i % 5], side: THREE.DoubleSide }));
      f.position.lerpVectors(a, b, t);
      f.position.y -= 0.25 + Math.sin(t * Math.PI) * 0.3;
      this.flags.add(f);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), new THREE.MeshStandardMaterial({ color: "#ccc" }));
    pole.position.set(a.x, a.y - 1.1, a.z);
    this.flags.add(pole);
    this.scene.add(this.flags);
  }

  private buildStars(dot: THREE.Texture) {
    for (let layer = 0; layer < 2; layer++) {
      const p: number[] = [];
      const n = this.low ? 1200 : 2400;
      for (let i = 0; i < n; i++) {
        const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 0.55, r = 380;
        p.push(Math.cos(u) * Math.sin(v) * r, Math.cos(v) * r * 0.8 + 30, Math.sin(u) * Math.sin(v) * r - 40);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      const s = new THREE.Points(g, new THREE.PointsMaterial({
        color: "#ffffff", size: layer ? 2.6 : 1.6, map: dot, transparent: true, opacity: 0, depthWrite: false, fog: false,
      }));
      this.stars.push(s);
      this.scene.add(s);
    }
  }

  private buildGalaxy(dot: THREE.Texture) {
    const gp: number[] = [], gc: number[] = [];
    const inner = new THREE.Color("#ffc58a"), outer = new THREE.Color("#7f77dd"), c = new THREE.Color();
    const n = this.low ? 5000 : 12000;
    for (let i = 0; i < n; i++) {
      const r = Math.random() * 40;
      const a = ((i % 4) / 4) * Math.PI * 2 + r * 0.28;
      const s = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 4;
      gp.push(Math.cos(a) * r + s(), s() * 0.4, Math.sin(a) * r + s());
      c.copy(inner).lerp(outer, r / 40);
      gc.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(gc, 3));
    const gal = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.7, vertexColors: true, map: dot, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }));
    gal.position.set(0, 130, PEAK_Z - 20);
    gal.rotation.x = 0.55;
    this.scene.add(gal);
    return gal;
  }

  private buildPlanet() {
    const body = new THREE.Mesh(new THREE.SphereGeometry(9, 48, 48), new THREE.MeshStandardMaterial({ color: "#d39a6a", roughness: 0.9, fog: false }));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(12, 18, 96),
      new THREE.MeshBasicMaterial({ color: "#f3d7b5", side: THREE.DoubleSide, transparent: true, opacity: 0.55, fog: false }),
    );
    ring.rotation.x = Math.PI / 2.4;
    this.planet.add(body, ring);
    this.planet.position.set(110, 150, -190);
    this.planet.visible = false;
    this.scene.add(this.planet);
  }

  private buildShootingStar() {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, fog: false }));
    this.scene.add(l);
    return l;
  }

  /* ───── per frame ───── */

  private sky(p: number, out: THREE.Color) {
    const k = this.skyKeys;
    for (let i = 0; i < k.length - 1; i++) {
      if (p <= k[i + 1][0]) {
        const t = (p - k[i][0]) / (k[i + 1][0] - k[i][0]);
        return out.copy(k[i][1]).lerp(k[i + 1][1], t);
      }
    }
    return out.copy(k[k.length - 1][1]);
  }

  render(p: number, mouse: { x: number; y: number }) {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.elapsed += dt;
    const t = this.elapsed;
    this.grassTime.value = t;

    const climb = Math.min(p / 0.7, 1);
    const dusk = smooth(0.18, 0.42, p);
    const night = smooth(0.38, 0.56, p);
    const space = smooth(0.68, 0.88, p);

    // sky + fog
    const bg = this.scene.background as THREE.Color;
    this.sky(p, bg);
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.copy(bg);
    fog.density = 0.0038 * (1 - space) + 0.0006;

    // sun goes down, moon comes up
    const sunH = 48 - dusk * 52;
    this.sun.position.set(55, sunH, -40);
    this.sun.intensity = 2.8 * (1 - night);
    this.sun.color.set("#ffcf8a").lerp(new THREE.Color("#ff6a3d"), dusk);
    this.sunSprite.position.set(70, sunH + 10, -160);
    (this.sunSprite.material as THREE.SpriteMaterial).opacity = 1 - night;
    (this.sunSprite.material as THREE.SpriteMaterial).color.set("#fff0c8").lerp(new THREE.Color("#ff7a45"), dusk);
    this.moonLight.intensity = 1.1 * night;
    this.moonMesh.visible = night > 0.05;
    this.hemi.color.set("#dfe6ea").lerp(new THREE.Color("#3a4a86"), night);
    this.hemi.groundColor.set("#3b3222").lerp(new THREE.Color("#0b0d18"), night);
    this.hemi.intensity = 1 - 0.45 * night;

    // lake mirrors the sky
    const lm = this.lake.material as THREE.MeshPhongMaterial;
    lm.color.copy(bg).lerp(new THREE.Color("#3f79a0"), 0.6);

    // clouds and birds fade with the light
    const cloudFade = smooth(0.3, 0.45, p);
    this.cloudMat.opacity = 0.95 * (1 - cloudFade);
    this.cloudMat.emissive.set("#e8dccf").lerp(new THREE.Color("#ff9a6a"), dusk);
    this.clouds.visible = cloudFade < 0.98;
    this.clouds.position.x = Math.sin(t * 0.03) * 6;
    this.birdMat.opacity = 1 - dusk;
    this.birds.visible = dusk < 0.98;
    this.birds.position.x = -40 + ((t * 2.4) % 80);
    this.birds.children.forEach((b, i) => {
      b.scale.y = Math.sin(t * 8 + i) * 0.9;
      b.position.y = (i % 5) + Math.sin(t + i) * 0.4;
    });

    // campfires light up at dusk
    this.fires[0].update(t, dt, dusk);
    this.fires[1].update(t, dt, night);

    // climber + glowing trail
    const idx = Math.round(climb * (this.trail.length - 1));
    const cp = this.trail[idx];
    const next = this.trail[Math.min(idx + 4, this.trail.length - 1)];
    this.climber.position.copy(cp).setY(cp.y - 0.25);
    this.climber.lookAt(next.x, cp.y - 0.25, next.z);
    this.climber.rotateY(Math.PI);
    this.climber.position.y += Math.abs(Math.sin(t * 6)) * 0.04;
    this.headlamp.intensity = night * 12;
    this.trailDone.geometry.setDrawRange(0, idx + 1);

    // stars, shooting stars, galaxy, planet
    this.stars[0].material instanceof THREE.PointsMaterial && (this.stars[0].material.opacity = night * (0.7 + Math.sin(t * 1.7) * 0.2));
    this.stars[1].material instanceof THREE.PointsMaterial && (this.stars[1].material.opacity = night * (0.6 + Math.sin(t * 2.3 + 1) * 0.3));
    (this.galaxy.material as THREE.PointsMaterial).opacity = space;
    this.galaxy.rotation.y = t * 0.04;
    this.planet.visible = space > 0.05;
    this.planet.rotation.y = t * 0.05;
    this.updateShootingStar(t, dt, night);

    // camera: follow the climber, then lift off into space
    const a = climb * Math.PI * 2.2 + 0.2;
    const camBack = 16 - climb * 5;
    this.camPos.set(
      cp.x * 0.45 + Math.sin(a) * 2 + mouse.x * 1.2,
      cp.y + 4.5 + climb * 5 + space * 38 - mouse.y * 0.8,
      cp.z + camBack,
    );
    this.camera.position.lerp(this.camPos, 0.12);
    const peakY = heightAt(0, PEAK_Z);
    this.lookAt.set(mouse.x * 2, peakY * (0.45 + climb * 0.55) + space * 105, PEAK_Z - space * 20);
    this.camera.lookAt(this.lookAt);

    if (this.bloom) this.bloom.strength = 0.25 + night * 0.6;
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  private updateShootingStar(t: number, dt: number, night: number) {
    const m = this.shooting.material as THREE.LineBasicMaterial;
    if (this.shootT < 0) {
      if (night > 0.6 && Math.random() < dt * 0.35) this.shootT = 0;
      m.opacity = 0;
      return;
    }
    this.shootT += dt * 1.4;
    const s = new THREE.Vector3(-120 + ((t * 37) % 80), 120, -200);
    const dir = new THREE.Vector3(1, -0.45, 0).normalize();
    const head = s.clone().addScaledVector(dir, this.shootT * 160);
    const tail = head.clone().addScaledVector(dir, -22);
    const pos = this.shooting.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, tail.x, tail.y, tail.z);
    pos.setXYZ(1, head.x, head.y, head.z);
    pos.needsUpdate = true;
    m.opacity = Math.sin(Math.min(1, this.shootT) * Math.PI) * night;
    if (this.shootT > 1) this.shootT = -1;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
  }

  dispose() {
    this.renderer.dispose();
    this.composer?.dispose();
  }
}
