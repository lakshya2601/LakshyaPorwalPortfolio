// The evidence on the desk: Indore map with markings, Rakesh's papers, the soaked card, ticket, receipt,
// press ID, fake jeeravan packet, his stopped wristwatch, Asha's phone and the office rotary phone.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export function buildEvidence(THREE, S, manager) {
  const P = './assets/props/';
  const group = new THREE.Group(); group.visible = false; S.add(group);
  const tl = new THREE.TextureLoader(manager);
  const tex = (n) => { const t = tl.load(P + n); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const TOP = .832;
  const items = {};
  // paper with a gentle curl; w,h in metres; lies flat on the desk
  function sheet(id, file, w, h, x, z, rot, lift = 0, curl = .006, opts = {}) {
    const g = new THREE.PlaneGeometry(w, h, 24, 24); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / w, v = p.getY(i) / h;
      p.setZ(i, Math.sin((u + .5) * Math.PI) * curl * .3 + Math.pow(Math.abs(v), 3) * curl + Math.sin(u * 7 + v * 5) * curl * .15);
    }
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ map: tex(file), roughness: opts.rough ?? .92, metalness: 0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g, m); mesh.rotation.set(-Math.PI / 2, 0, rot); mesh.position.set(x, TOP + lift, z);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.id = id; group.add(mesh); items[id] = mesh; return mesh;
  }
  sheet('map', 'map.jpg', .62, .44, -.5, -4.76, .06, 0, .004);
  sheet('story', 'story.jpg', .21, .297, -.24, -4.5, -.22, .004, .008);
  sheet('notebook', 'notebook.jpg', .15, .21, -.03, -4.29, .14, .003, .004);
  sheet('bizcard', 'bizcard.jpg', .09, .052, -.42, -4.3, -.4, .006, .002, { rough: .75 });
  sheet('ticket', 'ticket.jpg', .045, .096, -.6, -4.32, .5, .005, .003);
  sheet('receipt', 'receipt.jpg', .06, .126, -.33, -4.18, .25, .003, .009);
  sheet('pressid', 'pressid.jpg', .086, .055, -.7, -4.5, -.15, .007, .0005, { rough: .25 });
  // jeeravan packet: a soft pillow
  const pk = new THREE.BoxGeometry(.1, .145, .016, 8, 8, 2); const pp = pk.attributes.position;
  for (let i = 0; i < pp.count; i++) { const x = pp.getX(i) / .05, y = pp.getY(i) / .0725, z = pp.getZ(i); pp.setZ(i, z * (1 - .55 * (x * x) ) * (1 - .4 * y * y)); }
  pk.computeVertexNormals();
  const pkm = [new THREE.MeshStandardMaterial({ color: 0x8a1a12, roughness: .35 })]; const front = new THREE.MeshStandardMaterial({ map: tex('packet.jpg'), roughness: .3, metalness: .05 });
  const packet = new THREE.Mesh(pk, [pkm[0], pkm[0], pkm[0], pkm[0], front, pkm[0]]); packet.rotation.set(-Math.PI / 2, 0, .35); packet.position.set(-.13, TOP + .008, -4.17);
  packet.castShadow = true; packet.userData.id = 'packet'; group.add(packet); items.packet = packet;
  // 3D models
  const gl = new GLTFLoader(manager); gl.setMeshoptDecoder(MeshoptDecoder);
  const model = (id, file, x, z, ry, s = 1, y = TOP) => gl.load(P + file, (g) => {
    const o = g.scene; o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s);
    o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; c.userData.id = id; if (c.material.map) c.material.map.anisotropy = 8;
      if (id === 'watch') { const m = c.material; m.roughness = Math.max(m.roughness, .38); if (m.metalness > .5) m.color.multiplyScalar(.45); if (m.transparent) m.opacity = Math.min(m.opacity, .2); else if (m.metalness < .5) m.color.multiplyScalar(.55); m.emissiveIntensity = 0; } } });
    group.add(o); items[id] = o;
  });
  model('phone', 'rotary_phone.glb', -.98, -4.92, .35, 1.15, .823);
  model('watch', 'watch.glb', .19, -4.2, .8, 1.2);
  model('asha', 'asha_phone.glb', -.5, -4.19, .35, 1.1);
  // warm light from the banker's lamp onto the papers (live, with soft shadows)
  const deskLight = new THREE.SpotLight(0xffb066, 0, 3.2, .95, .7, 1.5);
  deskLight.position.set(.78, 1.16, -4.72); deskLight.target.position.set(-.25, .82, -4.5);
  deskLight.castShadow = true; deskLight.shadow.mapSize.set(2048, 2048); deskLight.shadow.bias = -.0003; deskLight.shadow.normalBias = .01; deskLight.shadow.radius = 5;
  S.add(deskLight, deskLight.target);
  const cool = new THREE.PointLight(0x8aa6ff, 0, 3, 1.5); cool.position.set(-1.6, 1.6, -4.4); S.add(cool);
  return {
    group, items,
    show(v) { group.visible = v; },
    update(lampV) { deskLight.intensity = group.visible ? lampV * 7 : 0; cool.intensity = group.visible ? .5 : 0; },
  };
}
