# KWEH! faction site

Vite + TypeScript + Three.js. A 3D hall with the Glamour of the Week on a lit dais, a scroll-driven camera, and a live vote for next week's pick.

## Run it

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build      # type-check + production build into dist/
npm run preview    # serve the built site locally
```

The site runs fine without a backend. Voting just shows "not connected" until you do the Supabase setup below.

## Project layout

```
index.html              page markup
src/
  main.ts               boots everything
  config.ts             <- edit this: world, Discord, members, featured glamour
  styles.css            design tokens + styles
  scene/
    index.ts            renderer, render loop, click pulse
    hall.ts             the environment: lights, dais, pillars, crystals, motes
    figure.ts           the featured glamour cutout + nameplate
    cameraPath.ts       one camera shot per section, scroll tracking
    textures.ts         canvas-drawn runes, glows, nameplates
  ui/
    content.ts          fills text from config, copy-invite button
    roster.ts           crew cards
    vote.ts             Glamour of the Week ballot
  lib/supabase.ts       Supabase client (null when no keys)
public/glamour/         character cutouts (transparent webp/png)
supabase/schema.sql     votes table + security rules
```

## Rotate the Glamour of the Week

1. Put the winner's cutout in `public/glamour/` (transparent background, full body, portrait).
2. In `src/config.ts`, set `photo` (and `thumb` for the roster card) on their member entry.
3. Update `featured`, `week` (the new Monday, e.g. `2026-10-26`), and `weekLabel`.

Changing `week` starts a fresh ballot. Old votes stay in the database but stop counting.

## Hook up voting (Supabase, free tier)

1. Create a project at https://supabase.com.
2. **SQL Editor > New query**, paste `supabase/schema.sql`, and run it.
3. **Authentication > Sign In / Providers**: turn on **Allow anonymous sign-ins**.
4. **Project Settings > API**: copy the Project URL and the `anon` public key.
5. Copy `.env.example` to `.env` and paste them in.
6. Restart `npm run dev`.

The anon key is meant to be public. The row level security in `schema.sql` makes sure people can only cast or change their own vote.

Anonymous sign-in means one vote per browser, which is fine for a friendly faction. To make it one per person, swap in Discord login (Supabase supports it under Auth Providers) and call `signInWithOAuth({ provider: 'discord' })` in `src/ui/vote.ts`.

## Deploy

Any static host works. Run `npm run build` and upload `dist/`.

- **Netlify / Vercel:** connect the repo, build command `npm run build`, output `dist`. Add the two `VITE_SUPABASE_*` variables in the host's environment settings.
- **GitHub Pages:** if the site lives at `username.github.io/repo-name/`, set `base: '/repo-name/'` in a `vite.config.ts`.

Fan-made. Not affiliated with Square Enix.
