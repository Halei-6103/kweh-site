import { CONFIG, type Member } from '../config';
import { byId } from './dom';

/** Fill the text that comes from config: world line, featured glamour, join details. */
export function fillContent(featured: Member): void {
  byId('worldline').textContent = `${CONFIG.world} · ${CONFIG.dataCenter} · recruiting`;
  byId('joinworld').textContent = `Send any of us a /tell on ${CONFIG.world}. We answer.`;
  byId('invite').textContent = CONFIG.discord;
  byId('weekline').textContent = `Glamour of the Week · ${CONFIG.weekLabel}`;
  byId('featName').textContent = featured.name;
  const role = byId('featRole');
  role.textContent = featured.role;
  role.classList.add(featured.role);
  byId('featJob').textContent = featured.job;
}

export function setupCopyInvite(): void {
  const button = byId<HTMLButtonElement>('copybtn');
  const code = byId('invite');
  const flash = (label: string) => {
    button.textContent = label;
    window.setTimeout(() => (button.textContent = 'Copy invite'), 1600);
  };
  const selectFallback = () => {
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    flash('Press Ctrl+C');
  };
  button.addEventListener('click', () => {
    if (!navigator.clipboard) return selectFallback();
    navigator.clipboard.writeText(CONFIG.discord).then(() => flash('Copied'), selectFallback);
  });
}
