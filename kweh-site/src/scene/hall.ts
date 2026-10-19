import * as THREE from 'three';
import { beamTexture, glowTexture, runeTexture } from './textures';

export const DAIS_TOP = 0.28;

export interface Hall {
  /** `pulse` runs 0 to 1 over a click burst, or is null when idle. */
  update(t: number, motion: number, pulse: number | null): void;
}

/** Seeded random so the ruins land in the same spots on every load. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Legacy-tuned intensities scaled for three's physically based lights. */
const PI = Math.PI;

export function buildHall(scene: THREE.Scene): Hall {
  const rnd = seeded(11);

  // lights
  scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x05060a, 0.5 * PI));
  const key = new THREE.SpotLight(0xbfe6ff, 3.2 * PI, 30, 0.42, 0.55, 1.2);
  key.position.set(0, 12, 1);
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  const glow = new THREE.PointLight(0x8f74ff, 2.4 * PI, 9, 1.6);
  glow.position.set(0, 0.6, 0.4);
  scene.add(glow);
  const rimL = new THREE.PointLight(0x7fd8ff, 1.2 * PI, 14, 1);
  rimL.position.set(-5, 3, -3);
  const rimR = new THREE.PointLight(0xd8b25c, 1.0 * PI, 14, 1);
  rimR.position.set(5, 2.5, -2);
  scene.add(rimL, rimR);

  // polished floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x0c0f17, roughness: 0.32, metalness: 0.7 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // rune circle
  const runeMat = new THREE.MeshBasicMaterial({
    map: runeTexture(),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2), runeMat);
  rune.rotation.x = -Math.PI / 2;
  rune.position.y = 0.02;
  scene.add(rune);
  void document.fonts?.ready.then(() => {
    runeMat.map?.dispose();
    runeMat.map = runeTexture();
    runeMat.needsUpdate = true;
  });

  // dais
  const stone = new THREE.MeshStandardMaterial({ color: 0x161b27, roughness: 0.6, metalness: 0.4, flatShading: true });
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.28, 12), stone);
  dais.position.y = 0.14;
  scene.add(dais);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.025, 6, 64), new THREE.MeshBasicMaterial({ color: 0xd8b25c }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = DAIS_TOP + 0.005;
  scene.add(lip);

  // ruined pillars
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const broken = i % 3 === 1;
    const h = broken ? 2.5 + rnd() * 2 : 9;
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, h, 8), stone);
    shaft.position.y = h / 2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.4, 1.25), stone);
    base.position.y = 0.2;
    g.add(shaft, base);
    if (broken) {
      shaft.rotation.z = (rnd() - 0.5) * 0.15;
    } else {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), stone);
      cap.position.y = h;
      g.add(cap);
    }
    g.position.set(Math.sin(a) * 7.2, 0, Math.cos(a) * 7.2 - 1.5);
    scene.add(g);
  }

  // rubble
  for (let i = 0; i < 18; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + rnd() * 0.35, 0), stone);
    const a = rnd() * Math.PI * 2;
    const d = 3.5 + rnd() * 4;
    rock.position.set(Math.sin(a) * d, 0.12, Math.cos(a) * d - 1);
    rock.rotation.set(rnd() * 3, rnd() * 3, 0);
    scene.add(rock);
  }

  // light shaft from above
  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTexture(),
    color: 0x9fd6ff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.35, 12, 32, 1, true), beamMat);
  beam.position.y = 6;
  scene.add(beam);

  // violet halo behind the figure
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture('rgba(143,116,255,.75)'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
  halo.scale.set(4.2, 5.2, 1);
  halo.position.set(0, DAIS_TOP + 1.25, -0.25);
  scene.add(halo);

  // floating crystals
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x7fd8ff,
    emissive: 0x2a6a9a,
    emissiveIntensity: 1.1,
    roughness: 0.15,
    metalness: 0.2,
    flatShading: true,
    transparent: true,
    opacity: 0.9,
  });
  interface Orbit { a: number; r: number; y: number; speed: number; phase: number }
  const crystals: { mesh: THREE.Mesh; orbit: Orbit }[] = [];
  for (let i = 0; i < 9; i++) {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 + rnd() * 0.2, 0), crystalMat);
    mesh.scale.y = 2.2;
    const orbit = { a: (i / 9) * Math.PI * 2, r: 2.2 + rnd() * 1.6, y: 1 + rnd() * 2.6, speed: 0.15 + rnd() * 0.2, phase: rnd() * 6 };
    scene.add(mesh);
    crystals.push({ mesh, orbit });
  }
  const bigCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), crystalMat);
  bigCrystal.scale.y = 2.4;
  bigCrystal.position.set(0, 4.6, -0.4);
  scene.add(bigCrystal);

  // aether motes rising through the hall
  const MOTES = 700;
  const positions = new Float32Array(MOTES * 3);
  const motes = Array.from({ length: MOTES }, () => ({
    a: rnd() * Math.PI * 2,
    r: Math.pow(rnd(), 0.6) * 6.5,
    phase: rnd(),
    speed: 0.2 + rnd() * 0.5,
  }));
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(
    new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        map: glowTexture('rgba(200,235,255,1)'),
        color: 0xbfe6ff,
        size: 0.09,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );

  // shockwave ring for clicks
  const waveMat = new THREE.MeshBasicMaterial({
    color: 0xbfe6ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 64), waveMat);
  wave.rotation.x = -Math.PI / 2;
  wave.position.y = DAIS_TOP + 0.02;
  scene.add(wave);

  return {
    update(t, motion, pulse) {
      const burst = pulse === null ? 0 : 1 - pulse;
      halo.material.opacity = Math.min(1, 0.85 + Math.sin(t * 1.6) * 0.15 * motion + burst * 0.8);
      glow.intensity = (2.4 + Math.sin(t * 1.6) * 0.4 * motion + burst * 6) * PI;
      beamMat.opacity = 0.2 + Math.sin(t * 0.9) * 0.04 * motion + burst * 0.35;
      waveMat.opacity = burst * 0.9;
      wave.scale.setScalar(pulse === null ? 1 : 1 + pulse * 6);

      rune.rotation.z = t * 0.05 * motion;

      for (const { mesh, orbit } of crystals) {
        const a = orbit.a + t * orbit.speed * motion;
        mesh.position.set(Math.sin(a) * orbit.r, orbit.y + Math.sin(t * 0.8 + orbit.phase) * 0.25 * motion, Math.cos(a) * orbit.r - 0.3);
        mesh.rotation.y = t * 0.6 * motion + orbit.phase;
      }
      bigCrystal.rotation.y = t * 0.3 * motion;
      bigCrystal.position.y = 4.6 + Math.sin(t * 0.7) * 0.15 * motion;

      motes.forEach((m, i) => {
        const life = (t * 0.05 * m.speed * motion + m.phase) % 1;
        const spin = m.a + t * 0.05 * motion;
        positions[i * 3] = Math.sin(spin) * m.r;
        positions[i * 3 + 1] = life * (m.r < 1.4 ? 7 : 4.5) + 0.1;
        positions[i * 3 + 2] = Math.cos(spin) * m.r - 0.3;
      });
      moteGeo.attributes.position!.needsUpdate = true;
    },
  };
}
