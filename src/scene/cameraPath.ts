import * as THREE from 'three';

type Vec3 = readonly [number, number, number];

interface Shot {
  cam: Vec3;
  look: Vec3;
}

/** One camera shot per page section, in order. Keep this list the same length as the sections in index.html. */
export const SHOTS: readonly Shot[] = [
  { cam: [0, 2.4, 10.5], look: [-1.6, 2.3, 0] }, // home: wide, figure right of the title
  { cam: [-1.1, 1.7, 4.6], look: [1.15, 1.55, 0] }, // glamour: close, figure left of the panel
  { cam: [6.5, 5.2, 7.5], look: [-1.2, 1.6, -1] }, // about: high view across the hall
  { cam: [-2.2, 3.2, 6.5], look: [-1.2, 1.7, 0] }, // crew: three-quarter, figure left of the panel
  { cam: [0, 0.7, 5.8], look: [0, 3.3, 0] }, // join: low heroic angle looking up
];

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const smooth = (f: number) => f * f * (3 - 2 * f);

/**
 * Turns scroll position into a fractional shot index.
 * The camera holds on each shot while you read, then moves during the back half of the section.
 */
export class ScrollTracker {
  target = 0;
  private current = 0;

  constructor(
    private readonly sections: HTMLElement[],
    private readonly onSectionChange: (index: number) => void,
  ) {
    window.addEventListener('scroll', () => this.read(), { passive: true });
    window.addEventListener('resize', () => this.read());
    this.read();
  }

  read(): void {
    const y = window.scrollY + window.innerHeight * 0.3;
    const tops = this.sections.map((s) => s.offsetTop);
    let i = 0;
    while (i < tops.length - 1 && y >= (tops[i + 1] ?? Infinity)) i++;

    let f = 0;
    const start = tops[i];
    const end = tops[i + 1];
    if (start !== undefined && end !== undefined) {
      f = (y - start) / (end - start);
      f = Math.min(1, Math.max(0, (f - 0.35) / 0.6));
    }
    this.target = Math.min(SHOTS.length - 1, i + f);
    this.onSectionChange(Math.round(this.target));
  }

  /** Ease toward the scroll target. Pass `instant` for reduced motion. */
  step(instant: boolean): number {
    this.current = instant ? this.target : lerp(this.current, this.target, 0.06);
    return this.current;
  }
}

/** Write the camera position and look target for progress `p` into the given vectors. */
export function sampleShot(p: number, aspect: number, outCam: THREE.Vector3, outLook: THREE.Vector3): void {
  const k = Math.min(SHOTS.length - 2, Math.floor(p));
  const f = smooth(Math.min(1, p - k));
  const a = SHOTS[k]!;
  const b = SHOTS[k + 1]!;

  outLook.set(lerp(a.look[0], b.look[0], f), lerp(a.look[1], b.look[1], f), lerp(a.look[2], b.look[2], f));
  outCam.set(lerp(a.cam[0], b.cam[0], f), lerp(a.cam[1], b.cam[1], f), lerp(a.cam[2], b.cam[2], f));

  // On tall phone screens, center the figure and pull the camera back so it fits.
  if (aspect < 1) {
    outLook.x *= 0.15;
    outCam.sub(outLook).multiplyScalar(1 + (1 - aspect) * 1.2).add(outLook);
  }
}
