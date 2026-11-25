import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadDetective, POSE } from './detective.js';
import { initChapters } from './chapters.js';
import { initEggs } from './eggs.js';

const $ = (id) => document.getElementById(id);
const cv = $('cv');
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, 1.75));
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;
const S = new THREE.Scene(); S.background = new THREE.Color(0x05070d);
S.fog = new THREE.FogExp2(0x090d1a, 0.055);
const cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 80);

/* ---------------- loading ---------------- */
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, a, b) => { $('lbar').style.width = (a / b * 100) + '%'; };
const texL = new THREE.TextureLoader(manager);
const A = './assets/';
function tex(name, srgb) {
  const t = texL.load(A + name); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = R.capabilities.getMaxAnisotropy(); return t;
}

/* ---------------- baked material ---------------- */
const lamp = { v: 0 };
const bakedUniforms = [];
function bakedMat(albedo, lmOn, lmOff, exposure = 1) {
  const u = {
    albedo: { value: albedo }, lmOn: { value: lmOn }, lmOff: { value: lmOff },
    k: { value: 0 }, exposure: { value: exposure },
    fogColor: { value: S.fog.color }, fogDensity: { value: S.fog.density },
  };
  bakedUniforms.push(u);
  return new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying float vFogDepth;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D albedo, lmOn, lmOff; uniform float k, exposure; uniform vec3 fogColor; uniform float fogDensity;
      varying vec2 vUv; varying float vFogDepth;
      vec3 dec(vec3 c){ return pow(c, vec3(2.2)) * 8.0; }
      void main(){
        vec3 a = texture2D(albedo, vUv).rgb;
        vec3 l = mix(dec(texture2D(lmOff, vUv).rgb), dec(texture2D(lmOn, vUv).rgb), k);
        vec3 c = a * l * exposure;
        float f = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        c = mix(c, fogColor, clamp(f, 0., 1.));
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/* ---------------- world ---------------- */
const world = { neonMats: [], ready: false };
const gl = new GLTFLoader(manager);
gl.load(A + 'office.glb', (g) => {
  const T = {
    ext: [tex('ext_albedo.jpg', true), tex('ext_on.png'), tex('ext_on.png')],
    room: [tex('room_albedo.jpg', true), tex('room_on.png'), tex('room_off.png')],
    props: [tex('props_albedo.jpg', true), tex('props_on.png'), tex('props_off.png')],
  };
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const key = Object.keys(T).find((k) => o.name.startsWith(k) || o.parent?.name?.startsWith(k));
    if (key) {
      o.material = bakedMat(...T[key], key === 'ext' ? 1.3 : 1.35);
      if (key !== 'ext') {
        const sc = new THREE.Mesh(o.geometry, new THREE.ShadowMaterial({ opacity: .55, color: 0x05060c, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
        sc.position.copy(o.position); sc.quaternion.copy(o.quaternion); sc.scale.copy(o.scale); sc.receiveShadow = true;
        o.parent.add(sc);
      }
    } else {
      const m = o.material; m.emissiveIntensity = 6; m.toneMapped = true; world.neonMats.push(m);
    }
  });
  S.add(g.scene);
});

/* front door (live, so it can swing open) */
{
  const pivot = new THREE.Group(); pivot.position.set(-.6, 0, -.03); S.add(pivot); world.door = pivot;
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: .55 });
  const d = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.34, .06), wood); d.position.set(.6, 1.17, 0); pivot.add(d);
  for (const y of [.45, 1.0]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.9, .4, .02), wood); p.position.set(.6, y, .04); pivot.add(p); }
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#d9c39a'; x.fillRect(0, 0, 512, 512); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 4000; i++) x.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  x.fillStyle = '#17100a'; x.textAlign = 'center'; x.font = 'bold 58px "Courier New"'; x.fillText('L. PORWAL', 256, 220);
  x.font = '30px "Courier New"'; x.fillText('INVESTIGATIONS', 256, 280); x.fillRect(90, 310, 332, 3); x.font = '22px "Courier New"'; x.fillText('AI · ML · MLOPS', 256, 350);
  const gt = new THREE.CanvasTexture(c); gt.colorSpace = THREE.SRGBColorSpace;
  world.doorGlass = new THREE.MeshStandardMaterial({ map: gt, roughness: .2, emissive: 0xffa860, emissiveMap: gt, emissiveIntensity: .25, transparent: true, opacity: .93 });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(.86, .74), world.doorGlass); g.position.set(.6, 1.68, .035); pivot.add(g);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: .25, metalness: 1 })); knob.position.set(1.07, 1.05, .06); pivot.add(knob);
  const doorLight = new THREE.PointLight(0xffb070, 3, 6, 1.5); doorLight.position.set(1.6, 3, 2.2); S.add(doorLight);
  const neonLight = new THREE.PointLight(0xff3d7f, 2.5, 5, 1.5); neonLight.position.set(0, 3, 1.2); S.add(neonLight);
}

