import * as THREE from 'three';
import { ROLE_COLORS, type Member } from '../config';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('2D canvas not supported');
  return [cv, ctx];
}

function srgb(tex: THREE.Texture): THREE.Texture {
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Engraved rune circle under the dais. Redraw after fonts load so the lettering uses Cinzel. */
export function runeTexture(): THREE.CanvasTexture {
  const S = 1024;
  const [cv, x] = canvas(S, S);
  x.translate(S / 2, S / 2);
  x.strokeStyle = 'rgba(216,178,92,0.9)';
  x.fillStyle = 'rgba(216,178,92,0.9)';

  const ring = (r: number, w: number) => {
    x.lineWidth = w;
    x.beginPath();
    x.arc(0, 0, r, 0, Math.PI * 2);
    x.stroke();
  };
  ring(500, 6);
  ring(470, 2);
  ring(330, 3);
  ring(312, 1.5);
  ring(160, 2);

  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    const len = major ? 34 : 14;
    x.lineWidth = major ? 4 : 2;
    x.beginPath();
    x.moveTo(Math.cos(a) * 470, Math.sin(a) * 470);
    x.lineTo(Math.cos(a) * (470 - len), Math.sin(a) * (470 - len));
    x.stroke();
  }

  x.font = '700 40px Cinzel, Georgia, serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const words = '✦ KWEH ✦ GLAMOUR OF THE WEEK ✦ KWEH ✦ GLAMOUR OF THE WEEK ';
  [...words].forEach((ch, i, all) => {
    x.save();
    x.rotate((i / all.length) * Math.PI * 2);
    x.translate(0, -400);
    x.fillText(ch, 0, 0);
    x.restore();
  });

  // two interlocking triangles inside the inner ring
  x.lineWidth = 2.5;
  for (let k = 0; k < 2; k++) {
    x.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * Math.PI * 2 + (k * Math.PI) / 3 - Math.PI / 2;
      const px = Math.cos(a) * 312;
      const py = Math.sin(a) * 312;
      if (i === 0) x.moveTo(px, py);
      else x.lineTo(px, py);
    }
    x.stroke();
  }

  return srgb(new THREE.CanvasTexture(cv)) as THREE.CanvasTexture;
}

/** Vertical fade for the light shaft: transparent at the top, bright at the floor. */
export function beamTexture(): THREE.CanvasTexture {
  const [cv, x] = canvas(64, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.6, 'rgba(255,255,255,.35)');
  g.addColorStop(1, 'rgba(255,255,255,.9)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 256);
  return srgb(new THREE.CanvasTexture(cv)) as THREE.CanvasTexture;
}

/** Soft radial glow, used for the halo and the aether motes. */
export function glowTexture(color: string): THREE.CanvasTexture {
  const [cv, x] = canvas(256, 256);
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return srgb(new THREE.CanvasTexture(cv)) as THREE.CanvasTexture;
}

/** In-game style nameplate: name over the «KWEH» tag, with a role-colored dot. */
export function nameplate(member: Member): THREE.Sprite {
  const [cv, x] = canvas(1024, 200);
  const tex = srgb(new THREE.CanvasTexture(cv));
  const tag = '«KWEH»';

  const draw = () => {
    x.clearRect(0, 0, 1024, 200);
    x.textAlign = 'center';
    x.shadowColor = 'rgba(0,0,0,.9)';
    x.shadowBlur = 14;
    x.font = '700 64px Cinzel, Georgia, serif';
    x.fillStyle = '#f6e3a6';
    x.fillText(member.name, 512, 86);
    x.font = '500 38px "JetBrains Mono", monospace';
    x.fillStyle = '#7fd8ff';
    x.fillText(tag, 512, 152);
    const w = x.measureText(tag).width;
    x.fillStyle = ROLE_COLORS[member.role];
    x.beginPath();
    x.arc(512 - w / 2 - 26, 139, 11, 0, Math.PI * 2);
    x.fill();
    tex.needsUpdate = true;
  };
  draw();
  void document.fonts?.ready.then(draw);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(2.6, 0.51, 1);
  return sprite;
}
