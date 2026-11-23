import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

/*
 * The Expedition — a real-data 3D scene.
 *  • Elevation: AWS Terrain Tiles (Terrarium encoding), zoom 12, 3×3 tiles around Ama Dablam
 *  • Imagery:   Esri World Imagery, zoom 14 for the whole area + zoom 15 detail around the summit
 *  • Sky:       Poly Haven HDRI (CC0), also used for lighting
 * 1 world unit = 10 m.
 */

const Z = 12, X0 = 3035, Y0 = 1716, N = 3;
const PX = 256 * N;
const LAT_C = 27.86;
const TILE_M = (40075016 * Math.cos((LAT_C * Math.PI) / 180)) / 4096;
export const WORLD = (TILE_M * N) / 10;

const ELEV_URL = (x: number, y: number) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`;
const IMG_URL = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const HDR_URL = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/kloppenheim_06_puresky_2k.hdr";

export function latLonToWorld(lat: number, lon: number): [number, number] {
  const tx = ((lon + 180) / 360) * 4096 - X0;
  const r = (lat * Math.PI) / 180;
  const ty = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 4096 - Y0;
  return [(tx / N - 0.5) * WORLD, (ty / N - 0.5) * WORLD];
}

const loadImg = (url: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });

async function loadWithRetry(url: string, tries = 3) {
  for (let k = 0; k < tries; k++) {
    try { return await loadImg(url); } catch { await new Promise((r) => setTimeout(r, 400 * (k + 1))); }
  }
  return null;
}

/* ───────── camera route: one waypoint per section (00 → 14) ───────── */

type Waypoint = { p: [number, number, number]; t: [number, number, number]; name: string };
export const ROUTE: Waypoint[] = [
  { p: [27.854, 86.788, 4380], t: [27.8617, 86.8614, 6300], name: "Pangboche, Khumbu" },              // 00
  { p: [27.851, 86.794, 4450], t: [27.8617, 86.8614, 6250], name: "Pangboche trailhead" },            // 01 (photo)
  { p: [27.849, 86.799, 4550], t: [27.8617, 86.8614, 6200], name: "Imja Khola valley" },              // 02 (photo)
  { p: [27.847, 86.805, 4700], t: [27.8617, 86.8614, 6250], name: "Imja Khola valley" },              // 03
  { p: [27.843, 86.817, 5000], t: [27.8617, 86.8614, 6300], name: "Trail to Ama Dablam Base Camp" },  // 04
  { p: [27.840, 86.830, 5400], t: [27.8617, 86.8614, 6400], name: "Ama Dablam Base Camp" },           // 05
  { p: [27.842, 86.840, 6000], t: [27.8617, 86.8614, 6600], name: "Camp 1 · SW ridge" },              // 06
  { p: [27.844, 86.842, 6300], t: [27.8617, 86.8614, 6650], name: "Camp 1 · night" },                 // 07 (photo)
  { p: [27.8457, 86.8434, 6700], t: [27.8617, 86.8614, 6750], name: "Camp 2 · Yellow Tower" },        // 08
  { p: [27.848, 86.846, 7000], t: [27.8617, 86.8614, 6780], name: "Camp 3 · kitchen" },               // 09 (photo)
  { p: [27.852, 86.852, 7600], t: [27.864, 86.865, 6700], name: "Summit · 6,812 m" },                 // 10
  { p: [27.847, 86.842, 11000], t: [27.87, 86.875, 7000], name: "Above Ama Dablam" },                 // 11
  { p: [27.83, 86.825, 17000], t: [27.9, 86.9, 11000], name: "Stratosphere" },                        // 12
  { p: [27.815, 86.81, 22000], t: [27.92, 86.93, 16000], name: "Edge of space" },                     // 13
  { p: [27.8, 86.8, 26000], t: [27.93, 86.94, 19000], name: "Signal home" },                          // 14
];

/* ───────── scene ───────── */

export type LoadProgress = (fraction: number, label: string) => void;

export class ExpeditionScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private low: boolean;
  private elev = new Float32Array(PX * PX);
  private hasElev = false;
  private terrain?: THREE.Mesh;
  private floor?: THREE.Mesh;
  private stars: THREE.Points;
  private voidSphere: THREE.Mesh;
  private spaceU = { value: 0 };
  private fogDay = new THREE.Color("#b9c8dc");
  private fogDusk = new THREE.Color("#d9b49a");
  private black = new THREE.Color("#02030a");
  private camCurve: THREE.CatmullRomCurve3;
  private tgtCurve: THREE.CatmullRomCurve3;
  private cp = new THREE.Vector3();
  private tp = new THREE.Vector3();
  private look = new THREE.Vector3();
  altitude = 0;
  place = ROUTE[0].name;

  constructor(canvas: HTMLCanvasElement, low: boolean) {
    this.low = low;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.25 : 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 40000);
    this.scene.background = new THREE.Color("#9fbad8");
    this.scene.fog = new THREE.FogExp2(this.fogDay.clone(), 0.00042);

    const sun = new THREE.DirectionalLight("#fff1dc", 2.2);
    sun.position.set(-1200, 900, 600);
    this.scene.add(sun, new THREE.HemisphereLight("#cfe0ff", "#3a3530", 0.35));

    const sp: number[] = [];
    for (let i = 0; i < (low ? 3000 : 6000); i++) {
      const u = Math.random() * 2 * Math.PI, v = Math.acos(2 * Math.random() - 1), r = 30000;
      sp.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({
      color: "#ffffff", size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false,
    }));
    this.voidSphere = new THREE.Mesh(
      new THREE.SphereGeometry(35000, 32, 16),
      new THREE.MeshBasicMaterial({ color: "#02030a", side: THREE.BackSide, transparent: true, opacity: 0, fog: false, depthWrite: false }),
    );
    this.voidSphere.renderOrder = -1;
    this.scene.add(this.voidSphere, this.stars);

    const toV = ([lat, lon, alt]: [number, number, number]) => {
      const [x, z] = latLonToWorld(lat, lon);
      return new THREE.Vector3(x, alt / 10, z);
    };
    this.camCurve = new THREE.CatmullRomCurve3(ROUTE.map((r) => toV(r.p)), false, "centripetal");
    this.tgtCurve = new THREE.CatmullRomCurve3(ROUTE.map((r) => toV(r.t)), false, "centripetal");
    this.camera.position.copy(this.camCurve.getPoint(0));
    this.look.copy(this.tgtCurve.getPoint(0));
  }

  heightAt(x: number, z: number) {
    if (!this.hasElev) return 0;
    const e = this.elev;
    const u = (x / WORLD + 0.5) * (PX - 1), v = (z / WORLD + 0.5) * (PX - 1);
    const x0 = Math.max(0, Math.min(PX - 2, Math.floor(u))), y0 = Math.max(0, Math.min(PX - 2, Math.floor(v)));
    const fx = Math.min(1, Math.max(0, u - x0)), fy = Math.min(1, Math.max(0, v - y0));
    return (
      e[y0 * PX + x0] * (1 - fx) * (1 - fy) + e[y0 * PX + x0 + 1] * fx * (1 - fy) +
      e[(y0 + 1) * PX + x0] * (1 - fx) * fy + e[(y0 + 1) * PX + x0 + 1] * fx * fy
    );
  }

  /** Downloads terrain, imagery and sky. Reports progress 0 → 1. */
  async load(onProgress: LoadProgress) {
    const hdrP = new HDRLoader().loadAsync(HDR_URL).catch(() => null);

    const ec = document.createElement("canvas");
    ec.width = ec.height = PX;
    const ex = ec.getContext("2d", { willReadFrequently: true })!;
    let done = 0;
    await Promise.all(
      [...Array(N * N)].map(async (_, k) => {
        const i = k % N, j = Math.floor(k / N);
        const img = await loadWithRetry(ELEV_URL(X0 + i, Y0 + j));
        if (img) ex.drawImage(img, i * 256, j * 256);
        onProgress((++done / (N * N)) * 0.25, "Loading real terrain of Ama Dablam");
      }),
    );
    const d = ex.getImageData(0, 0, PX, PX).data;
    for (let i = 0; i < PX * PX; i++) this.elev[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
    this.hasElev = true;

    const bz = this.low ? 13 : 14, bm = 2 ** (bz - Z), bn = N * bm;
    const base = await this.mosaic(bz, X0 * bm, Y0 * bm, bn, (f) => onProgress(0.25 + f * 0.45, "Loading satellite imagery"));
    let detail: THREE.Texture | null = null;
    if (!this.low) {
      const dz = 15, dm = 2 ** (dz - Z);
      detail = await this.mosaic(dz, (X0 + 1) * dm, (Y0 + 1) * dm, dm, (f) => onProgress(0.7 + f * 0.2, "Sharpening the summit"));
    }

    onProgress(0.92, "Lighting the sky");
    const hdr = await hdrP;
    if (hdr) {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = hdr;
      this.scene.environment = hdr;
      this.scene.backgroundIntensity = 0.9;
      this.scene.environmentIntensity = 0.55;
    }

    this.buildTerrain(base, detail);
    onProgress(1, "Ready");
  }

  private async mosaic(z: number, x0: number, y0: number, n: number, onP: (f: number) => void) {
    const c = document.createElement("canvas");
    c.width = c.height = 256 * n;
    const cx = c.getContext("2d")!;
    const jobs: [number, number][] = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) jobs.push([i, j]);
    let done = 0;
    const total = jobs.length;
    const worker = async () => {
      while (jobs.length) {
        const [i, j] = jobs.shift()!;
        const img = await loadWithRetry(IMG_URL(z, x0 + i, y0 + j), 2);
        if (img) cx.drawImage(img, i * 256, j * 256);
        onP(++done / total);
      }
    };
    await Promise.all([...Array(10)].map(worker));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  private buildTerrain(base: THREE.Texture, detail: THREE.Texture | null) {
    const seg = this.low ? 255 : 383;
    const g = new THREE.PlaneGeometry(WORLD, WORLD, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, this.heightAt(pos.getX(i), pos.getZ(i)) / 10);
    g.computeVertexNormals();

    const m = new THREE.MeshStandardMaterial({ map: base, roughness: 0.96, metalness: 0 });
    const half = WORLD / 6;
    const uniforms = {
      uSpace: this.spaceU,
      uDetail: { value: detail },
      uHasDetail: { value: detail ? 1 : 0 },
      uDMin: { value: new THREE.Vector2(-half, -half) },
      uDMax: { value: new THREE.Vector2(half, half) },
    };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = "varying vec3 vWp;\n" + sh.vertexShader.replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
      sh.fragmentShader =
        "uniform float uSpace; uniform sampler2D uDetail; uniform float uHasDetail; uniform vec2 uDMin; uniform vec2 uDMax; varying vec3 vWp;\n" +
        sh.fragmentShader
          .replace(
            "#include <map_fragment>",
            `#ifdef USE_MAP
              vec4 sampledDiffuseColor = texture2D( map, vMapUv );
              vec2 du = (vWp.xz - uDMin) / (uDMax - uDMin);
              if (uHasDetail > 0.5 && du.x > 0.0 && du.x < 1.0 && du.y > 0.0 && du.y < 1.0) {
                vec4 dc = texture2D(uDetail, vec2(du.x, 1.0 - du.y));
                float e = min(min(du.x, 1.0 - du.x), min(du.y, 1.0 - du.y));
                sampledDiffuseColor = mix(sampledDiffuseColor, dc, smoothstep(0.0, 0.06, e));
              }
              diffuseColor *= sampledDiffuseColor;
            #endif`,
          )
          .replace(
            "#include <fog_fragment>",
            `#include <fog_fragment>
             float ed = length(vWp.xz) / ${(WORLD / 2).toFixed(1)};
             gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.008, 0.01, 0.02), uSpace * smoothstep(0.55, 0.98, ed));`,
          );
    };
    this.terrain = new THREE.Mesh(g, m);
    this.scene.add(this.terrain);

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshBasicMaterial({ color: this.fogDay.clone() }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 300;
    this.scene.add(this.floor);
  }

  /** p: 0 → 1 across the page, mouse: −1 → 1 */
  render(p: number, mouse: { x: number; y: number }) {
    const t = Math.min(1, Math.max(0, p));
    this.camCurve.getPoint(t, this.cp);
    this.tgtCurve.getPoint(t, this.tp);
    if (this.hasElev) {
      const g = this.heightAt(this.cp.x, this.cp.z) / 10 + 60;
      if (this.cp.y < g) this.cp.y = g;
    }
    this.cp.x += mouse.x * 15;
    this.cp.y -= mouse.y * 8;
    this.camera.position.lerp(this.cp, 0.12);
    this.look.lerp(this.tp, 0.12);
    this.camera.lookAt(this.look);

    const altM = this.camera.position.y * 10;
    this.altitude = altM;
    this.place = ROUTE[Math.min(ROUTE.length - 1, Math.round(t * (ROUTE.length - 1)))].name;

    const space = Math.min(1, Math.max(0, (altM - 9000) / 14000));
    const dusk = Math.min(1, Math.max(0, (p - 0.35) / 0.35)) * (1 - space);
    (this.voidSphere.material as THREE.MeshBasicMaterial).opacity = space;
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, space * 1.2 - 0.1);
    const fog = this.scene.fog as THREE.FogExp2;
    fog.density = 0.00042 * (1 - space) + 0.00002;
    fog.color.copy(this.fogDay).lerp(this.fogDusk, dusk * 0.45).lerp(this.black, space);
    this.renderer.toneMappingExposure = 0.85 - space * 0.25 - dusk * 0.06;
    this.spaceU.value = space;
    if (this.floor) {
      this.floor.visible = space < 0.05;
      (this.floor.material as THREE.MeshBasicMaterial).color.copy(fog.color);
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    this.renderer.dispose();
  }
}

/** Water's boiling point drops about 1 °C every ~300 m. */
export const boilingPoint = (altM: number) => 100 - altM * 0.00335;