/* city backdrop beyond the office window */
{
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#05070e'; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 26; i++) {
    const w = 40 + Math.random() * 70, h = 160 + Math.random() * 300, bx = Math.random() * 1024;
    x.fillStyle = `rgb(${10 + Math.random() * 8},${12 + Math.random() * 8},${22 + Math.random() * 10})`; x.fillRect(bx, 512 - h, w, h);
    for (let yy = 512 - h + 10; yy < 500; yy += 14) for (let xx = bx + 6; xx < bx + w - 8; xx += 12) if (Math.random() < .28) {
      x.fillStyle = Math.random() < .8 ? `rgba(255,${170 + Math.random() * 60},90,${.5 + Math.random() * .5})` : 'rgba(150,190,255,.7)'; x.fillRect(xx, yy, 5, 7);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: t, fog: false, color: 0x8899bb }));
  m.position.set(-11, 2.2, -4.8); m.rotation.y = Math.PI / 2; S.add(m);
}

/* ---------------- live lights (character only) ---------------- */
const DZ = -4.6;
const hemi = new THREE.HemisphereLight(0x3a4870, 0x120c08, .35); S.add(hemi);
const lampL = new THREE.SpotLight(0xffa860, 0, 6, 1.0, .7, 1.4);
lampL.position.set(.85, 1.17, DZ - .1); lampL.target.position.set(0, 1.2, -5.25);
lampL.castShadow = true; lampL.shadow.mapSize.set(2048, 2048); lampL.shadow.bias = -.0005; lampL.shadow.normalBias = .02; lampL.shadow.radius = 6;
S.add(lampL, lampL.target);
const lampFill = new THREE.PointLight(0xff9a50, 0, 4, 1.8); lampFill.position.set(.3, 1.0, DZ + .2); S.add(lampFill);
// moonlight through blinds: gobo with slats + sliding raindrops
const gob = document.createElement('canvas'); gob.width = gob.height = 512; const gc = gob.getContext('2d');
const drops = Array.from({ length: 60 }, () => ({ x: Math.random() * 512, y: Math.random() * 512, r: 3 + Math.random() * 6, v: .2 + Math.random() * 1.4, st: Math.random() }));
const gobT = new THREE.CanvasTexture(gob); gobT.colorSpace = THREE.SRGBColorSpace;
function drawGobo() {
  gc.fillStyle = '#000'; gc.fillRect(0, 0, 512, 512);
  gc.fillStyle = '#fff'; for (let y = 0; y < 512; y += 30) gc.fillRect(0, y, 512, 17);
  for (const d of drops) {
    d.st -= .01; if (d.st < 0) { d.y += d.v; if (Math.random() < .01) d.st = Math.random() * 1.2; }
    if (d.y > 530) { d.y = -20; d.x = Math.random() * 512; }
    gc.fillStyle = 'rgba(0,0,0,.5)'; gc.beginPath(); gc.ellipse(d.x, d.y, d.r * .8, d.r, 0, 0, 7); gc.fill();
    if (d.v > .7) { gc.fillStyle = 'rgba(0,0,0,.25)'; gc.fillRect(d.x - d.r * .3, d.y - d.r * 6, d.r * .6, d.r * 5); }
  }
  gobT.needsUpdate = true;
}
const moon = new THREE.SpotLight(0x8aa6ff, 18, 14, .32, .2, 1.0);
moon.position.set(-7.5, 3.4, -4.6); moon.target.position.set(.5, 1.0, -5.2); moon.map = gobT;
moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -.0004; moon.shadow.camera.near = 2;
S.add(moon, moon.target);

