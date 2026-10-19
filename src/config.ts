/**
 * Everything you edit week to week lives here.
 * To rotate the Glamour of the Week:
 *   1. Drop the winner's cutout into public/glamour/
 *   2. Set `photo` (and optional `thumb`) on their member entry
 *   3. Update `featured`, `week` and `weekLabel` below
 */

export type Role = 'Tank' | 'Healer' | 'DPS';

export interface Member {
  name: string;
  job: string;
  role: Role;
  /** Full-body cutout with a transparent background, served from /public. */
  photo?: string;
  /** Head-and-shoulders crop for the roster card. */
  thumb?: string;
}

export interface SiteConfig {
  world: string;
  dataCenter: string;
  discord: string;
  /** Monday of the current glamour week. Votes are counted per week, so changing this starts a fresh ballot. */
  week: string;
  weekLabel: string;
  /** Must match a `name` in MEMBERS. */
  featured: string;
}

/** Prefix public files with the site's base path so they work on GitHub Pages. */
const asset = (path: string) => import.meta.env.BASE_URL + path;

export const CONFIG: SiteConfig = {
  world: 'Your World',
  dataCenter: 'Your Data Center',
  discord: 'discord.gg/your-invite',
  week: '2026-10-19',
  weekLabel: 'Week of Oct 19',
  featured: 'Ian_Uzumaki',
};

export const MEMBERS: Member[] = [
  {
    name: 'Ian_Uzumaki',
    job: 'Ninja',
    role: 'DPS',
    photo: asset('glamour/ian-uzumaki.webp'),
    thumb: asset('glamour/ian-uzumaki-thumb.webp'),
  },
  { name: 'Bram Oakhollow', job: 'White Mage', role: 'Healer' },
  { name: 'Kiko Pebblebottom', job: 'Black Mage', role: 'DPS' },
  { name: 'Vesna Talon', job: 'Dragoon', role: 'DPS' },
  { name: 'Ox Ironside', job: 'Warrior', role: 'Tank' },
  { name: 'Juniper Vale', job: 'Scholar', role: 'Healer' },
];

export const ROLE_COLORS: Record<Role, string> = {
  Tank: '#5b8fe8',
  Healer: '#63c47e',
  DPS: '#e5625a',
};

export function featuredMember(): Member {
  const found = MEMBERS.find((m) => m.name === CONFIG.featured) ?? MEMBERS[0];
  if (!found) throw new Error('MEMBERS is empty. Add at least one member in src/config.ts.');
  return found;
}

/** Everyone except this week's winner can be voted in for next week. */
export function nominees(): string[] {
  const feat = featuredMember();
  return MEMBERS.filter((m) => m !== feat).map((m) => m.name);
}
