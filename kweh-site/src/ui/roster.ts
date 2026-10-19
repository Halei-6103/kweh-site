import type { Member } from '../config';
import { byId } from './dom';

export function renderRoster(members: Member[], featured: Member): void {
  const root = byId('roster');
  root.replaceChildren(
    ...members.map((m) => {
      const card = document.createElement('div');
      card.className = 'card' + (m === featured ? ' star' : '');

      if (m.thumb) {
        const img = document.createElement('img');
        img.className = 'face';
        img.alt = '';
        img.src = m.thumb;
        img.loading = 'lazy';
        card.append(img);
      } else {
        const blank = document.createElement('div');
        blank.className = 'face blank';
        blank.setAttribute('aria-hidden', 'true');
        blank.textContent = m.name.charAt(0);
        card.append(blank);
      }

      const pill = document.createElement('span');
      pill.className = `pill ${m.role}`;
      pill.style.alignSelf = 'flex-start';
      pill.textContent = m.role;

      const name = document.createElement('span');
      name.className = 'n';
      name.textContent = m.name;

      const job = document.createElement('span');
      job.className = 'j';
      job.textContent = m.job;

      card.append(pill, name, job);
      return card;
    }),
  );
}