/* ---------------- detective ---------------- */
const det = loadDetective(THREE, manager, A + 'detective.glb', POSE);
det.root.position.set(0, 0, -5.5); S.add(det.root);
const rim = new THREE.SpotLight(0x9fb6ff, 6, 6, .6, .8, 1.5); rim.position.set(-1.2, 2.6, -6.6); rim.target.position.set(0, 1.3, -5.4); S.add(rim, rim.target);

/* ---------------- rain ---------------- */
const RN = 3000, rp = new Float32Array(RN * 6), rv = new Float32Array(RN);
function rainPos(i, y) {
  const outside = Math.random() < .8;
  const x = outside ? (Math.random() - .5) * 18 : -4.4 - Math.random() * 5;
  const z = outside ? Math.random() * 10 - .4 : -2.5 - Math.random() * 5;
  rp.set([x, y, z, x + .02, y + .3, z], i * 6);
}
for (let i = 0; i < RN; i++) { rainPos(i, Math.random() * 8); rv[i] = 7 + Math.random() * 4; }
const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
S.add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xa9bcff, transparent: true, opacity: .22 })));
const splashes = Array.from({ length: 50 }, () => {
  const m = new THREE.Mesh(new THREE.RingGeometry(.02, .045, 20), new THREE.MeshBasicMaterial({ color: 0xc0ceff, transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; S.add(m); return { m, t: 1 };
});
// light cone under the street lamp
const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.8, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: .012, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
cone.position.set(1.92, 1.9, 2.4); S.add(cone);
const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe0b0 })); lampGlow.position.set(1.92, 3.82, 2.4); S.add(lampGlow);
// warm bulb inside the banker's lamp
const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(.025, .16, 4, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
bulb.rotation.z = Math.PI / 2; bulb.position.set(.85, 1.19, DZ - .1); S.add(bulb);
// dust in the moonbeam
const DN = 90, dp = new Float32Array(DN * 3);
for (let i = 0; i < DN; i++) dp.set([-3.8 + Math.random() * 4.2, .8 + Math.random() * 1.9, -5.8 + Math.random() * 2.1], i * 3);
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
S.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xb8c8ff, size: .01, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false })));

/* ---------------- post ---------------- */
const comp = new EffectComposer(R);
comp.addPass(new RenderPass(S, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .5, .92); comp.addPass(bloom);
comp.addPass(new OutputPass());
function size() {
  const w = innerWidth, h = innerHeight; R.setSize(w, h, false); comp.setSize(w, h);
  cam.aspect = w / h; cam.fov = w / h < 1 ? 62 : 40; cam.updateProjectionMatrix();
}
size(); addEventListener('resize', size);
{ // film grain
  const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'); const d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ---------------- audio ---------------- */
let ac, master, rainG, muted = false;
function audio() {
  if (ac) return;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination);
    const n = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = n; src.loop = true;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    rainG = ac.createGain(); rainG.gain.value = .13; src.connect(hp).connect(lp).connect(rainG).connect(master); src.start();
  } catch (e) { /* no audio */ }
}
function tick(f = 1800, t = .05, v = .2, type = 'square') {
  if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + t); o.connect(g).connect(master); o.start(); o.stop(ac.currentTime + t);
}
function creak() {
  if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(150, ac.currentTime); o.frequency.linearRampToValueAtTime(85, ac.currentTime + 1);
  f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 9;
  g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(.07, ac.currentTime + .1); g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.1);
  o.connect(f).connect(g).connect(master); o.start(); o.stop(ac.currentTime + 1.2);
}
function paper() {
  if (!ac) return; const n = ac.createBuffer(1, ac.sampleRate * .35, ac.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const s = ac.createBufferSource(); s.buffer = n; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = .6;
  const g = ac.createGain(); g.gain.value = .25; s.connect(f).connect(g).connect(master); s.start();
}
function slide() { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, ac.currentTime); o.frequency.linearRampToValueAtTime(50, ac.currentTime + .6);
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; g.gain.setValueAtTime(.12, ac.currentTime); g.gain.linearRampToValueAtTime(0, ac.currentTime + .7); o.connect(f).connect(g).connect(master); o.start(); o.stop(ac.currentTime + .75); }
function thud() { tick(90, .25, .5, 'sine'); tick(140, .12, .25, 'triangle'); }

