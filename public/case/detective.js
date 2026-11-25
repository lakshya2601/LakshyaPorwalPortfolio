// The detective: Lakshya's stylized character (Meshy, CC BY 4.0), Mixamo skeleton.
// Posed procedurally: seated at the desk, hands on the typewriter, head follows the cursor.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export function loadDetective(THREE, manager, url, POSE) {
  const root = new THREE.Group();
  const api = { root, ready: false, update() {} };
  const loader = new GLTFLoader(manager); loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(url, (g) => {
    const model = g.scene; root.add(model);
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const m = o.material; m.side = THREE.FrontSide; m.envMapIntensity = .4;
        if (m.map) m.map.anisotropy = 8;
      }
    });
    const bones = {};
    model.traverse((o) => { if (o.isBone) bones[o.name.replace('mixamorig:', '').replace('mixamorig', '')] = o; });
    const b = (n) => bones[n];
    const tmpQ = new THREE.Quaternion(), pq = new THREE.Quaternion(), ax = new THREE.Vector3();
    // rotate a bone around a WORLD axis (keeps code readable regardless of bone-local axes)
    function rotW(bone, axis, deg) {
      if (!bone) return;
      bone.parent.updateWorldMatrix(true, false);
      bone.parent.getWorldQuaternion(pq);
      ax.copy(axis).applyQuaternion(pq.clone().invert());
      tmpQ.setFromAxisAngle(ax, deg * Math.PI / 180);
      bone.quaternion.premultiply(tmpQ);
    }
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
    model.updateMatrixWorld(true);
    const hipsY0 = b('Hips').getWorldPosition(new THREE.Vector3()).y;
    function applyPose() {
      const P = POSE;
      // seated: hips down to the seat, thighs forward, shins down
      const hp = b('Hips').getWorldPosition(new THREE.Vector3()); hp.y = P.hipY; hp.z += P.hipZ || 0;
      b('Hips').parent.updateWorldMatrix(true, false); b('Hips').position.copy(b('Hips').parent.worldToLocal(hp));
      for (const s of ['Left', 'Right']) {
        const sg = s === 'Left' ? 1 : -1;
        rotW(b(s + 'UpLeg'), X, -P.thigh); rotW(b(s + 'UpLeg'), Z, sg * P.legSpread);
        rotW(b(s + 'Leg'), X, P.knee);
        rotW(b(s + 'Foot'), X, -P.foot);
        // arms: down from A-pose, forward onto the desk, elbows bent, hands inward
        rotW(b(s + 'Arm'), Z, -sg * P.armDown);
        rotW(b(s + 'Arm'), X, -P.armFwd);
        rotW(b(s + 'Arm'), Y, sg * P.armIn);
        rotW(b(s + 'ForeArm'), X, -P.elbow);
        rotW(b(s + 'ForeArm'), Y, sg * P.foreIn);
        rotW(b(s + 'ForeArm'), Z, -sg * P.twist);
        rotW(b(s + 'Hand'), X, P.wrist);
      }
      rotW(b('Spine'), X, P.lean);
    }
    applyPose();
    const base = {};
    for (const n of ['Spine1', 'Spine2', 'Neck', 'Head', 'LeftHand', 'RightHand', 'LeftForeArm', 'RightForeArm']) if (b(n)) base[n] = b(n).quaternion.clone();
    api.bones = bones; api.ready = true; api.model = model;
    api.update = (t, dt, { yaw, pitch, typing = 0 }) => {
      for (const n in base) b(n).quaternion.copy(base[n]);
      const br = Math.sin(t * 1.6);
      rotW(b('Spine2'), X, br * 1.2);
      rotW(b('Neck'), Y, yaw * 22); rotW(b('Head'), Y, yaw * 30);
      rotW(b('Neck'), X, pitch * 14); rotW(b('Head'), X, pitch * 20);
      rotW(b('Head'), Z, Math.sin(t * .5) * 1.5);
      if (typing > 0) {
        const tl = Math.max(0, Math.sin(t * 17)) * typing, tr = Math.max(0, Math.sin(t * 17 + 2.1)) * typing;
        rotW(b('LeftHand'), X, tl * 9); rotW(b('RightHand'), X, tr * 9);
        rotW(b('LeftForeArm'), X, tl * 2); rotW(b('RightForeArm'), X, tr * 2);
      }
    };
  });
  return api;
}

export const POSE = { hipY: .74, hipZ: .1, thigh: 88, knee: 85, foot: 0, legSpread: 4, armDown: 38, armFwd: 50, armIn: 26, elbow: 50, foreIn: 34, twist: 80, wrist: 10, lean: 10 };
