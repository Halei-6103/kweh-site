import * as THREE from 'three';
import type { Member } from '../config';
import { DAIS_TOP } from './hall';
import { nameplate } from './textures';

/** Height of the figure in world units; width follows the image's aspect ratio. */
const HEIGHT = 2.55;

export interface Figure {
  /** The clickable mesh, or null until the cutout has loaded. */
  readonly hitTarget: THREE.Mesh | null;
  update(t: number, motion: number, pulse: number | null, camera: THREE.Vector3): void;
}

/** The week's glamour: a screenshot cutout standing on the dais, always turned toward the camera. */
export function createFigure(scene: THREE.Scene, member: Member): Figure {
  const group = new THREE.Group();
  group.position.y = DAIS_TOP;
  scene.add(group);

  const plate = nameplate(member);
  plate.position.y = HEIGHT + 0.42;
  group.add(plate);

  let mesh: THREE.Mesh | null = null;

  if (member.photo) {
    new THREE.TextureLoader().load(member.photo, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      const img = tex.image as { width: number; height: number };
      const width = (HEIGHT * img.width) / img.height;

      mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, HEIGHT),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide }),
      );
      mesh.position.y = HEIGHT / 2;

      // faint mirror image on the polished floor
      const reflection = new THREE.Mesh(
        new THREE.PlaneGeometry(width, HEIGHT),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.12, depthWrite: false }),
      );
      reflection.scale.y = -1;
      reflection.position.y = -HEIGHT / 2 - 0.02;

      group.add(mesh, reflection);
    });
  }

  return {
    get hitTarget() {
      return mesh;
    },
    update(t, motion, pulse, camera) {
      group.rotation.y = Math.atan2(camera.x - group.position.x, camera.z - group.position.z);
      const lift = pulse === null ? 0 : Math.sin(pulse * Math.PI) * 0.25;
      group.position.y = DAIS_TOP + Math.sin(t * 1.1) * 0.03 * motion + lift;
    },
  };
}