/* ---------------- story ---------------- */
const START = { px: -.7, py: 1.55, pz: 9, lx: 0, ly: 1.95, lz: 0 };
const shot = { ...START };
let state = 'street', headDown = 1;
const BIO = 'AI/ML engineer, Indore.\n\nI build AI that survives production: LLMs, RAG, and the MLOps that keeps them honest.\n\nTwo years. Four firms. Every case closed.';
let typer, typing = false;
function typeIt() {
  clearInterval(typer); $('type').textContent = ''; let i = 0; typing = true;
  typer = setInterval(() => {
    $('type').textContent = BIO.slice(0, ++i);
    if (BIO[i - 1] && BIO[i - 1].trim() && i % 2) tick(2300 + Math.random() * 500, .018, .04);
    if (i >= BIO.length) { clearInterval(typer); typing = false; gsap.to('#stamp', { opacity: 1, scale: 1, duration: .25, ease: 'power4.in', onComplete: () => { thud(); setTimeout(() => chapters.start(), 700); } }); }
  }, 34);
}
function flickOn() {
  const L = { v: 0 };
  gsap.timeline({ onUpdate: () => { lamp.v = L.v; } })
    .to(L, { v: .7, duration: .04 }).to(L, { v: .05, duration: .07 }).to(L, { v: .9, duration: .05 })
    .to(L, { v: .25, duration: .1 }).to(L, { v: 1, duration: .35, ease: 'power2.out' });
  const H = { h: 1 }; gsap.to(H, { h: 0, duration: 1, delay: .9, ease: 'power2.out', onUpdate: () => { headDown = H.h; } });
}
function enter() {
  if (state !== 'street') return; state = 'moving'; audio();
  gsap.to('#street', { opacity: 0, duration: .5, onComplete: () => { $('street').style.pointerEvents = 'none'; } });
  gsap.timeline()
    .to(shot, { px: 0, py: 1.5, pz: 2.4, lx: 0, ly: 1.4, lz: -2, duration: 2.6, ease: 'power2.inOut' })
    .add(creak, '-=.7')
    .to(world.door?.rotation || {}, { y: 1.7, duration: 1.4, ease: 'power2.inOut' }, '-=.8')
    .to(shot, { px: .1, py: 1.5, pz: -2.2, lx: 0, ly: 1.22, lz: -5.3, duration: 3, ease: 'power2.inOut' }, '-=.4')
    .to(S.fog, { density: .02, duration: 2.4 }, '<')
    .add(() => { state = 'office'; if (rainG) rainG.gain.linearRampToValueAtTime(.05, ac.currentTime + 1.5); })
    .add(() => { tick(700, .07, .35); flickOn(); }, '+=.6')
    .add(() => {
      gsap.to('#note', { opacity: 1, y: 0, duration: .9, ease: 'power3.out' });
      gsap.to(['#hint', '#tools'], { opacity: 1, duration: .8, delay: 1.2 });
      typeIt();
    }, '+=1.1');
}
$('enter').onclick = enter;
$('replay').onclick = () => {
  chapters.reset(); gsap.killTweensOf(shot);
  clearInterval(typer); gsap.killTweensOf(shot); Object.assign(shot, START);
  lamp.v = 0; headDown = 1; S.fog.density = .055; state = 'street';
  gsap.set('#note', { opacity: 0, y: 16 }); gsap.set('#stamp', { opacity: 0, scale: 2 }); gsap.set(['#hint', '#tools'], { opacity: 0 });
  $('street').style.pointerEvents = 'auto'; gsap.to('#street', { opacity: 1, duration: .6 });
};
$('mute').onclick = () => { muted = !muted; if (master) master.gain.value = muted ? 0 : 1; $('mute').textContent = muted ? 'SOUND OFF' : 'SOUND ON'; };
gsap.set('#note', { y: 16 });
const chapters = initChapters({ THREE, S, cam, shot, gsap, R, sfx: { tick, thud, paper, slide } });
const eggs = initEggs({ THREE, S, cam, lamp, gsap, det, chapters, sfx: { tick, thud }, setHead: (h) => gsap.to({ h: headDown }, { h, duration: .8, onUpdate() { headDown = this.targets()[0].h; } }), getState: () => state, steam: (ms) => chapters.steam(ms) });
{ const d = new Date(); $('clock').textContent = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).toUpperCase(); }

