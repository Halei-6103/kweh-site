import * as THREE from 'three';
import type { Member } from '../config';
import { prefersReducedMotion } from '../ui/dom';
import { ScrollTracker, sampleShot } from './cameraPath';
import { createFigure } from './figure';
import { buildHall } from './hall';

const VOID = 0x06080d;
const PULSE_SECONDS = 1.4;

interface HallOptions {
  canvas: HTMLCanvasElement;
  featured: Member;
  sections: HTMLElement[];
  navLinks: HTMLAnchorElement[];
}

/** Boot the 3D hall. Falls back to a flat background if WebGL is unavailable. */
export function startHall({ canvas, featured, sections, navLinks }: HallOptions): void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    document.body.classList.add('no3d');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VOID);
  scene.fog = new THREE.FogExp2(VOID, 0.055);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);

  const reduce = prefersReducedMotion();
  const motion = reduce ? 0 : 1;

  const hall = buildHall(scene);
  const figure = createFigure(scene, featured);
  const scroll = new ScrollTracker(sections, (active) => {
    navLinks.forEach((a, i) => a.classList.toggle('on', i === active));
  });

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  // click the figure for an aether pulse
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pulseAt = -Infinity;

  const overFigure = (ev: MouseEvent): boolean => {
    const target = figure.hitTarget;
    if (!target) return false;
    pointer.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(target, false).length > 0;
  };
  const onUi = (ev: Event) => ev.target instanceof Element && ev.target.closest('.panel, .topbar, a, button') !== null;

  window.addEventListener(
    'pointermove',
    (ev) => {
      document.body.style.cursor = !onUi(ev) && overFigure(ev) ? 'pointer' : '';
    },
    { passive: true },
  );
  window.addEventListener('click', (ev) => {
    if (!onUi(ev) && overFigure(ev)) pulseAt = clock.getElapsedTime();
  });

  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    const p = scroll.step(reduce);

    sampleShot(p, camera.aspect, camPos, look);
    camPos.x += Math.sin(t * 0.2) * 0.25 * motion;
    camPos.y += Math.sin(t * 0.27) * 0.08 * motion;
    camera.position.copy(camPos);
    camera.lookAt(look);

    const since = (t - pulseAt) / PULSE_SECONDS;
    const pulse = since >= 0 && since < 1 ? since : null;

    hall.update(t, motion, pulse);
    figure.update(t, motion, pulse, camPos);
    renderer.render(scene, camera);
  });
}
