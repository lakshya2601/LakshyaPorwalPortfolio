// Stand-in detective (until the photo-based 3D model is ready). Styled on Lakshya:
// swept-up quiff, short full beard, ear hoop, trench coat.
export function buildDetective(THREE) {
  const M = (c, r = .8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const add = (g, mat, x, y, z, p) => { const o = new THREE.Mesh(g, mat); o.position.set(x, y, z); p.add(o); return o; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const root = new THREE.Group();
  const skin = M(0xa8693f, .6), hairM = M(0x17110e, .8), beardM = M(0x1d1510, .95), shirtM = M(0x1b2233, .75), tieM = M(0x6b1f1f, .6), trench = M(0xa07a4d, .82);
  const body = new THREE.Group(); body.position.y = .62; root.add(body);
  const torso = add(new THREE.CapsuleGeometry(.34, .42, 6, 20), trench, 0, .42, 0, body); torso.scale.set(1.12, 1, .74);
  add(new THREE.CylinderGeometry(.16, .24, .42, 16), shirtM, 0, .62, .12, body).scale.set(1, 1, .6);
  add(B(.07, .34, .03), tieM, 0, .58, .25, body).rotation.x = -.15;
  add(B(.16, .42, .04), trench, -.13, .62, .23, body).rotation.set(-.2, 0, -.35);
  add(B(.16, .42, .04), trench, .13, .62, .23, body).rotation.set(-.2, 0, .35);
  function arm(side) {
    const g = new THREE.Group(); g.position.set(side * .42, .72, 0); body.add(g);
    add(new THREE.CapsuleGeometry(.105, .36, 4, 12), trench, 0, -.2, .05, g).rotation.x = .5;
    add(new THREE.CapsuleGeometry(.095, .34, 4, 12), trench, -side * .1, -.42, .36, g).rotation.set(1.45, 0, side * .45);
    add(new THREE.SphereGeometry(.08, 14, 10), skin, -side * .24, -.45, .58, g).scale.set(1, .7, 1.2);
    return g;
  }
  arm(-1); const armR = arm(1);
  const pen = add(new THREE.CylinderGeometry(.01, .01, .17, 8), M(0x111111, .3, .6), -.24, -.42, .62, armR); pen.rotation.set(1.2, 0, .3);
  add(new THREE.CylinderGeometry(.1, .11, .16, 14), skin, 0, .95, .02, body);
  const head = new THREE.Group(); head.position.set(0, 1.27, .04); body.add(head);
  add(new THREE.SphereGeometry(.27, 32, 24), skin, 0, 0, 0, head).scale.set(.92, 1.04, .96);
  add(new THREE.SphereGeometry(.22, 28, 20), skin, 0, -.11, .04, head).scale.set(1, .85, .95);
  add(new THREE.SphereGeometry(.262, 32, 20, 0, Math.PI, Math.PI * .57, Math.PI * .38), beardM, 0, -.02, .02, head).scale.set(.96, 1.06, 1.04);
  add(new THREE.SphereGeometry(.11, 16, 12), beardM, 0, -.24, .15, head).scale.set(1.3, .75, .85);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(.266, 16, 12, s < 0 ? 0 : Math.PI - .5, .5, Math.PI * .38, Math.PI * .3), beardM, 0, 0, 0, head).scale.set(.93, 1.05, .98);
  add(new THREE.TorusGeometry(.08, .026, 8, 18, Math.PI), beardM, 0, -.095, .226, head).scale.set(1, .45, .7);
  const smile = add(new THREE.TorusGeometry(.045, .012, 6, 14, Math.PI), M(0xf3eee6, .4), 0, -.128, .252, head); smile.rotation.z = Math.PI; smile.scale.set(1, .6, .5);
  add(new THREE.SphereGeometry(.034, 14, 10), skin, 0, -.035, .252, head).scale.set(1, 1.15, 1.2);
  const eyes = [];
  for (const s of [-1, 1]) {
    const w = add(new THREE.SphereGeometry(.036, 16, 12), M(0xf2ece2, .3), s * .085, .045, .22, head); w.scale.set(1.1, .75, .55);
    const p = add(new THREE.SphereGeometry(.019, 12, 10), M(0x1a0e08, .15), s * .085, .042, .236, head); eyes.push(w, p);
    const lid = add(new THREE.SphereGeometry(.039, 16, 10, 0, Math.PI * 2, 0, Math.PI * .42), skin, s * .085, .05, .221, head); lid.scale.set(1.12, .8, .6); lid.rotation.x = .25;
    add(B(.11, .028, .03), hairM, s * .09, .112, .238, head).rotation.z = -s * .1;
    add(new THREE.SphereGeometry(.05, 12, 10), skin, s * .25, -.01, -.01, head).scale.set(.45, 1, .75);
  }
  add(new THREE.TorusGeometry(.02, .005, 6, 16), M(0xdddddd, .15, 1), -.262, -.065, 0, head).rotation.y = Math.PI / 2;
  const hair = new THREE.Group(); head.add(hair);
  add(new THREE.SphereGeometry(.285, 32, 18, 0, Math.PI * 2, 0, Math.PI * .36), hairM, 0, .015, -.025, hair).scale.set(.95, 1.08, 1);
  add(new THREE.SphereGeometry(.276, 32, 12, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, Math.PI * .3, Math.PI * .24), hairM, 0, 0, -.005, hair).scale.set(.94, 1.05, .98);
  [[0, .25, .06, .15], [.09, .25, 0, .13], [-.09, .245, 0, .13], [.02, .26, -.1, .15], [-.04, .2, -.18, .14], [.06, .2, -.18, .14]]
    .forEach(([x, y, z, r]) => add(new THREE.SphereGeometry(r, 16, 12), hairM, x, y, z, hair).scale.set(1.15, .7, 1));
  const q = add(new THREE.SphereGeometry(.12, 18, 12), hairM, .02, .29, .12, hair); q.scale.set(1.55, .62, .85); q.rotation.x = -.45;
  add(new THREE.SphereGeometry(.09, 14, 10), hairM, .1, .27, .16, hair).scale.set(1.2, .6, .8);

  let blinkT = 2;
  function update(t, dt, { yaw, pitch }) {
    const breath = Math.sin(t * 1.6) * .012; torso.scale.y = 1 + breath; head.position.y = 1.27 + breath * .6;
    head.rotation.y += (yaw - head.rotation.y) * .08; head.rotation.x += (pitch - head.rotation.x) * .1;
    body.rotation.z = Math.sin(t * .7) * .01;
    pen.rotation.y = Math.sin(t * 6) * .15 * (Math.sin(t * .5) > .3 ? 1 : 0);
    blinkT -= dt; const bl = blinkT < .12 ? .1 : 1; if (blinkT < 0) blinkT = 2 + Math.random() * 3;
    eyes.forEach((e, i) => { e.scale.y = (i % 2 ? 1 : .75) * bl; });
  }
  return { root, update };
}