let mx = 0, my = 0, smx = 0, smy = 0;
addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1); });

manager.onLoad = () => {
  world.ready = true;
  gsap.to('#loader', { opacity: 0, duration: 1, delay: .3, onComplete: () => $('loader').remove() });
  gsap.to('#street', { opacity: 1, duration: 1.2, delay: 1 });
};

/* ---------------- loop ---------------- */
const clock = new THREE.Clock(); let si = 0;
const look = new THREE.Vector3();
function loop() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  smx += (mx - smx) * .05; smy += (my - smy) * .05;
  const pa = rg.attributes.position.array;
  for (let i = 0; i < RN; i++) {
    const k = i * 6, dy = rv[i] * dt; pa[k + 1] -= dy; pa[k + 4] -= dy;
    if (pa[k + 1] < .02) {
      if (pa[k + 2] > -.3 && Math.random() < .1) { const s = splashes[si++ % splashes.length]; s.m.position.set(pa[k], .17, pa[k + 2]); s.t = 0; }
      rainPos(i, 7 + Math.random());
    }
  }
  rg.attributes.position.needsUpdate = true;
  for (const s of splashes) { s.t = Math.min(1, s.t + dt * 2.6); s.m.scale.setScalar(.4 + s.t * 2.2); s.m.material.opacity = (1 - s.t) * .55; }
  const fl = Math.random() < .015 ? .12 : 1;
  for (const m of world.neonMats) m.emissiveIntensity = 6 * fl * (.94 + Math.sin(t * 40) * .06);
  drawGobo();
  const dpa = dg.attributes.position.array;
  for (let i = 0; i < DN; i++) { dpa[i * 3] += Math.sin(t * .3 + i) * .0005; dpa[i * 3 + 1] += Math.cos(t * .21 + i * 1.7) * .0004; }
  dg.attributes.position.needsUpdate = true;
  for (const u of bakedUniforms) { u.k.value = lamp.v; u.fogDensity.value = S.fog.density; }
  if (world.doorGlass) world.doorGlass.emissiveIntensity = .25 + lamp.v * .6;
  lampL.intensity = lamp.v * 9; lampFill.intensity = lamp.v * 1.4;
  bulb.material.color.setRGB(lamp.v * 6, lamp.v * 3.6, lamp.v * 1.6);
  det.update(t, dt, {
    yaw: state === 'office' ? smx * .6 : 0,
    pitch: headDown * .9 + (state === 'office' ? -smy * .35 : 0),
    typing: typing ? 1 : 0,
  });
  const sway = state === 'office' ? 1 : 0;
  cam.position.set(shot.px + smx * .2 * sway, shot.py + smy * .08 * sway + Math.sin(t * .45) * .008, shot.pz);
  look.set(shot.lx + smx * .14, shot.ly, shot.lz); cam.lookAt(look);
  chapters.update(t); eggs.update();
  $('grain').style.transform = `translate(${(Math.random() * 24) | 0}px,${(Math.random() * 24) | 0}px)`;
  comp.render(); requestAnimationFrame(loop);
}
loop();
window.__case = { shot, lamp, S, cam, det, POSE, chapters, setState: (s) => { state = s; }, head: (h) => { headDown = h; } };
